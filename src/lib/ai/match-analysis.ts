import { percent, type MatchInsights, type Side, type SideTotals } from "@/lib/utils/match-insights"

export interface AnalysisPlayer {
  name: string
  yearOfBirth?: number
  rating?: string
  club?: string
}

export interface AnalysisInput {
  locale: string
  insights: MatchInsights
  /** One entry per side; a doubles team is one entry with both names */
  players: Record<Side, AnalysisPlayer>
  /** Whose coach the analysis is written for */
  focus: Side
  /** The stored winner; after a retirement it can be the side that was behind */
  winner?: Side | null
  matchDate?: string
  tournamentName?: string
  durationMinutes?: number | null
  endReason?: string | null
  doubles?: boolean
}

export interface MatchAnalysis {
  summary: string
  strengths: string[]
  improvements: string[]
  trainingTips: string[]
}

/** An analysis as stored and shown: what the model wrote, which model, and when */
export interface SavedAnalysis {
  analysis: MatchAnalysis
  model: string
  createdAt: string
}

/** One stored analysis document: a finished analysis, one being written, or one that failed */
export interface StoredAnalysis {
  content: string
  model: string
  status?: string | null
  error?: string | null
  $createdAt: string
}

export type AnalysisJob =
  | { status: "idle" }
  | { status: "pending"; startedAt: string }
  | { status: "failed"; reason: string }

/** An analysis being written longer than this has died with its server function */
export const ANALYSIS_STALE_MS = 5 * 60_000

/**
 * What the AI card shows: the newest finished analysis (kept while a new one is written or after
 * a later attempt failed) and the state of the newest attempt. Documents come newest first.
 */
export function analysisState(docs: StoredAnalysis[], now = Date.now()): { saved: SavedAnalysis | null; job: AnalysisJob } {
  const ready = docs.find((doc) => (doc.status ?? "ready") === "ready" && parseAnalysis(doc.content))
  const saved = ready ? { analysis: parseAnalysis(ready.content)!, model: ready.model, createdAt: ready.$createdAt } : null
  const latest = docs[0]
  if (!latest || latest === ready) return { saved, job: { status: "idle" } }
  if (latest.status === "pending") {
    return now - Date.parse(latest.$createdAt) < ANALYSIS_STALE_MS
      ? { saved, job: { status: "pending", startedAt: latest.$createdAt } }
      : { saved, job: { status: "failed", reason: "timeout" } }
  }
  if (latest.status === "failed") return { saved, job: { status: "failed", reason: latest.error || "failed" } }
  return { saved, job: { status: "idle" } }
}

/** Gemini structured output: the answer must be exactly this shape */
export const ANALYSIS_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING", description: "3–5 sentences about how the match went" },
    strengths: { type: "ARRAY", items: { type: "STRING" }, description: "2–4 things that worked, each with a number from the data" },
    improvements: { type: "ARRAY", items: { type: "STRING" }, description: "2–3 things to work on, each tied to the data" },
    trainingTips: { type: "ARRAY", items: { type: "STRING" }, description: "1–3 concrete drills for the next training" },
  },
  required: ["summary", "strengths", "improvements", "trainingTips"],
  propertyOrdering: ["summary", "strengths", "improvements", "trainingTips"],
}

export function analysisSystemPrompt(locale: string): string {
  const language = locale === "cs"
    ? "Czech (standard Czech with Czech tennis words: podání, return, brejk, brejkbol, shoda; a game is always \"hra\" – never \"gem\", \"gam\" or \"game\")"
    : "English"
  return [
    "You are an experienced junior tennis coach writing a short post-match analysis for the parents and coach of one player.",
    `Write in ${language}.`,
    "Use only the facts in the data. The data has who won each point, who served, first or second serve and how the point ended (winner, ace, forced or unforced error, double fault). It has no shot types, rally lengths or court positions — never claim anything about forehands, backhands, net play or rally length.",
    "Quote real numbers from the data. Be specific, honest and encouraging; the players are children, so no harsh language.",
    "Write about the focus player; mention the opponent only for context. Scores in the data are written focus player first.",
    "Training tips must be concrete drills (what, how many repetitions, what to focus on) that follow from the numbers.",
    "Keep it short: the summary 3–5 sentences, every list item one or two sentences.",
  ].join("\n")
}

const pct = (part: number, whole: number) => {
  const value = percent(part, whole)
  return value === null ? null : `${value}%`
}

