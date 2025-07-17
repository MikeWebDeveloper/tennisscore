"use client"

import React, { Suspense, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  Calendar,
  Target,
  Activity,
  Zap,
  Award,
  Flame,
  Plus,
  UserPlus,
  RotateCcw,
  Shield,
  CircleArrowDown,
  Percent,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react"
import Link from "next/link"
import { PerformanceCharts } from "./performance-charts"
import { Match, Player } from "@/lib/types"
import { useTranslations } from "@/hooks/use-translations"
import { NemesisBunnyStats } from "@/components/features/nemesis-bunny-stats"
import { analyzeOpponentRecords, MatchData } from "@/lib/utils/opponent-analysis"
import { calculateEnhancedStats } from "@/lib/utils/dashboard-stats"
import { CreatePlayerDialog } from "../../players/_components/create-player-dialog"
import { useGSAPCardAnimation } from "@/hooks/use-gsap-card-animation"
import { ChartSkeleton } from "@/components/ui/loading-skeletons"
import { StatisticsCard } from "./statistics-card"
import { PerformanceInsightsCard } from "./performance-insights-card"
import { RecentMatchesCard } from "./recent-matches-card"
import { PlayerStatsCard } from "./player-stats-card"

interface EnhancedBentoGridProps {
  matches: Match[]
  mainPlayer: Player | null
}


// Enhanced Animation variants with slower, more deliberate timing
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
}


// Removed unused buttonVariants since we're using regular divs now

// Enhanced skeleton component for charts
function ChartsSkeleton() {
  return <ChartSkeleton />
}

