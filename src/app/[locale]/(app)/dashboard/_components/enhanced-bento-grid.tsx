"use client"

import { motion } from '@/lib/framer-motion-config'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FramerAnimatedCounter } from "@/components/ui/framer-animated-counter"
import { FramerInteractiveCard } from "@/components/ui/framer-interactive-card"
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
  LucideIcon,
  RotateCcw,
  Shield,
  CircleArrowDown,
  Percent,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Timer
} from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Suspense } from "react"
import { PerformanceCharts } from "./performance-charts"
import { Match, Player, PointDetail } from "@/lib/types"
import { useTranslations } from "@/i18n"
import { aggregatePlayerStatsAcrossMatches, calculatePlayerWinStreak } from "@/lib/utils/match-stats"
import { NemesisBunnyStats } from "@/components/features/nemesis-bunny-stats"
import { analyzeOpponentRecords, MatchData } from "@/lib/utils/opponent-analysis"
import { CreatePlayerDialog } from "../../players/_components/create-player-dialog"
import { useState } from "react"
import { useCardAnimation } from "@/hooks/use-card-animation"
import { ChartSkeleton } from "@/components/ui/loading-skeletons"

interface EnhancedBentoGridProps {
  matches: Match[]
  mainPlayer: Player | null
}

interface EnhancedStats {
  // Basic Performance
  totalMatchesWon: number
  winRate: number
  totalMatches: number
  currentWinStreak: number
  
  // Serve Performance
  totalAces: number
  firstServePercentage: number
  servicePointsWon: number
  totalDoubleFaults: number
  
  // Return Performance
  breakPointsConverted: number
  returnPointsWon: number
  breakPointsSaved: number
  firstReturnWinPercentage: number
  breakPointsFaced: number
  breakPointConversionRate: number
  
  // Shot Making
  totalWinners: number
  totalUnforcedErrors: number
  netPointsWon: number
  forehandBackhandRatio: number
  winnersPerMatch: number
  winnerToErrorRatio: number
  netPointsWonPercentage: number
  
  // Return Game Stats
  firstReturnPercentage: number
  
  // Additional contextual stats
  averageMatchDuration: string
  longestWinStreak: number
  thisMonthMatches: number
  secondServePointsWonPercentage: number
  totalForcedErrors: number
  
  // Performance Insights
  recentForm: number
  bestTimeOfDay: string | null
  totalPlayingTime: string
}

// Enhanced Animation variants with slower, more deliberate timing
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const
    }
  }
}


const buttonVariants = {
  hover: { 
    scale: 1.02,
    transition: { type: "spring" as const, stiffness: 400, damping: 10 }
  },
  tap: { 
    scale: 0.98,
    transition: { type: "spring" as const, stiffness: 400, damping: 10 }
  }
}

// Enhanced skeleton component for charts
function ChartsSkeleton() {
  return <ChartSkeleton />
}

// Helper function to calculate matches in current month
function calculateThisMonthMatches(matches: Match[]): number {
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  
  return matches.filter(match => {
    const matchDate = new Date(match.matchDate)
    return matchDate.getMonth() === thisMonth && 
           matchDate.getFullYear() === thisYear &&
           match.status === 'completed'
  }).length
}

// Helper function to calculate average match duration
function calculateAverageMatchDuration(matches: Match[]): string {
  const completedMatches = matches.filter(match => 
    match.status === 'completed' && 
    match.startTime && 
    match.endTime
  )
  
  if (completedMatches.length === 0) return "0m"
  
  const totalDurationMs = completedMatches.reduce((total, match) => {
    const start = new Date(match.startTime!).getTime()
    const end = new Date(match.endTime!).getTime()
    return total + (end - start)
  }, 0)
  
  const averageDurationMs = totalDurationMs / completedMatches.length
  const averageDurationMinutes = Math.round(averageDurationMs / (1000 * 60))
  
  // Format as hours and minutes if over 60 minutes
  if (averageDurationMinutes >= 60) {
    const hours = Math.floor(averageDurationMinutes / 60)
    const minutes = averageDurationMinutes % 60
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
  }
  
  return `${averageDurationMinutes}m`
}

