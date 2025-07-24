import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getDashboardData } from "@/lib/utils/batch-operations"
import { getMatchesByPlayer } from "@/lib/actions/matches-optimized"
import { getMatchesCountByPlayer } from "@/lib/actions/matches"
import { Match } from "@/lib/types"
import StatisticsClient from "./statistics-client"

export default async function StatisticsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }

  try {
    // Use optimized dashboard data fetching with caching
    const dashboardData = await getDashboardData(user.$id)
    const { mainPlayer } = dashboardData
    
    // If no main player is set, redirect to dashboard
    if (!mainPlayer) {
      redirect("/dashboard")
    }

    // Fetch all matches for complete statistics (no limit)
    const [allMatches, totalMatches] = await Promise.all([
      getMatchesByPlayer(mainPlayer.$id), // No limit - get all matches
      getMatchesCountByPlayer(mainPlayer.$id)
    ])

    return (
      <StatisticsClient 
        user={user} 
        mainPlayer={mainPlayer}
        matches={allMatches}
        totalMatches={totalMatches}
      />
    )
  } catch (error) {
    console.error("Error fetching statistics data:", error)
    
    // Fallback: redirect to dashboard
    redirect("/dashboard")
  }
}