export function EnhancedBentoGrid({ matches, mainPlayer }: EnhancedBentoGridProps) {
  const t = useTranslations()
  const [isCreatePlayerOpen, setCreatePlayerOpen] = useState(false)
  const [showAdvancedStats, setShowAdvancedStats] = useState(false)
  
  
  // Calculate comprehensive stats with memoization for expensive calculations
  const stats = useMemo(() => 
    calculateEnhancedStats(matches, mainPlayer?.$id), 
    [matches, mainPlayer?.$id]
  )
  
  // Calculate total number of cards dynamically with memoization
  const totalCardsCount = useMemo(() => 
    16 + (stats.bestTimeOfDay ? 1 : 0) + (stats.forehandBackhandRatio > 0 ? 1 : 0),
    [stats.bestTimeOfDay, stats.forehandBackhandRatio]
  )
  
  // GSAP-powered unified animation for all cards
  const cardAnimation = useGSAPCardAnimation({
    totalCards: totalCardsCount,
    staggerDelay: 400, // Faster, smoother sequential animation
    startDelay: 0.5
  })

  // Recent matches for quick access with memoization
  const recentMatches = useMemo(() => 
    matches
      .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
      .slice(0, 3),
    [matches]
  )

  // Memoized opponent records analysis for expensive processing
  const opponentRecords = useMemo(() => {
    if (!mainPlayer) return []
    
    return analyzeOpponentRecords(
      mainPlayer.$id, 
      matches
        .filter(match => match.playerOne && match.playerTwo) // Only include matches with valid player data
        .map(match => ({
          $id: match.$id,
          playerOne: match.playerOne!,
          playerTwo: match.playerTwo!,
          playerThree: match.playerThree,
          playerFour: match.playerFour,
          winner: match.winnerId,
          status: match.status,
          finalScore: match.finalScore,
          endTime: match.endTime,
          createdAt: match.createdAt || match.matchDate
        } as MatchData))
    )
  }, [matches, mainPlayer])

  // Use the memoized StatisticsCard component
  const StatCard = (props: Omit<React.ComponentProps<typeof StatisticsCard>, 'cardAnimation'>) => (
    <StatisticsCard {...props} cardAnimation={cardAnimation} />
  )

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-4 space-y-6"
    >
      {/* Quick Actions */}
      <div 
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="flex-1">
          <Button asChild className="w-full h-11 font-medium shadow-sm">
            <Link href="/matches/new">
              <Plus className="h-4 w-4 mr-2" />
              {t("newMatch")}
            </Link>
          </Button>
        </div>
        <div className="flex-1">
          <Button variant="outline" className="w-full h-11" onClick={() => setCreatePlayerOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            {t("addPlayer")}
          </Button>
        </div>
      </div>
      <CreatePlayerDialog isOpen={isCreatePlayerOpen} onOpenChange={setCreatePlayerOpen} />

      {/* Smart Dashboard - Show Key Metrics by Default */}
      <div data-dashboard-container className="space-y-6 md:space-y-8">
        {/* Core Performance Metrics - Always Visible */}
        <div>
          <div className="mb-3 md:mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-foreground mb-1">{t("performanceOverviewHeader")}</h3>
              <p className="text-sm text-gray-700 dark:text-muted-foreground">{t("performanceOverviewDescription")}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedStats(!showAdvancedStats)}
              className="ml-4"
              aria-expanded={showAdvancedStats}
              aria-controls="advanced-stats-section"
              aria-label={showAdvancedStats ? "Hide advanced statistics" : "Show advanced statistics"}
            >
              {showAdvancedStats ? "Show Less" : "View More Stats"}
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            <StatCard 
              icon={Trophy} 
              label={t("matchesWon")} 
              value={stats.totalMatchesWon}
              subtitle={`${t("ofTotal")} ${stats.totalMatches}`}
              trend={stats.winRate > 50 ? "up" : "neutral"}
              variant={stats.winRate >= 70 ? "success" : stats.winRate >= 50 ? "primary" : "default"}
              cardIndex={0}
              cardType="performance"
            />
            <StatCard 
              icon={Percent} 
              label={t("winRate")} 
              value={`${stats.winRate}%`}
              subtitle={stats.winRate >= 70 ? t("qualityExcellent") : stats.winRate >= 50 ? t("qualityGood") : t("qualityWorkNeeded")}
              trend={stats.winRate > 50 ? "up" : "down"}
              variant={stats.winRate >= 70 ? "success" : stats.winRate >= 50 ? "primary" : "warning"}
              cardIndex={1}
              cardType="performance"
            />
            <StatCard 
              icon={Calendar} 
              label={t("totalMatches")} 
              value={stats.totalMatches}
              subtitle={`${stats.thisMonthMatches} ${t("completedDescription")}`}
              variant="default"
              cardIndex={2}
              cardType="performance"
            />
            <StatCard 
              icon={Flame} 
              label={t("winStreakLabel")} 
              value={stats.currentWinStreak}
              subtitle={`${t("best")}: ${stats.longestWinStreak}`}
              trend={stats.currentWinStreak > 0 ? "up" : "neutral"}
              variant={stats.currentWinStreak >= 3 ? "success" : "default"}
              cardIndex={3}
              cardType="performance"
            />
          </div>
        </div>

        {/* Advanced Stats - Conditionally Rendered */}
        {showAdvancedStats && (
          <div id="advanced-stats-section" role="region" aria-label="Advanced performance statistics">
            {/* Serve Performance */}
            <div>
          <div className="mb-3 md:mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-foreground mb-1">{t("serveStatisticsHeader")}</h3>
            <p className="text-sm text-gray-700 dark:text-muted-foreground">{t("serveStatisticsDescription")}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            <StatCard 
              icon={Zap} 
              label={t("acesLabel")} 
              value={stats.totalAces}
              subtitle={`${(stats.totalAces / Math.max(stats.totalMatches, 1)).toFixed(1)}/match`}
              variant={(stats.totalAces / Math.max(stats.totalMatches, 1)) >= 5 ? "success" : (stats.totalAces / Math.max(stats.totalMatches, 1)) >= 2 ? "primary" : "default"}
              cardIndex={4}
              cardType="serve"
            />
            <StatCard 
              icon={Target} 
              label={t("firstServePercentageLabel")} 
              value={`${stats.firstServePercentage}%`}
              subtitle={stats.firstServePercentage >= 65 ? t("qualityExcellent") : stats.firstServePercentage >= 55 ? t("qualityGood") : t("qualityWorkNeeded")}
              trend={stats.firstServePercentage >= 60 ? "up" : "down"}
              variant={stats.firstServePercentage >= 65 ? "success" : stats.firstServePercentage >= 55 ? "primary" : "warning"}
              cardIndex={5}
              cardType="serve"
            />
            <StatCard 
              icon={Activity} 
              label={t("servicePointsLabel")} 
              value={stats.servicePointsWon}
              subtitle={t("pointsWonServing")}
              trend={stats.servicePointsWon >= 60 ? "up" : "down"}
              variant={stats.servicePointsWon >= 70 ? "success" : stats.servicePointsWon >= 60 ? "primary" : "warning"}
              cardIndex={6}
              cardType="serve"
            />
            <StatCard 
              icon={RotateCcw} 
              label={t("doubleFaultsLabel")} 
              value={stats.totalDoubleFaults}
              subtitle={`${(stats.totalDoubleFaults / Math.max(stats.totalMatches, 1)).toFixed(1)}/match`}
              trend={(stats.totalDoubleFaults / Math.max(stats.totalMatches, 1)) <= 2 ? "up" : "down"}
              variant={(stats.totalDoubleFaults / Math.max(stats.totalMatches, 1)) <= 1 ? "success" : (stats.totalDoubleFaults / Math.max(stats.totalMatches, 1)) <= 3 ? "primary" : "danger"}
              cardIndex={7}
              cardType="serve"
            />
          </div>
        </div>

        {/* Return Game */}
        <div>
          <div className="mb-3 md:mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-foreground mb-1">{t("returnGameHeader")}</h3>
            <p className="text-sm text-gray-700 dark:text-muted-foreground">{t("returnGameDescription")}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            <StatCard 
              icon={ArrowUpRight} 
              label={t("breakPointsWonLabel")} 
              value={stats.breakPointsConverted}
              subtitle={t("opportunitiesConverted")}
              trend={stats.breakPointConversionRate >= 40 ? "up" : "down"}
              variant={stats.breakPointConversionRate >= 50 ? "success" : stats.breakPointConversionRate >= 30 ? "primary" : "warning"}
              cardIndex={8}
              cardType="return"
            />
            <StatCard 
              icon={CircleArrowDown} 
              label={t("returnPointsLabel")} 
              value={`${stats.firstReturnWinPercentage}%`}
              subtitle={t("pointsWonReturning")}
              trend={stats.firstReturnWinPercentage >= 35 ? "up" : "down"}
              variant={stats.firstReturnWinPercentage >= 40 ? "success" : stats.firstReturnWinPercentage >= 30 ? "primary" : "warning"}
              cardIndex={9}
              cardType="return"
            />
            <StatCard 
              icon={Shield} 
              label={t("breakPointsSavedLabel")} 
              value={stats.breakPointsSaved}
              subtitle={t("defensiveHolds")}
              trend={stats.breakPointsSaved >= stats.breakPointsFaced * 0.6 ? "up" : "down"}
              variant={stats.breakPointsSaved >= stats.breakPointsFaced * 0.7 ? "success" : "primary"}
              cardIndex={10}
              cardType="return"
            />
            <StatCard 
              icon={Target} 
              label={t("firstReturnPercentageLabel")} 
              value={`${stats.firstReturnPercentage}%`}
              subtitle={t("qualityImproving")}
              trend={stats.firstReturnPercentage >= 50 ? "up" : "down"}
              variant={stats.firstReturnPercentage >= 60 ? "success" : stats.firstReturnPercentage >= 45 ? "primary" : "warning"}
              cardIndex={11}
              cardType="return"
            />
          </div>
        </div>

        {/* Shot Making */}
        <div>
          <div className="mb-3 md:mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-foreground mb-1">{t("shotMakingHeader")}</h3>
            <p className="text-sm text-gray-700 dark:text-muted-foreground">{t("shotMakingDescription")}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            <StatCard 
              icon={Award} 
              label={t("winnersLabel")} 
              value={stats.totalWinners}
              subtitle={`${(stats.totalWinners / Math.max(stats.totalMatches, 1)).toFixed(1)}/match`}
              variant={stats.winnersPerMatch >= 15 ? "success" : stats.winnersPerMatch >= 10 ? "primary" : "default"}
              cardIndex={12}
              cardType="shotmaking"
            />
            <StatCard 
              icon={CircleArrowDown} 
              label={t("unforcedErrorsLabel")} 
              value={stats.totalUnforcedErrors}
              subtitle={t("unforcedErrorsDescription")}
              trend={stats.winnerToErrorRatio >= 1 ? "up" : "down"}
              variant={stats.winnerToErrorRatio >= 1.2 ? "success" : stats.winnerToErrorRatio >= 0.8 ? "primary" : "warning"}
              cardIndex={13}
              cardType="shotmaking"
            />
            <StatCard 
              icon={Percent} 
              label={t("secondServePointsWonPercent")}
              value={`${stats.secondServePointsWonPercentage}%`}
              subtitle={t("defensiveHolds")}
              variant="default"
              cardIndex={14}
              cardType="shotmaking"
            />
            <StatCard 
              icon={ArrowDownLeft} 
              label={t("forcedErrorsLabel")}
              value={stats.totalForcedErrors}
              subtitle={t("unforcedErrorsDescription")}
              variant="default"
              cardIndex={15}
              cardType="shotmaking"
            />
          </div>
        </div>
        
        {/* Performance Insights Section */}
        <PerformanceInsightsCard stats={stats} cardAnimation={cardAnimation} />

            {/* Performance Charts */}
            <div>
              <Card className="hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">{t("performanceOverview")}</h3>
                    <Badge variant="outline" className="text-xs">
                      {t("last30Days")}
                    </Badge>
                  </div>
                  <Suspense fallback={<ChartsSkeleton />}>
                    <PerformanceCharts matches={matches} mainPlayer={mainPlayer} />
                  </Suspense>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Recent Matches */}
      <RecentMatchesCard recentMatches={recentMatches} mainPlayer={mainPlayer} />

      {/* Monthly Progress Card */}
      <PlayerStatsCard stats={stats} cardAnimation={cardAnimation} />

      {/* Nemesis & Bunny Stats */}
      {mainPlayer && (
        <div>
          <NemesisBunnyStats
            playerId={mainPlayer.$id}
            playerName={`${mainPlayer.firstName} ${mainPlayer.lastName}`}
            opponentRecords={opponentRecords}
          />
        </div>
      )}
    </motion.div>
  )
} 