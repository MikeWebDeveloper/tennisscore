import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getMainPlayer } from "@/lib/actions/players"
import { getMatchesWithStats } from "@/lib/actions/statistics"
import EnhancedStatisticsClient from "./enhanced-statistics-client"
import { StatisticsSetupPrompt } from "./_components/statistics-setup-prompt"

export default async function StatisticsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }

  // Get main player for statistics
  const mainPlayer = await getMainPlayer()
  
  // Show setup prompt instead of redirecting
  if (!mainPlayer) {
    return (
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-100">
            Statistics
          </h1>
          <p className="text-lg text-slate-400">
            Your personal tennis performance insights
          </p>
        </div>
        <StatisticsSetupPrompt />
      </div>
    )
  }

  // Get all matches with statistics for the main player
  const matches = await getMatchesWithStats(mainPlayer.$id)

  return (
    <EnhancedStatisticsClient 
      mainPlayer={mainPlayer}
      matches={matches}
    />
  )
}