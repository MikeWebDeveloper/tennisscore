import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getPlayersByUser } from "@/lib/actions/players"
import { getMatchesByPlayer } from "@/lib/actions/matches"
import { Match } from "@/lib/types"
import DashboardClient from "./dashboard-client"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }

  // The main player is one of the user's players, so a single query covers both
  const players = await getPlayersByUser()
  const mainPlayer = players.find(player => player.isMainPlayer) ?? null
  
  // If no main player is set, we'll show a prompt to set one
  let matches: Match[] = []
  if (mainPlayer) {
    try {
      matches = await getMatchesByPlayer(mainPlayer.$id)
    } catch (error) {
      console.error("Error fetching matches:", error)
      matches = []
    }
  }

  return (
    <DashboardClient 
      user={user} 
      mainPlayer={mainPlayer}
      matches={matches}
      players={players}
    />
  )
} 