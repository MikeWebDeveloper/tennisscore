import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getPlayersByUser } from "@/lib/actions/players"
import { getMatchesByPlayer } from "@/lib/actions/matches"
import { Match } from "@/lib/types"
import { Suspense } from "react"
import DashboardClient from "./dashboard-client"
import DashboardPending from "./dashboard-pending"

async function DashboardWithMatches({ user, mainPlayer, players, result }: {
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>
  mainPlayer: NonNullable<Awaited<ReturnType<typeof getPlayersByUser>>[number]>
  players: Awaited<ReturnType<typeof getPlayersByUser>>
  result: Promise<{ matches: Match[]; matchesError: boolean }>
}) {
  const { matches, matchesError } = await result
  return <DashboardClient user={user} mainPlayer={mainPlayer} players={players} matches={matches} matchesError={matchesError} />
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }

  // The main player is one of the user's players, so a single query covers both
  const players = await getPlayersByUser()
  const mainPlayer = players.find(player => player.isMainPlayer) ?? null
  
  if (!mainPlayer) {
    return <DashboardClient user={user} mainPlayer={null} players={players} matches={[]} matchesError={false} />
  }

  // Begin fetching immediately, but stream the welcome and quick action while it runs.
  const result = getMatchesByPlayer(mainPlayer.$id)
    .then(matches => ({ matches, matchesError: false }))
    .catch(error => {
      console.error("Error fetching matches:", error)
      return { matches: [] as Match[], matchesError: true }
    })

  return (
    <Suspense fallback={<DashboardPending mainPlayer={mainPlayer} user={user} />}>
      <DashboardWithMatches user={user} mainPlayer={mainPlayer} players={players} result={result} />
    </Suspense>
  )
}