// Helper function to calculate forehand/backhand ratio from point log data
function calculateForehandBackhandRatio(matches: Match[], mainPlayerId: string): number {
  let forehandShots = 0
  let backhandShots = 0
  
  matches.forEach(match => {
    if (match.pointLog && match.pointLog.length > 0) {
      match.pointLog.forEach(pointStr => {
        try {
          const point = JSON.parse(pointStr) as PointDetail
          // Only count shots by the main player
          const isMainPlayerPoint = (
            (match.playerOneId === mainPlayerId && point.winner === 'p1') ||
            (match.playerTwoId === mainPlayerId && point.winner === 'p2') ||
            (match.playerOneId === mainPlayerId && point.winner === 'p2' && point.pointOutcome === 'forced_error') ||
            (match.playerTwoId === mainPlayerId && point.winner === 'p1' && point.pointOutcome === 'forced_error')
          )
          
          if (isMainPlayerPoint && point.lastShotType) {
            if (point.lastShotType.includes('forehand') || point.lastShotType === 'forehand') {
              forehandShots++
            } else if (point.lastShotType.includes('backhand') || point.lastShotType === 'backhand') {
              backhandShots++
            }
          }
        } catch {
          // Skip invalid point data
        }
      })
    }
  })
  
  if (backhandShots === 0) return forehandShots > 0 ? 99 : 0
  return Math.round((forehandShots / backhandShots) * 10) / 10 // Round to 1 decimal
}

// Helper function to calculate additional insights
function calculatePerformanceInsights(matches: Match[], mainPlayerId: string) {
  const completedMatches = matches.filter(m => m.status === 'completed')
  
  // Calculate recent form (last 5 matches)
  const recentMatches = completedMatches
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
    .slice(0, 5)
  const recentWins = recentMatches.filter(m => m.winnerId === mainPlayerId).length
  const recentForm = recentMatches.length > 0 ? (recentWins / recentMatches.length) * 100 : 0
  
  // Calculate best time of day (if we have enough data)
  const matchTimes = completedMatches
    .filter(m => m.startTime)
    .map(m => ({
      hour: new Date(m.startTime!).getHours(),
      won: m.winnerId === mainPlayerId
    }))
  
  let bestTimeOfDay = null
  if (matchTimes.length >= 3) {
    const timeSlots = matchTimes.reduce((acc, match) => {
      const slot = Math.floor(match.hour / 4) // Group into 6-hour slots
      if (!acc[slot]) acc[slot] = { total: 0, wins: 0 }
      acc[slot].total++
      if (match.won) acc[slot].wins++
      return acc
    }, {} as Record<number, { total: number; wins: number }>)
    
    let bestSlot = 0
    let bestWinRate = 0
    Object.entries(timeSlots).forEach(([slot, data]) => {
      const winRate = data.total >= 2 ? data.wins / data.total : 0
      if (winRate > bestWinRate && data.total >= 2) {
        bestWinRate = winRate
        bestSlot = parseInt(slot)
      }
    })
    
    const timeLabels = ["earlyMorning", "morning", "afternoon", "evening", "night", "lateNight"]
    bestTimeOfDay = timeLabels[bestSlot]
  }
  
  return {
    recentForm,
    bestTimeOfDay,
    totalPlayingTime: calculateTotalPlayingTime(completedMatches)
  }
}

// Helper function to calculate total playing time
function calculateTotalPlayingTime(matches: Match[]): string {
  const totalMs = matches
    .filter(m => m.startTime && m.endTime)
    .reduce((total, match) => {
      const start = new Date(match.startTime!).getTime()
      const end = new Date(match.endTime!).getTime()
      return total + (end - start)
    }, 0)
  
  const totalHours = Math.round(totalMs / (1000 * 60 * 60))
  if (totalHours >= 24) {
    const days = Math.floor(totalHours / 24)
    const hours = totalHours % 24
    return hours === 0 ? `${days}d` : `${days}d ${hours}h`
  }
  return `${totalHours}h`
}

