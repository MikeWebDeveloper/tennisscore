import Link from "next/link"
import { notFound } from "next/navigation"
import { getServerTranslator } from "@/i18n/server-translator"
import { createAdminClient } from "@/lib/appwrite-server"
import { CompactLiveScoreboard } from "./compact-live-scoreboard"
import { formatPlayerFromObject } from "@/lib/utils"
import type { Player } from "@/lib/types"

// Render the initial scoreboard on the server, then update it in place.
export const dynamic = "force-dynamic"
export const revalidate = 0

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

  const inProgress = match.status !== "Completed"

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md space-y-4 p-4">
      <header className="flex items-baseline justify-between">
        <span className="text-lg font-semibold tracking-tight">Tenis.click</span>
        {match.tournamentName && <span className="truncate pl-3 text-sm text-muted-foreground">{match.tournamentName}</span>}
      </header>

      <CompactLiveScoreboard
        matchId={matchId}
        teams={[
          { names: isDoubles ? [n1, n3!] : [n1], ids: isDoubles ? ["p1", "p3"] : ["p1"] },
          { names: isDoubles ? [n2, n4!] : [n2], ids: isDoubles ? ["p2", "p4"] : ["p2"] },
        ]}
        playerOneId={match.playerOneId}
        playerTwoId={match.playerTwoId}
        playerThreeId={match.playerThreeId}
        playerFourId={match.playerFourId}
        initialScore={match.score}
        initialStatus={match.status}
        initialWinnerId={match.winnerId}
        initialPointLog={match.pointLog || []}
        format={match.matchFormat}
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
