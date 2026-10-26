import Link from "next/link"
import { notFound } from "next/navigation"
import { getServerTranslator } from "@/i18n/server-translator"
import { createAdminClient } from "@/lib/appwrite-server"
import { LiteScoreboard, type LitePlayerId } from "@/components/shared/lite-scoreboard"
import { parseDbScore } from "@/lib/utils/db-score"
import { deriveCurrentServer } from "@/lib/utils/current-server"
import { getNextDoublesServer, startsNewServeTurn, type ServeLogPoint } from "@/lib/utils/doubles-serving"
import { normalizeMatchFormat } from "@/lib/utils/match-format"
import { formatPlayerFromObject } from "@/lib/utils"
import type { Player } from "@/lib/types"

// Lightweight spectator view: rendered on the server with no client components of its own.
// While the match is live the browser re-requests it with a plain HTML meta refresh.
export const dynamic = "force-dynamic"
export const revalidate = 0

const REFRESH_SECONDS = 5

interface PageProps {
  params: Promise<{ matchId: string; locale: string }>
}

async function loadName(
  databases: Awaited<ReturnType<typeof createAdminClient>>["databases"],
  playerId: string | undefined,
  fallback: string
) {
  if (!playerId || playerId.startsWith("anonymous-")) return fallback
  try {
    const player = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
      playerId
    )
    return formatPlayerFromObject(player as unknown as Player)
  } catch {
    return fallback
  }
}

export default async function WatchMatchPage({ params }: PageProps) {
  const { matchId } = await params
  const t = await getServerTranslator("match")
  const { databases } = await createAdminClient()

  let match
  try {
    match = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      matchId
    )
  } catch {
    notFound()
  }

  const [n1, n2, n3, n4] = await Promise.all([
    loadName(databases, match.playerOneId, `${t("watchPlayer")} 1`),
    loadName(databases, match.playerTwoId, `${t("watchPlayer")} 2`),
    match.playerThreeId ? loadName(databases, match.playerThreeId, `${t("watchPlayer")} 3`) : Promise.resolve(null),
    match.playerFourId ? loadName(databases, match.playerFourId, `${t("watchPlayer")} 4`) : Promise.resolve(null),
  ])
  const isDoubles = !!(n3 && n4)

  const score = parseDbScore(match.score)
  const format = normalizeMatchFormat(match.matchFormat)
  const pointLog: ServeLogPoint[] = (match.pointLog || [])
    .map((p: string) => { try { return JSON.parse(p) } catch { return null } })
    .filter(Boolean)

  const inProgress = match.status !== "Completed"
  const servingTeam = inProgress ? deriveCurrentServer(pointLog as { server: "p1" | "p2" }[], score) : undefined
  const servingPlayer: LitePlayerId | null =
    inProgress && isDoubles && servingTeam
      ? getNextDoublesServer(pointLog, servingTeam, startsNewServeTurn(score), format.doublesServeOrder)
      : null
  const winner = match.winnerId === match.playerOneId ? "p1" : match.winnerId === match.playerTwoId ? "p2" : null

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md space-y-4 p-4">
      {/* Plain HTML polling while live: no JavaScript, no open connection */}
      {inProgress && <meta httpEquiv="refresh" content={String(REFRESH_SECONDS)} />}

      <header className="flex items-baseline justify-between">
        <span className="text-lg font-semibold tracking-tight">Tenis.click</span>
        {match.tournamentName && <span className="truncate pl-3 text-sm text-muted-foreground">{match.tournamentName}</span>}
      </header>

      <LiteScoreboard
        teams={[
          { names: isDoubles ? [n1, n3!] : [n1], ids: isDoubles ? ["p1", "p3"] : ["p1"] },
          { names: isDoubles ? [n2, n4!] : [n2], ids: isDoubles ? ["p2", "p4"] : ["p2"] },
        ]}
        score={score}
        noAd={format.noAd}
        inProgress={inProgress}
        servingTeam={servingTeam}
        servingPlayer={servingPlayer}
        winner={winner}
        labels={{ live: t("watchLive"), finished: t("watchFinished") }}
      />

      <footer className="space-y-2 text-center text-xs text-muted-foreground">
        {inProgress && <p>{t("watchRefreshNote")}</p>}
        <Link href={`/live/${matchId}`} className="font-medium text-foreground underline underline-offset-2">
          {t("watchFullView")}
        </Link>
      </footer>
    </main>
  )
}
