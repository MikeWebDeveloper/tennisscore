"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, User2, Trophy, TrendingUp, Calendar, Target, Zap, BarChart3, Activity, Clock, Users, Flame, Award, Star, Percent, Hash, Timer, CalendarDays, Sun, Moon, Swords, Crown, ThumbsDown, ArrowUpRight, ArrowDownRight, GitBranch, Shield, Brain, LineChart, Sparkles, Medal, ToggleLeft, ToggleRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Match, Player, User } from "@/lib/types"
import { useTranslations } from "@/hooks/use-translations"
import Link from "next/link"
import { calculateDetailedStats } from "@/lib/utils/player-statistics"
import { cn } from "@/lib/utils"
import { StatisticsSkeleton } from "./_components/statistics-skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PlayerStatisticsProgressiveProps {
  user: User | null
  mainPlayer: Player | null
  initialMatches?: Match[]
}

interface StatCard {
  id: string
  title: string
  value: string | number
  subValue?: string
  icon: React.ReactNode
  color: string
  size?: "small" | "medium" | "large"
  trend?: {
    value: number
    isPositive: boolean
  }
  matchType?: "all" | "singles" | "doubles"
}

export function PlayerStatisticsProgressive({
  user,
  mainPlayer,
  initialMatches = [],
}: PlayerStatisticsProgressiveProps) {
  const t = useTranslations()
  const playerName = mainPlayer?.firstName || user?.name?.split(' ')[0] || 'Player'
  
  const [isLoading, setIsLoading] = useState(true)
  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [matchType, setMatchType] = useState<"all" | "singles" | "doubles">("all")
  const [stats, setStats] = useState<any>(null)
  
  // Filter matches based on type
  const filteredMatches = matches.filter(match => {
    if (matchType === "all") return true
    if (matchType === "singles") return !match.playerThreeId && !match.playerFourId
    if (matchType === "doubles") return match.playerThreeId && match.playerFourId
    return true
  })

  // Load statistics progressively
  useEffect(() => {
    // Show skeleton immediately, then calculate stats
    const timer = setTimeout(() => {
      const calculatedStats = calculateDetailedStats(filteredMatches, mainPlayer?.$id || '')
      setStats(calculatedStats)
      setIsLoading(false)
    }, 100) // Small delay to show skeleton loading

    return () => clearTimeout(timer)
  }, [filteredMatches, mainPlayer?.$id])

  // Fetch full match data in background if not provided
  useEffect(() => {
    if (initialMatches.length === 0 && mainPlayer?.$id) {
      import("@/lib/actions/matches-optimized").then(({ getMatchesByPlayer }) => {
        getMatchesByPlayer(mainPlayer.$id).then((fetchedMatches) => {
          setMatches(fetchedMatches)
        })
      })
    }
  }, [initialMatches.length, mainPlayer?.$id])

  if (isLoading || !stats) {
    return <StatisticsSkeleton />
  }

  // Define all 32 statistic cards with match type filtering
  const statCards: StatCard[] = [
    // Overall Performance (4 cards)
    {
      id: "total-matches",
      title: t("statTotalMatches"),
      value: stats.totalMatches,
      subValue: `${stats.completedMatches} ${t("completedMatches").toLowerCase()}`,
      icon: <Trophy className="h-5 w-5" />,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      size: "medium",
      matchType: "all"
    },
    {
      id: "win-rate",
      title: t("winRate"),
      value: `${stats.winRate}%`,
      subValue: `${stats.wins}${t("statWins")} - ${stats.losses}${t("statLosses")}`,
      icon: <Percent className="h-5 w-5" />,
      color: "bg-green-500/10 text-green-600 dark:text-green-400",
      size: "medium",
      trend: stats.winRateTrend,
      matchType: "all"
    },
    {
      id: "rating",
      title: t("statCurrentRating"),
      value: stats.currentRating || "1500",
      subValue: stats.ratingChange ? `${stats.ratingChange > 0 ? '+' : ''}${stats.ratingChange}` : t("statStarting"),
      icon: <Star className="h-5 w-5" />,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      size: "medium",
      matchType: "all"
    },
    {
      id: "best-streak",
      title: t("statBestWinStreak"),
      value: stats.bestWinStreak,
      subValue: t("statConsecutiveWins"),
      icon: <Flame className="h-5 w-5" />,
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      size: "small",
      matchType: "all"
    },

    // Match Statistics (6 cards)
    {
      id: "avg-duration",
      title: t("statAvgMatchDuration"),
      value: stats.avgMatchDuration,
      subValue: t("statPerMatch"),
      icon: <Timer className="h-5 w-5" />,
      color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
      size: "small",
      matchType: "all"
    },
    {
      id: "longest-match",
      title: t("statLongestMatch"),
      value: stats.longestMatch.duration,
      subValue: stats.longestMatch.opponent,
      icon: <Clock className="h-5 w-5" />,
      color: "bg-red-500/10 text-red-600 dark:text-red-400",
      size: "small",
      matchType: "all"
    },
    {
      id: "shortest-match",
      title: t("statShortestMatch"),
      value: stats.shortestMatch.duration,
      subValue: stats.shortestMatch.opponent,
      icon: <Zap className="h-5 w-5" />,
      color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      size: "small",
      matchType: "all"
    },
    {
      id: "sets-record",
      title: t("statSetsRecord"),
      value: `${stats.setsWon}-${stats.setsLost}`,
      subValue: `${stats.setWinRate}% ${t("winRate").toLowerCase()}`,
      icon: <Hash className="h-5 w-5" />,
      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
      size: "medium",
      matchType: "all"
    },
    {
      id: "games-record",
      title: t("statGamesRecord"),
      value: `${stats.gamesWon}-${stats.gamesLost}`,
      subValue: `${stats.gameWinRate}% ${t("winRate").toLowerCase()}`,
      icon: <Activity className="h-5 w-5" />,
      color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
      size: "medium",
      matchType: "all"
    },
    {
      id: "points-record",
      title: t("statPointsRecord"),
      value: `${stats.pointsWon}-${stats.pointsLost}`,
      subValue: `${stats.pointWinRate}% ${t("winRate").toLowerCase()}`,
      icon: <Target className="h-5 w-5" />,
      color: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
      size: "medium",
      matchType: "all"
    },

    // Scoring Patterns (6 cards) - Singles only
    {
      id: "ace-rate",
      title: t("statAceRate"),
      value: `${stats.aceRate}%`,
      subValue: `${stats.totalAces} ${t("statTotalAces")}`,
      icon: <Zap className="h-5 w-5" />,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      size: "small",
      matchType: "singles"
    },
    {
      id: "double-fault-rate",
      title: t("statDoubleFaultRate"),
      value: `${stats.doubleFaultRate}%`,
      subValue: `${stats.totalDoubleFaults} ${t("statTotal")}`,
      icon: <ThumbsDown className="h-5 w-5" />,
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      size: "small",
      matchType: "singles"
    },
    {
      id: "break-point-conversion",
      title: t("breakPointConversion"),
      value: `${stats.breakPointConversion}%`,
      subValue: `${stats.breakPointsWon}/${stats.breakPointsTotal}`,
      icon: <GitBranch className="h-5 w-5" />,
      color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      size: "medium",
      matchType: "singles"
    },
    {
      id: "service-games-won",
      title: t("statServiceGamesWon"),
      value: `${stats.serviceGamesWonPct}%`,
      subValue: `${stats.serviceGamesWon}/${stats.serviceGamesTotal}`,
      icon: <Shield className="h-5 w-5" />,
      color: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      size: "small",
      matchType: "singles"
    },
    {
      id: "return-games-won",
      title: t("statReturnGamesWon"),
      value: `${stats.returnGamesWonPct}%`,
      subValue: `${stats.returnGamesWon}/${stats.returnGamesTotal}`,
      icon: <Swords className="h-5 w-5" />,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      size: "small",
      matchType: "singles"
    },
    {
      id: "tiebreak-record",
      title: t("statTiebreakRecord"),
      value: `${stats.tiebreaksWon}-${stats.tiebreaksLost}`,
      subValue: `${stats.tiebreakWinRate}% ${t("winRate").toLowerCase()}`,
      icon: <Crown className="h-5 w-5" />,
      color: "bg-lime-500/10 text-lime-600 dark:text-lime-400",
      size: "small",
      matchType: "all"
    },

    // Time-based Analysis (4 cards)
    {
      id: "best-month",
      title: t("statBestMonth"),
      value: stats.bestMonth.name,
      subValue: `${stats.bestMonth.winRate}% ${t("winRate").toLowerCase()}`,
      icon: <CalendarDays className="h-5 w-5" />,
      color: "bg-green-500/10 text-green-600 dark:text-green-400",
      size: "medium",
      matchType: "all"
    },
    {
      id: "worst-month",
      title: t("statChallengingMonth"),
      value: stats.worstMonth.name,
      subValue: `${stats.worstMonth.winRate}% ${t("winRate").toLowerCase()}`,
      icon: <Calendar className="h-5 w-5" />,
      color: "bg-red-500/10 text-red-600 dark:text-red-400",
      size: "small",
      matchType: "all"
    },
    {
      id: "best-day",
      title: t("statBestDay"),
      value: stats.bestDayOfWeek,
      subValue: `${stats.bestDayWinRate}% ${t("winRate").toLowerCase()}`,
      icon: <Sun className="h-5 w-5" />,
      color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      size: "small",
      matchType: "all"
    },
    {
      id: "time-preference",
      title: t("statTimePreference"),
      value: stats.preferredTimeOfDay,
      subValue: `${stats.timeOfDayWinRate}% ${t("winRate").toLowerCase()}`,
      icon: <Moon className="h-5 w-5" />,
      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
      size: "small",
      matchType: "all"
    },

    // Opponent Analysis (4 cards)
    {
      id: "most-played",
      title: t("statMostPlayedOpponent"),
      value: stats.mostPlayedOpponent.name,
      subValue: `${stats.mostPlayedOpponent.matches} ${t("matches").toLowerCase()}`,
      icon: <Users className="h-5 w-5" />,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      size: "medium",
      matchType: "all"
    },
    {
      id: "best-record",
      title: t("statBestRecordAgainst"),
      value: stats.bestRecordAgainst.name,
      subValue: `${stats.bestRecordAgainst.wins}-${stats.bestRecordAgainst.losses}`,
      icon: <Trophy className="h-5 w-5" />,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      size: "small",
      matchType: "all"
    },
    {
      id: "toughest-opponent",
      title: t("statToughestOpponent"),
      value: stats.toughestOpponent.name,
      subValue: `${stats.toughestOpponent.wins}-${stats.toughestOpponent.losses}`,
      icon: <Shield className="h-5 w-5" />,
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      size: "small",
      matchType: "all"
    },
    {
      id: "avg-opponent-rating",
      title: t("statAvgOpponentRating"),
      value: stats.avgOpponentRating,
      subValue: t("statEloRating"),
      icon: <BarChart3 className="h-5 w-5" />,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      size: "small",
      matchType: "all"
    },

    // Streaks & Records (4 cards)
    {
      id: "current-streak",
      title: t("statCurrentStreak"),
      value: stats.currentStreak.count,
      subValue: stats.currentStreak.type === 'win' ? t("statWins") : t("statLosses"),
      icon: stats.currentStreak.type === 'win' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />,
      color: stats.currentStreak.type === 'win' ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400",
      size: "medium",
      matchType: "all"
    },
    {
      id: "best-win-streak",
      title: t("statLongestWinStreak"),
      value: stats.longestWinStreak,
      subValue: t("statConsecutiveWins"),
      icon: <Flame className="h-5 w-5" />,
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      size: "small",
      matchType: "all"
    },
    {
      id: "worst-loss-streak",
      title: t("statLongestLossStreak"),
      value: stats.longestLossStreak,
      subValue: t("statConsecutiveLosses"),
      icon: <TrendingUp className="h-5 w-5 rotate-180" />,
      color: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
      size: "small",
      matchType: "all"
    },
    {
      id: "comeback-wins",
      title: t("statComebackVictories"),
      value: stats.comebackWins,
      subValue: t("statFromSetDown"),
      icon: <ArrowUpRight className="h-5 w-5" />,
      color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
      size: "small",
      matchType: "all"
    },

    // Advanced Metrics (4 cards)
    {
      id: "clutch-performance",
      title: t("statClutchPerformance"),
      value: `${stats.clutchWinRate}%`,
      subValue: t("statDecidingSets"),
      icon: <Brain className="h-5 w-5" />,
      color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
      size: "medium",
      matchType: "all"
    },
    {
      id: "dominance-score",
      title: t("statDominanceScore"),
      value: stats.dominanceScore,
      subValue: t("statOutOf100"),
      icon: <Crown className="h-5 w-5" />,
      color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      size: "small",
      matchType: "all"
    },
    {
      id: "consistency-rating",
      title: t("statConsistencyRating"),
      value: `${stats.consistencyRating}%`,
      subValue: t("statPerformanceStability"),
      icon: <LineChart className="h-5 w-5" />,
      color: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
      size: "small",
      matchType: "all"
    },
    {
      id: "improvement-trend",
      title: t("statImprovementTrend"),
      value: stats.improvementTrend > 0 ? `+${stats.improvementTrend}%` : `${stats.improvementTrend}%`,
      subValue: t("statLast3Months"),
      icon: <Sparkles className="h-5 w-5" />,
      color: stats.improvementTrend > 0 ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400",
      size: "medium",
      trend: {
        value: stats.improvementTrend,
        isPositive: stats.improvementTrend > 0
      },
      matchType: "all"
    }
  ]

  // Filter cards based on match type
  const filteredCards = statCards.filter(card => 
    card.matchType === "all" || card.matchType === matchType || matchType === "all"
  )

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-4"
      >
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("backToDashboard")}
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <User2 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100">
                {t("playerStatsTitle").replace("{playerName}", playerName)}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/statistics">
                <BarChart3 className="h-4 w-4 mr-2" />
                {t("detailedAnalysis")}
              </Link>
            </Button>
          </div>
        </div>
        
        <p className="text-lg text-gray-700 dark:text-slate-400">
          {t("playerStatsSubtitle")}
        </p>

        {/* Singles/Doubles Toggle */}
        <Tabs value={matchType} onValueChange={(value) => setMatchType(value as "all" | "singles" | "doubles")} className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {t("all")}
            </TabsTrigger>
            <TabsTrigger value="singles" className="flex items-center gap-1">
              <User2 className="h-4 w-4" />
              {t("singles")}
            </TabsTrigger>
            <TabsTrigger value="doubles" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {t("doubles")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Bento Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={matchType}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[minmax(140px,auto)]"
        >
          {filteredCards.map((card, index) => {
            const sizeClasses = {
              small: "col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1",
              medium: "col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1",
              large: "col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2"
            }
            
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.02 * index }}
                className={cn(sizeClasses[card.size || "small"])}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {card.title}
                      </CardTitle>
                      <div className={cn("p-2 rounded-lg", card.color)}>
                        {card.icon}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <p className="text-2xl font-bold">{card.value}</p>
                        {card.trend && (
                          <div className={cn(
                            "flex items-center text-sm",
                            card.trend.isPositive ? "text-green-600" : "text-red-600"
                          )}>
                            {card.trend.isPositive ? (
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 mr-1" />
                            )}
                            {Math.abs(card.trend.value)}%
                          </div>
                        )}
                      </div>
                      {card.subValue && (
                        <p className="text-xs text-muted-foreground">{card.subValue}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="flex justify-center mt-8"
      >
        <Card className="p-6 text-center max-w-md">
          <Medal className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t("wantDeeperInsights")}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t("exploreDeeperInsights")}
          </p>
          <Button asChild>
            <Link href="/statistics">
              {t("viewFullAnalysis")}
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </Card>
      </motion.div>
    </motion.div>
  )
}