// Enhanced statistics calculation from real match data
function calculateEnhancedStats(matches: Match[], mainPlayerId: string | undefined): EnhancedStats {
  if (!mainPlayerId || matches.length === 0) {
    return {
      // Basic Performance
      totalMatchesWon: 0,
      winRate: 0,
      totalMatches: 0,
      currentWinStreak: 0,
      
      // Serve Performance
      totalAces: 0,
      firstServePercentage: 0,
      servicePointsWon: 0,
      totalDoubleFaults: 0,
      
      // Return Performance  
      breakPointsConverted: 0,
      returnPointsWon: 0,
      breakPointsSaved: 0,
      firstReturnWinPercentage: 0,
      breakPointsFaced: 0,
      breakPointConversionRate: 0,
      
      // Shot Making
      totalWinners: 0,
      totalUnforcedErrors: 0,
      netPointsWon: 0,
      forehandBackhandRatio: 0,
      winnersPerMatch: 0,
      winnerToErrorRatio: 0,
      netPointsWonPercentage: 0,
      
      // Return Game Stats
      firstReturnPercentage: 0,
      
      // Additional contextual stats
      averageMatchDuration: "0m",
      longestWinStreak: 0,
      thisMonthMatches: 0,
      secondServePointsWonPercentage: 0,
      totalForcedErrors: 0,
      
      // Performance Insights
      recentForm: 0,
      bestTimeOfDay: null,
      totalPlayingTime: "0h"
    }
  }

  const agg = aggregatePlayerStatsAcrossMatches(matches, mainPlayerId)
  const streaks = calculatePlayerWinStreak(matches, mainPlayerId)
  const insights = calculatePerformanceInsights(matches, mainPlayerId)

  return {
    // Basic Performance
    totalMatchesWon: agg.matchesWon,
    winRate: agg.winRate,
    totalMatches: agg.totalMatches,
    currentWinStreak: streaks.current,
    
    // Serve Performance
    totalAces: agg.totalAces,
    firstServePercentage: agg.firstServePercentage,
    servicePointsWon: agg.totalServicePointsWon,
    totalDoubleFaults: agg.totalDoubleFaults,
    
    // Return Performance
    breakPointsConverted: agg.totalBreakPointsWon,
    returnPointsWon: agg.totalReturnPointsWon,
    breakPointsSaved: agg.totalBreakPointsSaved,
    firstReturnWinPercentage: agg.returnPointsPct,
    breakPointsFaced: agg.totalBreakPointsFaced,
    breakPointConversionRate: agg.breakPointConversionRate,
    
    // Shot Making
    totalWinners: agg.totalWinners,
    totalUnforcedErrors: agg.totalUnforcedErrors,
    netPointsWon: agg.totalNetPointsWon,
    forehandBackhandRatio: calculateForehandBackhandRatio(matches, mainPlayerId),
    winnersPerMatch: agg.totalMatches > 0 ? agg.totalWinners / agg.totalMatches : 0,
    winnerToErrorRatio: agg.winnerToErrorRatio,
    netPointsWonPercentage: agg.netPointsWonPercentage,
    
    // Return Game Stats
    firstReturnPercentage: agg.returnPointsPct,
    
    // Additional contextual stats
    averageMatchDuration: calculateAverageMatchDuration(matches),
    longestWinStreak: streaks.max,
    thisMonthMatches: calculateThisMonthMatches(matches),
    secondServePointsWonPercentage: agg.secondServePointsWonPercentage,
    totalForcedErrors: agg.totalForcedErrors,
    
    // Performance Insights
    recentForm: insights.recentForm,
    bestTimeOfDay: insights.bestTimeOfDay,
    totalPlayingTime: insights.totalPlayingTime
  }
}

