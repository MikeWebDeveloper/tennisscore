import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getPlayersByUser } from "@/lib/actions/players"
import { getMatchesByUser } from "@/lib/actions/matches"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }

  // Fetch user's data
  const [players, matches] = await Promise.all([
    getPlayersByUser().catch(() => []),
    getMatchesByUser().catch(() => [])
  ])

  // Calculate statistics
  const totalMatches = matches.length
  const completedMatches = matches.filter(match => match.status === "Completed")
  const wonMatches = completedMatches.filter(match => match.winnerId === user.$id)
  const winRate = completedMatches.length > 0 ? Math.round((wonMatches.length / completedMatches.length) * 100) : 0

  return (
    <DashboardClient 
      user={user}
      players={players}
      matches={matches}
      stats={{
        totalMatches,
        winRate,
        totalPlayers: players.length,
        completedMatches: completedMatches.length,
        inProgressMatches: matches.filter(match => match.status === "In Progress").length
      }}
    />
  )
} 