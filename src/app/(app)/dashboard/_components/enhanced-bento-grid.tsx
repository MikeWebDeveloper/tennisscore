"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AnimatedCounter } from "@/components/ui/animated-counter"
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
  ArrowDownLeft
} from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { PerformanceCharts } from "./performance-charts"
import { Match, Player } from "@/lib/types"
import { useTranslations } from "@/hooks/use-translations"
import { aggregatePlayerStatsAcrossMatches, calculatePlayerWinStreak } from "@/lib/utils/match-stats"

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
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  show: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
}

const buttonVariants = {
  hover: { 
    scale: 1.02,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  },
  tap: { 
    scale: 0.98,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  }
}

// Skeleton components for loading states
function ChartsSkeleton() {
  return (
    <div className="h-[300px] w-full animate-pulse rounded-lg bg-muted/50" />
  )
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
      totalForcedErrors: 0
    }
  }

  const agg = aggregatePlayerStatsAcrossMatches(matches, mainPlayerId)
  const streaks = calculatePlayerWinStreak(matches, mainPlayerId)

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
    forehandBackhandRatio: 0, // Not yet aggregated
    winnersPerMatch: agg.totalMatches > 0 ? agg.totalWinners / agg.totalMatches : 0,
    winnerToErrorRatio: agg.winnerToErrorRatio,
    netPointsWonPercentage: agg.netPointsWonPercentage,
    
    // Return Game Stats
    firstReturnPercentage: agg.returnPointsPct,
    
    // Additional contextual stats
    averageMatchDuration: "0m", // Placeholder
    longestWinStreak: streaks.max,
    thisMonthMatches: 0, // TODO: Add if needed
    secondServePointsWonPercentage: agg.secondServePointsWonPercentage,
    totalForcedErrors: agg.totalForcedErrors
  }
}

