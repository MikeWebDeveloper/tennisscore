import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getDashboardData, debugEnvironmentVariables } from "@/lib/utils/batch-operations"
import { PlayerStatisticsProgressive } from "./player-statistics-progressive"

export default async function PlayerStatisticsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }

  try {
    // Debug environment variables in development
    if (process.env.NODE_ENV === 'development') {
      debugEnvironmentVariables()
    }
    
    const dashboardData = await getDashboardData(user.$id)
    const { mainPlayer } = dashboardData
    
    if (!mainPlayer) {
      redirect("/dashboard")
    }

    // Progressive loading: Don't fetch matches here, let the client component do it
    return (
      <PlayerStatisticsProgressive 
        user={user} 
        mainPlayer={mainPlayer}
      />
    )
  } catch (error) {
    // Handle NEXT_REDIRECT errors gracefully (these are expected)
    if (error && typeof error === 'object' && 'digest' in error) {
      // This is a Next.js redirect, let it propagate
      throw error
    }
    
    console.error("Error fetching player statistics data:", error)
    redirect("/dashboard")
  }
}