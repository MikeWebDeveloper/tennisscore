import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getPlayersByUser } from "@/lib/actions/players"
import { getMatchById, getMatchesByUserPaginated } from "@/lib/actions/matches"
import { presetFromMatch, recentPlayerIds } from "@/lib/utils/match-preset"
import { CompactMatchWizard } from "./_components/compact-match-wizard"

export default async function NewMatchPage({ searchParams }: { searchParams: Promise<{ rematch?: string }> }) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  // Every player can be picked, not only the newest 100. The latest matches give "same as last
  // time" and the recently picked players; without them the wizard simply starts empty.
  const [players, recent, { rematch: rematchId }] = await Promise.all([
    getPlayersByUser({ all: true }),
    getMatchesByUserPaginated({ limit: 20 }).then(result => result.matches).catch(() => []),
    searchParams,
  ])
  const mainPlayer = players.find(player => player.isMainPlayer)
  const source = rematchId ? recent.find(match => match.$id === rematchId) ?? await getMatchById(rematchId).catch(() => null) : null

  return (
    <div className="w-full h-full grid place-items-center p-4">
      <CompactMatchWizard
        players={players}
        rematch={source ? presetFromMatch(source) : undefined}
        lastPreset={recent[0] ? presetFromMatch(recent[0]) : undefined}
        recentPlayerIds={recentPlayerIds(recent, mainPlayer?.$id)}
      />
    </div>
  )
}
