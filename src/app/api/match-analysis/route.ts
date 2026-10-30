import { after, NextResponse } from "next/server"
import { ID, Query } from "node-appwrite"
import { getCurrentUser, isAdmin } from "@/lib/auth"
import { createAdminClient } from "@/lib/appwrite-server"
import { getMatch } from "@/lib/actions/matches"
import { getPlayersByIds } from "@/lib/actions/players"
import { env } from "@/lib/env"
import type { Player, PointDetail } from "@/lib/types"
import { buildMatchInsights, type Side } from "@/lib/utils/match-insights"
import { normalizeMatchFormat } from "@/lib/utils/match-format"
import { formatPlayerRating } from "@/lib/utils/player-rating"
import { analysisPrompt, analysisState, analysisSystemPrompt, ANALYSIS_SCHEMA, parseAnalysis, type AnalysisPlayer, type StoredAnalysis } from "@/lib/ai/match-analysis"
import { generateJson, GeminiError } from "@/lib/ai/gemini"

export const dynamic = "force-dynamic"
// The analysis is written after the response, inside this function's time: Gemini can take half
// a minute, and a busy model hands over to the next one
export const maxDuration = 60

const COLLECTION = process.env.APPWRITE_MATCH_ANALYSES_COLLECTION_ID || "match_analyses"

/** Only the two admin accounts may read or create analyses; the button being hidden is not the check */
async function admin() {
  const user = await getCurrentUser()
  return user && isAdmin(user.email) ? user : null
}

async function stored(matchId: string): Promise<StoredAnalysis[]> {
  const { databases } = await createAdminClient()
  const result = await databases.listDocuments(env.APPWRITE_DATABASE_ID, COLLECTION, [
    Query.equal("matchId", matchId),
    Query.orderDesc("$createdAt"),
    Query.limit(10),
  ])
  return result.documents as unknown as StoredAnalysis[]
}

/** The newest finished analysis and whether one is being written (or the last attempt failed) */
export async function GET(request: Request) {
  if (!(await admin())) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const matchId = new URL(request.url).searchParams.get("matchId")
  if (!matchId) return NextResponse.json({ error: "matchId missing" }, { status: 400 })
  try {
    return NextResponse.json(analysisState(await stored(matchId)))
  } catch (error) {
    console.error("GET /api/match-analysis failed:", error)
    return NextResponse.json({ saved: null, job: { status: "idle" } })
  }
}

const playerInfo = (players: (Player | undefined)[], fallback: string): AnalysisPlayer => {
  const present = players.filter((p): p is Player => Boolean(p))
  if (!present.length) return { name: fallback }
  if (present.length === 1) {
    const p = present[0]
    return { name: `${p.firstName} ${p.lastName}`.trim(), yearOfBirth: p.yearOfBirth || undefined, rating: formatPlayerRating(p) || undefined, club: p.club || undefined }
  }
  return { name: present.map((p) => `${p.firstName} ${p.lastName}`.trim()).join(" / "), club: [...new Set(present.map((p) => p.club).filter(Boolean))].join(" / ") || undefined }
}

/**
 * Starts an analysis and answers at once: the card says to come back in a few minutes and checks
 * by itself. The work runs after the response and saves the result (or the reason it failed).
 */
export async function POST(request: Request) {
  const user = await admin()
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "not-configured" }, { status: 503 })

  let body: { matchId?: string; locale?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 })
  }
  const matchId = typeof body.matchId === "string" ? body.matchId : ""
  const locale = body.locale === "en" ? "en" : "cs"
  if (!matchId) return NextResponse.json({ error: "matchId missing" }, { status: 400 })

  let match
  try {
    match = await getMatch(matchId)
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const points = (match.pointLog || []).map((raw) => {
    try { return (typeof raw === "string" ? JSON.parse(raw) : raw) as PointDetail } catch { return null }
  }).filter((p): p is PointDetail => p !== null)
  if (points.length < 4) return NextResponse.json({ error: "too few points" }, { status: 422 })

  // A second tap while one is being written changes nothing
  const current = analysisState(await stored(matchId))
  if (current.job.status === "pending") return NextResponse.json(current, { status: 202 })

  const { databases } = await createAdminClient()
  const job = await databases.createDocument(env.APPWRITE_DATABASE_ID, COLLECTION, ID.unique(), {
    matchId, userId: user.$id, locale, model: "", content: "{}", status: "pending",
  })

  after(async () => {
    try {
      const ids = [match.playerOneId, match.playerTwoId, match.playerThreeId, match.playerFourId].filter((id): id is string => Boolean(id) && !id!.startsWith("anonymous-"))
      const byId = ids.length ? await getPlayersByIds(ids) : {}
      const pick = (id?: string) => (id ? byId[id] : undefined)
      const p1 = pick(match.playerOneId), p2 = pick(match.playerTwoId), p3 = pick(match.playerThreeId), p4 = pick(match.playerFourId)
      const insights = buildMatchInsights(points, { format: normalizeMatchFormat(match.matchFormat), detailLevel: match.detailLevel })
      const focus: Side = p2?.isMainPlayer || p4?.isMainPlayer ? "p2" : p1?.isMainPlayer || p3?.isMainPlayer ? "p1" : insights.leader ?? "p1"
      const winner: Side | null = !match.winnerId ? null
        : match.winnerId === match.playerOneId || match.winnerId === match.playerThreeId ? "p1"
        : match.winnerId === match.playerTwoId || match.winnerId === match.playerFourId ? "p2" : null
      const duration = match.startTime && match.endTime ? Math.round((Date.parse(match.endTime) - Date.parse(match.startTime)) / 60000) : null

      const { text, model } = await generateJson({
        system: analysisSystemPrompt(locale),
        prompt: analysisPrompt({
          locale,
          insights,
          players: { p1: playerInfo([p1, p3], "Player 1"), p2: playerInfo([p2, p4], "Player 2") },
          focus,
          winner,
          matchDate: match.matchDate?.slice(0, 10),
          tournamentName: match.tournamentName || undefined,
          durationMinutes: duration && duration > 0 ? duration : null,
          endReason: match.retirementReason || null,
          doubles: Boolean(match.playerThreeId && match.playerFourId),
        }),
        schema: ANALYSIS_SCHEMA,
      })
      const analysis = parseAnalysis(text)
      if (!analysis) throw new GeminiError("failed", `${model}: answer was not a usable analysis`)
      await databases.updateDocument(env.APPWRITE_DATABASE_ID, COLLECTION, job.$id, {
        status: "ready", model, content: JSON.stringify(analysis).slice(0, 8000),
      })
    } catch (error) {
      const reason = error instanceof GeminiError ? error.reason : "failed"
      console.error("Gemini analysis failed:", reason, error instanceof Error ? error.message : error)
      await databases.updateDocument(env.APPWRITE_DATABASE_ID, COLLECTION, job.$id, { status: "failed", error: reason })
        .catch((saveError) => console.error("Could not record the failed analysis:", saveError))
    }
  })

  return NextResponse.json({ saved: current.saved, job: { status: "pending", startedAt: job.$createdAt } }, { status: 202 })
}