export function EnhancedBentoGrid({ matches, mainPlayer }: EnhancedBentoGridProps) {
  const t = useTranslations()
  
  // Calculate comprehensive stats
  const stats = calculateEnhancedStats(matches, mainPlayer?.$id)

  // Recent matches for quick access
  const recentMatches = matches
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
    .slice(0, 3)

  // Enhanced stat card component with animations and better styling
  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    subtitle,
    trend,
    className = "",
    variant = "default"
  }: {
    icon: LucideIcon
    label: string
    value: string | number
    subtitle?: string
    trend?: "up" | "down" | "neutral"
    className?: string
    variant?: "default" | "primary" | "success" | "warning" | "danger"
  }) => {
    const getVariantClasses = () => {
      switch (variant) {
        case "primary":
          return "border-primary/20 hover:border-primary/40 bg-primary/5"
        case "success":
          return "border-green-500/20 hover:border-green-500/40 bg-green-500/5"
        case "warning":
          return "border-yellow-500/20 hover:border-yellow-500/40 bg-yellow-500/5"
        case "danger":
          return "border-red-500/20 hover:border-red-500/40 bg-red-500/5"
        default:
          return "border-border hover:border-border/80"
      }
    }

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
      <motion.div variants={itemVariants} className={className}>
        <Card className={`h-24 md:h-32 lg:h-36 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group ${getVariantClasses()}`}>
          <CardContent className="p-3 md:p-4 lg:p-6 h-full">
            <div className="flex flex-col h-full justify-between">
              {/* Header with icon and trend */}
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground font-medium truncate">{label}</p>
                  {getTrendIcon()}
                </div>
                <div className="p-1.5 md:p-2 lg:p-2.5 rounded-full bg-muted/50 group-hover:bg-muted/80 transition-colors duration-200 ml-2 flex-shrink-0">
                  <Icon className={`h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 ${getIconColor()}`} />
                </div>
              </div>
              
              {/* Value */}
              <div className="flex-1 flex items-center">
                <p className="text-lg md:text-2xl lg:text-3xl font-bold text-foreground group-hover:scale-105 transition-transform duration-200 font-mono leading-none">
                  {typeof value === 'number' ? (
                    <AnimatedCounter
                      value={value}
                      duration={1.5}
                      delay={0.3}
                    />
                  ) : typeof value === 'string' && value.includes('%') ? (
                    <AnimatedCounter
                      value={parseInt(value.replace('%', ''))}
                      suffix="%"
                      duration={1.5}
                      delay={0.3}
                    />
                  ) : (
                    value
                  )}
                </p>
              </div>
              
              {/* Subtitle */}
              {subtitle && (
                <div className="mt-1">
                  <p className="text-xs md:text-xs lg:text-sm text-muted-foreground/80 truncate leading-tight">
                    {subtitle}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
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
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap" className="flex-1">
          <Button asChild className="w-full h-11 font-medium shadow-sm">
            <Link href="/matches/new">
              <Plus className="h-4 w-4 mr-2" />
              {t("newMatch")}
            </Link>
          </Button>
        </motion.div>
        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap" className="flex-1">
          <Button variant="outline" asChild className="w-full h-11">
            <Link href="/players">
              <UserPlus className="h-4 w-4 mr-2" />
              {t("addPlayer")}
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      {/* 16 Comprehensive Stats Cards */}
      <div className="space-y-6 md:space-y-8">
        {/* Basic Performance */}
        <motion.div variants={itemVariants}>
          <div className="mb-3 md:mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1">{t("performanceOverviewHeader")}</h3>
            <p className="text-sm text-muted-foreground">{t("performanceOverviewDescription")}</p>
          </div>
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6"
          >
            <StatCard 
              icon={Trophy} 
              label={t("matchesWon")} 
              value={stats.totalMatchesWon}
              subtitle={`${t("ofTotal")} ${stats.totalMatches}`}
              trend={stats.winRate > 50 ? "up" : "neutral"}
              variant={stats.winRate >= 70 ? "success" : stats.winRate >= 50 ? "primary" : "default"}
            />
            <StatCard 
              icon={Percent} 
              label={t("winRate")} 
              value={`${stats.winRate}%`}
              subtitle={stats.winRate >= 70 ? t("qualityExcellent") : stats.winRate >= 50 ? t("qualityGood") : t("qualityWorkNeeded")}
              trend={stats.winRate > 50 ? "up" : "down"}
              variant={stats.winRate >= 70 ? "success" : stats.winRate >= 50 ? "primary" : "warning"}
            />
            <StatCard 
              icon={Calendar} 
              label={t("totalMatches")} 
              value={stats.totalMatches}
              subtitle={`${stats.thisMonthMatches} ${t("completedDescription")}`}
              variant="default"
            />
            <StatCard 
              icon={Flame} 
              label={t("winStreakLabel")} 
              value={stats.currentWinStreak}
              subtitle={`${t("best")}: ${stats.longestWinStreak}`}
              trend={stats.currentWinStreak > 0 ? "up" : "neutral"}
              variant={stats.currentWinStreak >= 3 ? "success" : "default"}
            />
          </motion.div>
        </motion.div>

        {/* Serve Performance */}
        <motion.div variants={itemVariants}>
          <div className="mb-3 md:mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1">{t("serveStatisticsHeader")}</h3>
            <p className="text-sm text-muted-foreground">{t("serveStatisticsDescription")}</p>
          </div>
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6"
          >
            <StatCard 
              icon={Zap} 
              label={t("acesLabel")} 
              value={stats.totalAces}
              subtitle={`${(stats.totalAces / Math.max(stats.totalMatches, 1)).toFixed(1)}/match`}
              variant={(stats.totalAces / Math.max(stats.totalMatches, 1)) >= 5 ? "success" : (stats.totalAces / Math.max(stats.totalMatches, 1)) >= 2 ? "primary" : "default"}
            />
            <StatCard 
              icon={Target} 
              label={t("firstServePercentageLabel")} 
              value={`${stats.firstServePercentage}%`}
              subtitle={stats.firstServePercentage >= 65 ? t("qualityExcellent") : stats.firstServePercentage >= 55 ? t("qualityGood") : t("qualityWorkNeeded")}
              trend={stats.firstServePercentage >= 60 ? "up" : "down"}
              variant={stats.firstServePercentage >= 65 ? "success" : stats.firstServePercentage >= 55 ? "primary" : "warning"}
            />
            <StatCard 
              icon={Activity} 
              label={t("servicePointsLabel")} 
              value={stats.servicePointsWon}
              subtitle={t("pointsWonServing")}
              trend={stats.servicePointsWon >= 60 ? "up" : "down"}
              variant={stats.servicePointsWon >= 70 ? "success" : stats.servicePointsWon >= 60 ? "primary" : "warning"}
            />
            <StatCard 
              icon={RotateCcw} 
              label={t("doubleFaultsLabel")} 
              value={stats.totalDoubleFaults}
              subtitle={`${(stats.totalDoubleFaults / Math.max(stats.totalMatches, 1)).toFixed(1)}/match`}
              trend={(stats.totalDoubleFaults / Math.max(stats.totalMatches, 1)) <= 2 ? "up" : "down"}
              variant={(stats.totalDoubleFaults / Math.max(stats.totalMatches, 1)) <= 1 ? "success" : (stats.totalDoubleFaults / Math.max(stats.totalMatches, 1)) <= 3 ? "primary" : "danger"}
            />
          </motion.div>
        </motion.div>

        {/* Return Game */}
        <motion.div variants={itemVariants}>
          <div className="mb-3 md:mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1">{t("returnGameHeader")}</h3>
            <p className="text-sm text-muted-foreground">{t("returnGameDescription")}</p>
          </div>
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6"
          >
            <StatCard 
              icon={ArrowUpRight} 
              label={t("breakPointsWonLabel")} 
              value={stats.breakPointsConverted}
              subtitle={t("opportunitiesConverted")}
              trend={stats.breakPointConversionRate >= 40 ? "up" : "down"}
              variant={stats.breakPointConversionRate >= 50 ? "success" : stats.breakPointConversionRate >= 30 ? "primary" : "warning"}
            />
            <StatCard 
              icon={CircleArrowDown} 
              label={t("returnPointsLabel")} 
              value={`${stats.firstReturnWinPercentage}%`}
              subtitle={t("pointsWonReturning")}
              trend={stats.firstReturnWinPercentage >= 35 ? "up" : "down"}
              variant={stats.firstReturnWinPercentage >= 40 ? "success" : stats.firstReturnWinPercentage >= 30 ? "primary" : "warning"}
            />
            <StatCard 
              icon={Shield} 
              label={t("breakPointsSavedLabel")} 
              value={stats.breakPointsSaved}
              subtitle={t("defensiveHolds")}
              trend={stats.breakPointsSaved >= stats.breakPointsFaced * 0.6 ? "up" : "down"}
              variant={stats.breakPointsSaved >= stats.breakPointsFaced * 0.7 ? "success" : "primary"}
            />
            <StatCard 
              icon={Target} 
              label={t("firstReturnPercentageLabel")} 
              value={`${stats.firstReturnPercentage}%`}
              subtitle={t("qualityImproving")}
              trend={stats.firstReturnPercentage >= 50 ? "up" : "down"}
              variant={stats.firstReturnPercentage >= 60 ? "success" : stats.firstReturnPercentage >= 45 ? "primary" : "warning"}
            />
          </motion.div>
        </motion.div>

        {/* Shot Making */}
        <motion.div variants={itemVariants}>
          <div className="mb-3 md:mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1">{t("shotMakingHeader")}</h3>
            <p className="text-sm text-muted-foreground">{t("shotMakingDescription")}</p>
          </div>
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6"
          >
            <StatCard 
              icon={Award} 
              label={t("winnersLabel")} 
              value={stats.totalWinners}
              subtitle={`${(stats.totalWinners / Math.max(stats.totalMatches, 1)).toFixed(1)}/match`}
              variant={stats.winnersPerMatch >= 15 ? "success" : stats.winnersPerMatch >= 10 ? "primary" : "default"}
            />
            <StatCard 
              icon={CircleArrowDown} 
              label={t("unforcedErrorsLabel")} 
              value={stats.totalUnforcedErrors}
              subtitle={t("unforcedErrorsDescription")}
              trend={stats.winnerToErrorRatio >= 1 ? "up" : "down"}
              variant={stats.winnerToErrorRatio >= 1.2 ? "success" : stats.winnerToErrorRatio >= 0.8 ? "primary" : "warning"}
            />
            <StatCard 
              icon={Percent} 
              label={t("secondServePointsWonPercent")}
              value={`${stats.secondServePointsWonPercentage}%`}
              subtitle={t("defensiveHolds")}
              variant="default"
            />
            <StatCard 
              icon={ArrowDownLeft} 
              label={t("forcedErrorsLabel")}
              value={stats.totalForcedErrors}
              subtitle={t("unforcedErrorsDescription")}
              variant="default"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Performance Charts */}
      <motion.div variants={itemVariants}>
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

      {/* Recent Matches */}
      {recentMatches.length > 0 && (
        <motion.div variants={itemVariants}>
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
                        <p className="text-xs text-muted-foreground">
                          {new Date(match.matchDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {t("inProgress")}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Monthly Progress Card */}
      <motion.div variants={itemVariants}>
        <Card className="hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">{t("thisMonthHeader")}</h3>
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  <AnimatedCounter value={stats.thisMonthMatches} duration={1.2} delay={0.2} />
                </div>
                <div className="text-xs text-muted-foreground">{t("matchesLabel")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  <AnimatedCounter value={Math.round(stats.thisMonthMatches * stats.winRate / 100)} duration={1.2} delay={0.4} />
                </div>
                <div className="text-xs text-muted-foreground">{t("wonLabel")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">{stats.averageMatchDuration}</div>
                <div className="text-xs text-muted-foreground">{t("avgDurationLabel")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  <AnimatedCounter value={stats.currentWinStreak} duration={1.2} delay={0.6} />
                </div>
                <div className="text-xs text-muted-foreground">{t("winStreakMonthlyLabel")}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
} 