function sideStats(t: SideTotals, hasServeDetail: boolean) {
  return {
    pointsWon: t.points,
    servicePointsWon: pct(t.servePointsWon, t.servePoints),
    returnPointsWon: pct(t.returnPointsWon, t.returnPoints),
    serviceGamesHeld: `${t.serviceGamesHeld}/${t.serviceGames}`,
    breaks: t.breaks,
    breakPointsSaved: `${t.breakPointsSaved}/${t.breakPointsFaced}`,
    breakPointsConverted: `${t.breakPointsWon}/${t.breakPointChances}`,
    deuceGamesWon: t.deuceGamesWon,
    pressurePointsWon: t.pressurePointsWon,
    longestRunOfPoints: t.longestPointRun,
    longestRunOfGames: t.longestGameRun,
    ...(hasServeDetail ? {
      firstServeIn: pct(t.firstServes, t.servePoints),
      firstServePointsWon: pct(t.firstServePointsWon, t.firstServes),
      secondServePointsWon: pct(t.secondServePointsWon, t.secondServes),
      aces: t.aces,
      doubleFaults: t.doubleFaults,
      winners: t.winners,
      unforcedErrors: t.unforcedErrors,
      forcedErrors: t.forcedErrors,
    } : {}),
  }
}

/** The match as compact JSON, told from the focus player's side */
export function analysisPrompt(input: AnalysisInput): string {
  const { insights, players, focus } = input
  const other: Side = focus === "p1" ? "p2" : "p1"
  const pair = (score: [number, number]) => (focus === "p1" ? `${score[0]}:${score[1]}` : `${score[1]}:${score[0]}`)
  const who = (side: Side | null) => (side ? players[side].name : null)
  const decided = input.winner ?? (insights.complete ? insights.leader : null)
  const resultFor = decided
    ? `${decided === focus ? "won" : "lost"}${insights.complete ? "" : " (the match ended early)"}`
    : input.endReason ? "match ended early" : "in progress"

  const data = {
    match: {
      date: input.matchDate,
      tournament: input.tournamentName,
      type: input.doubles ? "doubles" : "singles",
      result: resultFor,
      endReason: input.endReason ?? undefined,
      sets: insights.sets.map((s) => ({
        set: s.set,
        score: s.superTiebreak && s.tiebreakPoints ? `match tiebreak ${pair(s.tiebreakPoints)}` : pair(s.games),
        tiebreak: s.tiebreakPoints && !s.superTiebreak ? pair(s.tiebreakPoints) : undefined,
        minutes: s.durationSec ? Math.round(s.durationSec / 60) : undefined,
        breaks: pair(s.breaks),
      })),
      durationMinutes: input.durationMinutes ?? undefined,
      typicalSecondsBetweenPoints: insights.medianSecondsBetweenPoints ?? undefined,
      pressurePointsPlayed: insights.pressurePointsPlayed,
      deuceGamesPlayed: insights.deuceGamesPlayed,
    },
    focusPlayer: players[focus],
    opponent: players[other],
    focusPlayerStats: sideStats(insights.totals[focus], insights.hasServeDetail),
    opponentStats: sideStats(insights.totals[other], insights.hasServeDetail),
    keyMoments: insights.moments.map((m) => ({ ...m, side: who(m.side) })),
    games: insights.games.map((g) => ({
      set: g.set,
      game: g.game,
      server: who(g.server),
      winner: who(g.winner),
      scoreAfter: pair(g.gamesAfter),
      tiebreak: g.tiebreak || undefined,
      points: g.points.map((p) => (p === focus ? "F" : "O")).join(""),
      breakPointsFaced: g.breakPointsFaced || undefined,
      comebackFrom: g.comebackFrom ?? undefined,
    })),
  }
  return [
    "Match data (JSON). In \"points\" F = point won by the focus player, O = by the opponent.",
    JSON.stringify(data),
  ].join("\n")
}

/** The model's JSON answer, checked and trimmed; null when it is not usable */
export function parseAnalysis(text: string): MatchAnalysis | null {
  try {
    const raw = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ""))
    const list = (value: unknown) => (Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map((v) => v.trim()).slice(0, 5) : [])
    const analysis: MatchAnalysis = {
      summary: typeof raw?.summary === "string" ? raw.summary.trim() : "",
      strengths: list(raw?.strengths),
      improvements: list(raw?.improvements),
      trainingTips: list(raw?.trainingTips),
    }
    return analysis.summary ? analysis : null
  } catch {
    return null
  }
}
