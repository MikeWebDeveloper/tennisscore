import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getMainPlayer } from "@/lib/actions/players"
import { getServerTranslator } from "@/i18n/server-translator"
import { getMatchesWithStats } from "@/lib/actions/statistics"
import EnhancedStatisticsClient from "./enhanced-statistics-client"
import { StatisticsSetupPrompt } from "./_components/statistics-setup-prompt"

export default async function StatisticsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }

  // Get main player for statistics
  const [mainPlayer, t] = await Promise.all([getMainPlayer(), getServerTranslator("statistics")])
  
  // Show setup prompt instead of redirecting
  if (!mainPlayer) {
    return (
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t("detailedStatistics")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("deepDiveAnalytics")}
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