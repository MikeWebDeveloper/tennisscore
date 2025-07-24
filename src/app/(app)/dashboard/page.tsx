import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getDashboardDataLite, debugEnvironmentVariables } from "@/lib/utils/batch-operations"
import { getMatchesByPlayer } from "@/lib/actions/matches-optimized"
import { Match } from "@/lib/types"
import DashboardClient from "./dashboard-client"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }
  
  try {
    // Debug environment variables in development
    if (process.env.NODE_ENV === 'development') {
      debugEnvironmentVariables()
    }
    
    // Use lightweight dashboard data fetching for faster initial load
    const dashboardData = await getDashboardDataLite(user.$id)
    const { mainPlayer, totalMatches } = dashboardData
    
    // If no main player is set, we'll show a prompt to set one
    let matches: Match[] = []
    
    if (mainPlayer) {
      // Fetch limited matches for dashboard
      matches = await getMatchesByPlayer(mainPlayer.$id, 20) // Limit to 20 matches for dashboard performance
    }

    return (
      <DashboardClient 
        user={user} 
        mainPlayer={mainPlayer}
        matches={matches}
        totalMatches={totalMatches}
        isLimitedData={matches.length < totalMatches}
      />
    )
  } catch (error) {
    // Handle NEXT_REDIRECT errors gracefully (these are expected)
    if (error && typeof error === 'object' && 'digest' in error) {
      // This is a Next.js redirect, let it propagate
      throw error
    }
    
    console.error("Error fetching dashboard data:", error)
    
    // Fallback: show empty dashboard with setup prompt
    return (
      <DashboardClient 
        user={user} 
        mainPlayer={null}
        matches={[]}
        totalMatches={0}
        isLimitedData={false}
      />
    )
  }
} 