export function EnhancedBentoGrid({ matches, mainPlayer }: EnhancedBentoGridProps) {
  const t = useTranslations('dashboard')
  const commonT = useTranslations('common')
  const matchT = useTranslations('match')
  const playerT = useTranslations('player')
  const [isCreatePlayerOpen, setCreatePlayerOpen] = useState(false)
  const [showAdvancedStats, setShowAdvancedStats] = useState(false)
  
  // Calculate comprehensive stats
  const stats = calculateEnhancedStats(matches, mainPlayer?.$id)
  
  // Calculate total number of cards dynamically
  const totalCardsCount = 16 + (stats.bestTimeOfDay ? 1 : 0) + (stats.forehandBackhandRatio > 0 ? 1 : 0)
  
  // GSAP-powered unified animation for all cards
  const cardAnimation = useCardAnimation({
    totalCards: totalCardsCount,
    staggerDelay: 400, // Faster, smoother sequential animation
    startDelay: 0.5
  })

  // Recent matches for quick access
  const recentMatches = matches
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
    .slice(0, 3)

  // GSAP-powered stat card component with unique animations per type
  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    subtitle,
    trend,
    className = "",
    variant = "default",
    cardIndex,
    cardType = "performance"
  }: {
    icon: LucideIcon
    label: string
    value: string | number
    subtitle?: string
    trend?: "up" | "down" | "neutral"
    className?: string
    variant?: "default" | "primary" | "success" | "warning" | "danger"
    cardIndex: number
    cardType?: "performance" | "serve" | "return" | "shotmaking" | "insights"
  }) => {

    const getTrendIcon = () => {
      if (trend === "up") return <ArrowUpRight className="h-3 w-3 text-green-500" />
      if (trend === "down") return <ArrowDownLeft className="h-3 w-3 text-red-500" />
      return null
    }

    const getIconColor = () => {
      switch (variant) {
        case "primary":
          return "text-primary"
        case "success":
          return "text-green-500"
        case "warning":
          return "text-yellow-500"
        case "danger":
          return "text-red-500"
        default:
          return "text-muted-foreground"
      }
    }

    return (
      <FramerInteractiveCard 
        variant={variant}
        cardType={cardType}
        className={className}
      >
          <CardContent className="p-3 md:p-4 lg:p-6 h-full">
            <div className="flex flex-col h-full justify-between">
              {/* Header with icon and trend */}
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <h4 className="text-xs md:text-sm text-gray-800 dark:text-muted-foreground font-medium truncate">{label}</h4>
                  {getTrendIcon()}
                </div>
                <div className="p-1.5 md:p-2 lg:p-2.5 rounded-full bg-muted/50 group-hover:bg-muted/80 transition-colors duration-200 ml-2 flex-shrink-0">
                  <Icon className={`h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 ${getIconColor()}`} aria-hidden="true" />
                </div>
              </div>
              
              {/* Value */}
              <div className="flex-1 flex items-center">
                <p className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-foreground group-hover:scale-105 transition-transform duration-200 font-mono leading-none">
                  {typeof value === 'number' ? (
                    <FramerAnimatedCounter
                      value={value}
                      duration={1.8}
                      delay={cardAnimation.getDelay(cardIndex)}
                      shouldAnimate={cardAnimation.shouldAnimate(cardIndex)}
                    />
                  ) : typeof value === 'string' && value.includes('%') ? (
                    <FramerAnimatedCounter
                      value={parseInt(value.replace('%', ''))}
                      suffix="%"
                      duration={1.8}
                      delay={cardAnimation.getDelay(cardIndex)}
                      shouldAnimate={cardAnimation.shouldAnimate(cardIndex)}
                    />
                  ) : (
                    value
                  )}
                </p>
              </div>
              
              {/* Subtitle */}
              {subtitle && (
                <div className="mt-1">
                  <p className="text-xs md:text-xs lg:text-sm text-gray-700 dark:text-muted-foreground/80 truncate leading-tight">
                    {subtitle}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
      </FramerInteractiveCard>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-4 space-y-6"
    >
      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap" className="flex-1">
          <Button asChild className="w-full h-11 font-medium shadow-sm">
            <Link href="/matches/new">
              <Plus className="h-4 w-4 mr-2" />
              {matchT("newMatch")}
            </Link>
          </Button>
        </motion.div>
        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap" className="flex-1">
          <Button variant="outline" className="w-full h-11" onClick={() => setCreatePlayerOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            {playerT("addPlayer")}
          </Button>
        </motion.div>
      </motion.div>
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
              aria-label={showAdvancedStats ? t("showLess") : t("viewMoreStats")}
            >
              {showAdvancedStats ? t("showLess") : t("viewMoreStats")}
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            <StatCard 
              icon={Trophy} 
              label={t("matchesWon")} 
              value={stats.totalMatchesWon}
              subtitle={`${commonT("ofTotal")} ${stats.totalMatches}`}
              trend={stats.winRate > 50 ? "up" : "neutral"}
              variant={stats.winRate >= 70 ? "success" : stats.winRate >= 50 ? "primary" : "default"}
              cardIndex={0}
              cardType="performance"
            />
            <StatCard 
              icon={Percent} 
              label={t("winRate")} 
              value={`${stats.winRate}%`}
              subtitle={stats.winRate >= 70 ? t("excellent") : stats.winRate >= 50 ? t("good") : t("needsWork")}
              trend={stats.winRate > 50 ? "up" : "down"}
              variant={stats.winRate >= 70 ? "success" : stats.winRate >= 50 ? "primary" : "warning"}
              cardIndex={1}
              cardType="performance"
            />
            <StatCard 
              icon={Calendar} 
              label={t("totalMatches")} 
              value={stats.totalMatches}
              subtitle={`${stats.thisMonthMatches} ${commonT("completedDescription")}`}
              variant="default"
              cardIndex={2}
              cardType="performance"
            />
            <StatCard 
              icon={Flame} 
              label={t("winStreakLabel")} 
              value={stats.currentWinStreak}
              subtitle={`${commonT("best")}: ${stats.longestWinStreak}`}
              trend={stats.currentWinStreak > 0 ? "up" : "neutral"}
              variant={stats.currentWinStreak >= 3 ? "success" : "default"}
              cardIndex={3}
              cardType="performance"
            />
          </div>
        </div>

        {/* Advanced Stats - Conditionally Rendered */}
        {showAdvancedStats && (
          <div id="advanced-stats-section" role="region" aria-label={t("advancedAnalytics")}>
            {/* Serve Performance */}
            <div>
          <div className="mb-3 md:mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-foreground mb-1">{commonT("serveStatisticsHeader")}</h3>
            <p className="text-sm text-gray-700 dark:text-muted-foreground">{commonT("serveStatisticsDescription")}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            <StatCard 
              icon={Zap} 
              label={commonT("acesLabel")} 
              value={stats.totalAces}
              subtitle={`${(stats.totalAces / Math.max(stats.totalMatches, 1)).toFixed(1)}/${matchT("match")}`}
              variant={(stats.totalAces / Math.max(stats.totalMatches, 1)) >= 5 ? "success" : (stats.totalAces / Math.max(stats.totalMatches, 1)) >= 2 ? "primary" : "default"}
              cardIndex={4}
              cardType="serve"
            />
            <StatCard 
              icon={Target} 
              label={commonT("firstServePercentageLabel")} 
              value={`${stats.firstServePercentage}%`}
              subtitle={stats.firstServePercentage >= 65 ? t("excellent") : stats.firstServePercentage >= 55 ? t("good") : t("needsWork")}
              trend={stats.firstServePercentage >= 60 ? "up" : "down"}
              variant={stats.firstServePercentage >= 65 ? "success" : stats.firstServePercentage >= 55 ? "primary" : "warning"}
              cardIndex={5}
              cardType="serve"
            />
            <StatCard 
              icon={Activity} 
              label={commonT("servicePointsLabel")} 
              value={stats.servicePointsWon}
              subtitle={commonT("pointsWonServing")}
              trend={stats.servicePointsWon >= 60 ? "up" : "down"}
              variant={stats.servicePointsWon >= 70 ? "success" : stats.servicePointsWon >= 60 ? "primary" : "warning"}
              cardIndex={6}
              cardType="serve"
            />
            <StatCard 
              icon={RotateCcw} 
              label={commonT("doubleFaultsLabel")} 
              value={stats.totalDoubleFaults}
              subtitle={`${(stats.totalDoubleFaults / Math.max(stats.totalMatches, 1)).toFixed(1)}/${matchT("match")}`}
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
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-foreground mb-1">{commonT("returnGameHeader")}</h3>
            <p className="text-sm text-gray-700 dark:text-muted-foreground">{commonT("returnGameDescription")}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            <StatCard 
              icon={ArrowUpRight} 
              label={commonT("breakPointsWonLabel")} 
              value={stats.breakPointsConverted}
              subtitle={commonT("opportunitiesConverted")}
              trend={stats.breakPointConversionRate >= 40 ? "up" : "down"}
              variant={stats.breakPointConversionRate >= 50 ? "success" : stats.breakPointConversionRate >= 30 ? "primary" : "warning"}
              cardIndex={8}
              cardType="return"
            />
            <StatCard 
              icon={CircleArrowDown} 
              label={commonT("returnPointsLabel")} 
              value={`${stats.firstReturnWinPercentage}%`}
              subtitle={commonT("pointsWonReturning")}
              trend={stats.firstReturnWinPercentage >= 35 ? "up" : "down"}
              variant={stats.firstReturnWinPercentage >= 40 ? "success" : stats.firstReturnWinPercentage >= 30 ? "primary" : "warning"}
              cardIndex={9}
              cardType="return"
            />
            <StatCard 
              icon={Shield} 
              label={commonT("breakPointsSavedLabel")} 
              value={stats.breakPointsSaved}
              subtitle={commonT("defensiveHolds")}
              trend={stats.breakPointsSaved >= stats.breakPointsFaced * 0.6 ? "up" : "down"}
              variant={stats.breakPointsSaved >= stats.breakPointsFaced * 0.7 ? "success" : "primary"}
              cardIndex={10}
              cardType="return"
            />
            <StatCard 
              icon={Target} 
              label={commonT("firstReturnPercentageLabel")} 
              value={`${stats.firstReturnPercentage}%`}
              subtitle={commonT("qualityImproving")}
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
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-foreground mb-1">{commonT("shotMakingHeader")}</h3>
            <p className="text-sm text-gray-700 dark:text-muted-foreground">{commonT("shotMakingDescription")}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            <StatCard 
              icon={Award} 
              label={commonT("winnersLabel")} 
              value={stats.totalWinners}
              subtitle={`${(stats.totalWinners / Math.max(stats.totalMatches, 1)).toFixed(1)}/${matchT("match")}`}
              variant={stats.winnersPerMatch >= 15 ? "success" : stats.winnersPerMatch >= 10 ? "primary" : "default"}
              cardIndex={12}
              cardType="shotmaking"
            />
            <StatCard 
              icon={CircleArrowDown} 
              label={commonT("unforcedErrorsLabel")} 
              value={stats.totalUnforcedErrors}
              subtitle={commonT("unforcedErrorsDescription")}
              trend={stats.winnerToErrorRatio >= 1 ? "up" : "down"}
              variant={stats.winnerToErrorRatio >= 1.2 ? "success" : stats.winnerToErrorRatio >= 0.8 ? "primary" : "warning"}
              cardIndex={13}
              cardType="shotmaking"
            />
            <StatCard 
              icon={Percent} 
              label={commonT("secondServePointsWonPercent")}
              value={`${stats.secondServePointsWonPercentage}%`}
              subtitle={commonT("defensiveHolds")}
              variant="default"
              cardIndex={14}
              cardType="shotmaking"
            />
            <StatCard 
              icon={ArrowDownLeft} 
              label={commonT("forcedErrorsLabel")}
              value={stats.totalForcedErrors}
              subtitle={commonT("unforcedErrorsDescription")}
              variant="default"
              cardIndex={15}
              cardType="shotmaking"
            />
          </div>
        </div>
        
        {/* Performance Insights Section */}
        <div className="space-y-3 md:space-y-4 lg:space-y-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-foreground">{t("performanceInsights")}</h3>
            <Badge variant="outline" className="ml-auto text-xs">
              {t("advancedAnalytics")}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            <StatCard 
              icon={Flame} 
              label={t("recentForm")} 
              value={`${Math.round(stats.recentForm)}%`}
              subtitle={t("last5Matches")}
              trend={stats.recentForm >= 60 ? "up" : "down"}
              variant={stats.recentForm >= 80 ? "success" : stats.recentForm >= 60 ? "primary" : "warning"}
              cardIndex={16}
              cardType="insights"
            />
            <StatCard 
              icon={Calendar} 
              label={t("thisMonthHeader")} 
              value={stats.thisMonthMatches}
              subtitle={t("matchesLabel")}
              variant={stats.thisMonthMatches >= 5 ? "success" : stats.thisMonthMatches >= 3 ? "primary" : "default"}
              cardIndex={17}
              cardType="insights"
            />
            <StatCard 
              icon={Timer} 
              label={t("courtTime")} 
              value={stats.totalPlayingTime}
              subtitle={t("totalPlayingTime")}
              variant="primary"
              cardIndex={18}
              cardType="insights"
            />
            {stats.bestTimeOfDay && (
              <StatCard 
                icon={Target} 
                label={t("peakPerformance")} 
                value={t(stats.bestTimeOfDay)}
                subtitle={t("bestPlayingTime")}
                variant="success"
                cardIndex={19}
                cardType="insights"
              />
            )}
            <StatCard 
              icon={Activity} 
              label={t("avgDuration")} 
              value={stats.averageMatchDuration}
              subtitle={t("perMatch")}
              variant="default"
              cardIndex={stats.bestTimeOfDay ? 20 : 19}
              cardType="insights"
            />
            {stats.forehandBackhandRatio > 0 && (
              <StatCard 
                icon={Zap} 
                label={t("fhBhRatio")} 
                value={`${stats.forehandBackhandRatio}:1`}
                subtitle={t("forehandPreference")}
                variant={stats.forehandBackhandRatio >= 2 ? "primary" : "default"}
                cardIndex={stats.bestTimeOfDay ? 21 : 20}
                cardType="insights"
              />
            )}
          </div>
        </div>

            {/* Performance Charts */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
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
            </motion.div>
          </div>
        )}
      </div>

      {/* Recent Matches */}
      {recentMatches.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <Card className="hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">{t("recentMatches")}</h3>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/matches">{t("viewAll")}</Link>
                </Button>
              </div>
              <div className="space-y-3">
                {recentMatches.map((match, index) => (
                  <motion.div
                    key={match.$id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        match.winnerId === mainPlayer?.$id 
                          ? "bg-green-500" 
                          : "bg-red-500"
                      }`} />
                      <div>
                        <p className="text-sm font-medium">
                          {t("vs")} {match.playerTwoId === mainPlayer?.$id ? t("player1") : t("player2")}
                        </p>
                        <p className="text-xs text-gray-700 dark:text-muted-foreground">
                          {new Date(match.matchDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {t("inProgressMatches")}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Monthly Progress Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        <Card className="hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">{t("thisMonthHeader")}</h3>
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  <FramerAnimatedCounter 
                    value={stats.thisMonthMatches} 
                    duration={2.0} 
                    delay={12.0} // Start after main cards complete
                    shouldAnimate={cardAnimation.hasTriggered}
                    ease="anticipate"
                  />
                </div>
                <div className="text-xs text-gray-700 dark:text-muted-foreground">{t("matchesLabel")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  <FramerAnimatedCounter 
                    value={Math.round(stats.thisMonthMatches * stats.winRate / 100)} 
                    duration={2.0} 
                    delay={12.5}
                    shouldAnimate={cardAnimation.hasTriggered}
                    ease="easeOut"
                  />
                </div>
                <div className="text-xs text-gray-700 dark:text-muted-foreground">{t("wonLabel")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">{stats.averageMatchDuration}</div>
                <div className="text-xs text-gray-700 dark:text-muted-foreground">{t("avgDurationLabel")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  <FramerAnimatedCounter 
                    value={stats.currentWinStreak} 
                    duration={2.0} 
                    delay={13.0}
                    shouldAnimate={cardAnimation.hasTriggered}
                    ease="backOut"
                  />
                </div>
                <div className="text-xs text-gray-700 dark:text-muted-foreground">{t("winStreakMonthlyLabel")}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Nemesis & Bunny Stats */}
      {mainPlayer && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <NemesisBunnyStats
            playerId={mainPlayer.$id}
            playerName={`${mainPlayer.firstName} ${mainPlayer.lastName}`}
            opponentRecords={analyzeOpponentRecords(
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
                  finalScore: match.score,
                  endTime: match.endTime,
                  createdAt: match.$createdAt || match.matchDate
                } as MatchData))
            )}
          />
        </motion.div>
      )}
    </motion.div>
  )
}