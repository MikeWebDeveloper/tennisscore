"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Activity, 
  Trophy,
  Target,
  Brain,
  BarChart3,
  Download,
  Filter,
  X
} from "lucide-react"
import { Match, Player } from "@/lib/types"
import { useTranslations } from "@/hooks/use-translations"
import { StatisticsFiltersComponent, StatisticsFilters } from "./_components/statistics-filters"
import { applyFiltersToMatches, hasActiveFilters } from "./_components/filter-utils"
import { 
  aggregatePlayerStatsAcrossMatches,
  calculateDetailedMatchStats
} from "@/lib/utils/match-stats"
import { PerformanceTrends } from "./_components/performance-trends"
import { ServeReturnAnalysis } from "./_components/serve-return-analysis"
import { ClutchPerformance } from "./_components/clutch-performance"
import { HeadToHeadAnalysis } from "./_components/head-to-head-analysis"
import { MatchPatterns } from "./_components/match-patterns"
import { Button } from "@/components/ui/button"

interface EnhancedStatisticsClientProps {
  mainPlayer: Player
  matches: Match[]
}

// Enhanced statistics calculations
function calculateEnhancedStats(matches: Match[], mainPlayerId: string) {
  const completedMatches = matches.filter(m => m.status === 'completed')
  
  // Pressure Performance Index
  const pressureStats = calculatePressurePerformance(completedMatches, mainPlayerId)
  
  // Mental Toughness Score
  const mentalToughness = calculateMentalToughness(completedMatches, mainPlayerId)
  
  // Dominance Score
  const dominance = calculateDominanceScore(completedMatches, mainPlayerId)
  
  // Match patterns
  const patterns = analyzeMatchPatterns(completedMatches, mainPlayerId)
  
  return {
    pressureStats,
    mentalToughness,
    dominance,
    patterns,
    basicStats: aggregatePlayerStatsAcrossMatches(matches, mainPlayerId)
  }
}

function calculatePressurePerformance(matches: Match[], playerId: string) {
  const stats = {
    breakPointsSaved: 0,
    breakPointsFaced: 0,
    breakPointsConverted: 0,
    breakPointOpportunities: 0,
    tiebreaksWon: 0,
    tiebreaksPlayed: 0,
    decidingSetsWon: 0,
    decidingSetsPlayed: 0,
    matchPointsSaved: 0,
    matchPointsFaced: 0,
    matchPointsConverted: 0,
    matchPointOpportunities: 0
  }
  
  matches.forEach(match => {
    if (match.pointLog && match.pointLog.length > 0) {
      // Parse point log strings to PointDetail objects
      const pointLog = match.pointLog.map(pointStr => {
        try {
          return JSON.parse(pointStr)
        } catch {
          return null
        }
      }).filter(Boolean)
      
      const detailedStats = calculateDetailedMatchStats(pointLog)
      if (detailedStats) {
        // Determine if the main player is p1 or p2 in this match
        const isMainPlayerP1 = match.playerOneId === playerId
        const playerIndex = isMainPlayerP1 ? 0 : 1
        const opponentIndex = isMainPlayerP1 ? 1 : 0
        
        // Add the player's break point stats
        stats.breakPointsSaved += detailedStats.breakPointsByPlayer.saved[playerIndex]
        stats.breakPointsFaced += detailedStats.breakPointsByPlayer.faced[playerIndex]
        stats.breakPointsConverted += detailedStats.breakPointsByPlayer.converted[playerIndex]
        
        // For break point opportunities, we need to count how many break points the player had
        // This is the break points the opponent faced (i.e., the player's opportunities)
        stats.breakPointOpportunities += detailedStats.breakPointsByPlayer.faced[opponentIndex]
      }
    }
    
    // Check for tiebreaks and deciding sets
    if (match.score && typeof match.score === 'string') {
      try {
        const scoreData = JSON.parse(match.score)
        if (scoreData.sets) {
          scoreData.sets.forEach((set: { p1: number; p2: number }) => {
            // Check for tiebreak (7-6 or 6-7)
            if ((set.p1 === 7 && set.p2 === 6) || (set.p1 === 6 && set.p2 === 7)) {
              stats.tiebreaksPlayed++
              if ((set.p1 > set.p2 && match.winnerId === playerId) || 
                  (set.p2 > set.p1 && match.winnerId !== playerId)) {
                stats.tiebreaksWon++
              }
            }
          })
          
          // Check for deciding set (3rd or 5th set)
          const isDecidingSet = scoreData.sets.length === 3 || scoreData.sets.length === 5
          if (isDecidingSet) {
            stats.decidingSetsPlayed++
            if (match.winnerId === playerId) {
              stats.decidingSetsWon++
            }
          }
        }
      } catch {
        // Handle parsing error
      }
    }
  })
  
  // Calculate Pressure Performance Index
  const bpSavedPct = stats.breakPointsFaced > 0 ? (stats.breakPointsSaved / stats.breakPointsFaced) * 100 : 0
  const bpConvertedPct = stats.breakPointOpportunities > 0 ? (stats.breakPointsConverted / stats.breakPointOpportunities) * 100 : 0
  const tiebreakPct = stats.tiebreaksPlayed > 0 ? (stats.tiebreaksWon / stats.tiebreaksPlayed) * 100 : 0
  const decidingSetPct = stats.decidingSetsPlayed > 0 ? (stats.decidingSetsWon / stats.decidingSetsPlayed) * 100 : 0
  
  const ppi = ((bpSavedPct * 1.5) + (bpConvertedPct * 1.2) + (tiebreakPct * 1.3) + (decidingSetPct * 1.4)) / 5.4
  
  return {
    ...stats,
    pressurePerformanceIndex: Math.round(ppi),
    breakPointSavePct: Math.round(bpSavedPct),
    breakPointConversionPct: Math.round(bpConvertedPct),
    tiebreakWinPct: Math.round(tiebreakPct),
    decidingSetWinPct: Math.round(decidingSetPct)
  }
}

function calculateMentalToughness(matches: Match[], playerId: string) {
  let comebacks = 0
  let closeMatches = 0
  let closeMatchWins = 0
  
  matches.forEach(match => {
    if (match.score && typeof match.score === 'string') {
      try {
        const scoreData = JSON.parse(match.score)
        if (scoreData.sets && scoreData.sets.length >= 2) {
          // Check for comebacks (lost first set but won match)
          if (scoreData.sets[0].p1 < scoreData.sets[0].p2 && match.winnerId === playerId) {
            comebacks++
          }
          
          // Check for close matches (decided by 2 games or less in final set)
          const lastSet = scoreData.sets[scoreData.sets.length - 1]
          const diff = Math.abs(lastSet.p1 - lastSet.p2)
          if (diff <= 2 || (lastSet.p1 === 7 && lastSet.p2 === 6) || (lastSet.p1 === 6 && lastSet.p2 === 7)) {
            closeMatches++
            if (match.winnerId === playerId) {
              closeMatchWins++
            }
          }
        }
      } catch {
        // Handle parsing error
      }
    }
  })
  
  const comebackPct = matches.length > 0 ? (comebacks / matches.length) * 100 : 0
  const closeMatchWinPct = closeMatches > 0 ? (closeMatchWins / closeMatches) * 100 : 0
  
  // Mental Toughness Score calculation
  const mts = (comebackPct * 1.8) + (closeMatchWinPct * 1.2)
  
  return {
    mentalToughnessScore: Math.round(mts),
    comebacks,
    comebackPct: Math.round(comebackPct),
    closeMatches,
    closeMatchWins,
    closeMatchWinPct: Math.round(closeMatchWinPct)
  }
}

function calculateDominanceScore(matches: Match[], playerId: string) {
  const stats = aggregatePlayerStatsAcrossMatches(matches, playerId)
  
  // Calculate win rates based on available stats
  const winRate = stats.winRate || 0
  
  // Use service/return stats as proxies for game control
  const servicePointsTotal = stats.totalFirstServesAttempted + stats.totalSecondServePointsPlayed
  const servicePointsWon = stats.totalFirstServePointsWon + stats.totalSecondServePointsWon
  const serviceWinPct = servicePointsTotal > 0 ? (servicePointsWon / servicePointsTotal) * 100 : 0
  
  // Calculate dominance score using available metrics
  const dominance = (winRate * 2.0) + (serviceWinPct * 0.8) + 
    (stats.breakPointSaveRate * 0.6) + (stats.breakPointConversionRate * 0.6) +
    (stats.firstServePercentage * 0.3) + (stats.returnPointsPct * 0.4)
  
  return {
    dominanceScore: Math.round(dominance / 5.7 * 100), // Normalize to 0-100 scale
    pointsWonPct: Math.round(serviceWinPct), // Use service win % as proxy
    gamesWonPct: Math.round(winRate), // Use match win rate as proxy
    setsWonPct: Math.round(winRate) // Use match win rate as proxy
  }
}

function analyzeMatchPatterns(matches: Match[], playerId: string) {
  const patterns = {
    averageMatchDuration: 0,
    longestMatch: 0,
    shortestMatch: Infinity,
    averageGamesPerMatch: 0,
    averageSetsPerMatch: 0,
    straightSetWins: 0,
    fiveSetterWins: 0,
    morningPerformance: { played: 0, won: 0 },
    afternoonPerformance: { played: 0, won: 0 },
    eveningPerformance: { played: 0, won: 0 }
  }
  
  let totalDuration = 0
  let matchesWithDuration = 0
  let totalGames = 0
  let totalSets = 0
  
  matches.forEach(match => {
    // Duration analysis
    if (match.startTime && match.endTime) {
      const duration = new Date(match.endTime).getTime() - new Date(match.startTime).getTime()
      const durationMinutes = duration / 60000
      totalDuration += durationMinutes
      matchesWithDuration++
      patterns.longestMatch = Math.max(patterns.longestMatch, durationMinutes)
      patterns.shortestMatch = Math.min(patterns.shortestMatch, durationMinutes)
      
      // Time of day analysis
      const hour = new Date(match.startTime).getHours()
      if (hour < 12) {
        patterns.morningPerformance.played++
        if (match.winnerId === playerId) patterns.morningPerformance.won++
      } else if (hour < 17) {
        patterns.afternoonPerformance.played++
        if (match.winnerId === playerId) patterns.afternoonPerformance.won++
      } else {
        patterns.eveningPerformance.played++
        if (match.winnerId === playerId) patterns.eveningPerformance.won++
      }
    }
    
    // Set analysis
    if (match.score && typeof match.score === 'string') {
      try {
        const scoreData = JSON.parse(match.score)
        if (scoreData.sets) {
          totalSets += scoreData.sets.length
          
          // Count games
          scoreData.sets.forEach((set: { p1: number; p2: number }) => {
            totalGames += set.p1 + set.p2
          })
          
          // Straight sets analysis
          if (match.winnerId === playerId) {
            const playerSets = scoreData.sets.filter((set: { p1: number; p2: number }) => {
              return (match.playerOneId === playerId && set.p1 > set.p2) ||
                     (match.playerTwoId === playerId && set.p2 > set.p1)
            }).length
            
            if (playerSets === scoreData.sets.length) {
              patterns.straightSetWins++
            }
            
            if (scoreData.sets.length === 5) {
              patterns.fiveSetterWins++
            }
          }
        }
      } catch {
        // Handle parsing error
      }
    }
  })
  
  patterns.averageMatchDuration = matchesWithDuration > 0 ? 
    Math.round(totalDuration / matchesWithDuration) : 0
  patterns.averageGamesPerMatch = matches.length > 0 ?
    Math.round(totalGames / matches.length) : 0
  patterns.averageSetsPerMatch = matches.length > 0 ?
    Math.round((totalSets / matches.length) * 10) / 10 : 0
  
  if (patterns.shortestMatch === Infinity) patterns.shortestMatch = 0
  
  return patterns
}

// Main component
export default function EnhancedStatisticsClient({ mainPlayer, matches }: EnhancedStatisticsClientProps) {
  const t = useTranslations('statistics')
  const [filters, setFilters] = useState<StatisticsFilters>({
    dateRange: {},
    opponent: undefined,
    matchFormat: undefined,
    status: undefined,
    minMatches: undefined
  })
  const [activeTab, setActiveTab] = useState("overview")
  const [showFilters, setShowFilters] = useState(false)

  // Apply filters to matches
  const filteredMatches = useMemo(() => 
    applyFiltersToMatches(matches, filters, mainPlayer.$id),
    [matches, filters, mainPlayer.$id]
  )

  // Calculate all statistics
  const stats = useMemo(() => 
    calculateEnhancedStats(filteredMatches, mainPlayer.$id),
    [filteredMatches, mainPlayer.$id]
  )

  const hasFilters = hasActiveFilters(filters)

  return (
    <div className="space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="space-y-3">
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
          <div className="flex items-center gap-2 xs:gap-3">
            <BarChart3 className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
            <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100">
              {t("detailedStatistics")}
            </h1>
          </div>
          <div className="flex gap-2">
            {/* Mobile Filter Toggle with Touch Target */}
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 lg:hidden min-h-[44px] px-3" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden xs:inline">{t("filters")}</span>
              {hasFilters && <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">!</Badge>}
            </Button>
            <Button variant="outline" size="sm" className="gap-2 min-h-[44px] px-3">
              <Download className="h-4 w-4" />
              <span className="hidden xs:inline">{t("exportData")}</span>
            </Button>
          </div>
        </div>
        <p className="text-sm xs:text-base sm:text-lg text-gray-700 dark:text-slate-400">
          {t("deepDiveAnalytics")}
        </p>
      </div>

      {/* Key Performance Indicators - Mobile First */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xs:gap-4">
        <Card className="col-span-1">
          <CardContent className="p-3 xs:p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5 xs:space-y-1 min-w-0 flex-1">
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground truncate">{t("dominanceScore")}</p>
                <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold leading-tight">{stats.dominance.dominanceScore}</p>
                <p className="text-[10px] xs:text-xs text-muted-foreground">{t("outOf", { value: 500 })}</p>
              </div>
              <Trophy className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-yellow-500 flex-shrink-0" />
            </div>
            <Progress value={Math.min((stats.dominance.dominanceScore || 0) / 5, 100)} className="mt-2 xs:mt-3 h-1.5 xs:h-2" />
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-3 xs:p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5 xs:space-y-1 min-w-0 flex-1">
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground truncate">{t("pressureIndex")}</p>
                <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold leading-tight">{stats.pressureStats.pressurePerformanceIndex}</p>
                <p className="text-[10px] xs:text-xs text-muted-foreground">{t("clutchRating")}</p>
              </div>
              <Target className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-red-500 flex-shrink-0" />
            </div>
            <Progress value={stats.pressureStats.pressurePerformanceIndex || 0} className="mt-2 xs:mt-3 h-1.5 xs:h-2" />
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-3 xs:p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5 xs:space-y-1 min-w-0 flex-1">
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground truncate">{t("mentalToughness")}</p>
                <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold leading-tight">{stats.mentalToughness.mentalToughnessScore}</p>
                <p className="text-[10px] xs:text-xs text-muted-foreground">{t("comebacks", { count: stats.mentalToughness.comebacks })}</p>
              </div>
              <Brain className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-purple-500 flex-shrink-0" />
            </div>
            <Progress value={stats.mentalToughness.mentalToughnessScore || 0} className="mt-2 xs:mt-3 h-1.5 xs:h-2" />
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-3 xs:p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5 xs:space-y-1 min-w-0 flex-1">
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground truncate">{t("winRate")}</p>
                <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold leading-tight">{stats.basicStats.winRate}%</p>
                <p className="text-[10px] xs:text-xs text-muted-foreground">{t("ofMatches", { won: stats.basicStats.matchesWon, total: stats.basicStats.totalMatches })}</p>
              </div>
              <Activity className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-green-500 flex-shrink-0" />
            </div>
            <Progress value={stats.basicStats.winRate || 0} className="mt-2 xs:mt-3 h-1.5 xs:h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setShowFilters(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="absolute left-0 top-0 h-full w-[280px] xs:w-80 max-w-[85vw] bg-background border-r p-4 xs:p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">{t("filters")}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <StatisticsFiltersComponent
                matches={matches}
                mainPlayerId={mainPlayer.$id}
                filters={filters}
                onFiltersChange={setFilters}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Desktop Filters Sidebar */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <StatisticsFiltersComponent
            matches={matches}
            mainPlayerId={mainPlayer.$id}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Statistics Tabs */}
        <div className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            {/* Mobile-Optimized Tab Navigation with Scroll Indicators */}
            <div className="relative">
              <div className="overflow-x-auto scrollbar-hide">
                <TabsList className="flex w-max xs:w-full xs:grid xs:grid-cols-5 gap-1">
                  <TabsTrigger value="overview" className="text-[11px] xs:text-xs sm:text-sm px-2 xs:px-3 sm:px-4 min-w-[80px] xs:min-w-0 whitespace-nowrap">
                    <span className="xs:hidden">{t("overview")}</span>
                    <span className="hidden xs:inline sm:hidden">{t("overviewShort")}</span>
                    <span className="hidden sm:inline">{t("overview")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="trends" className="text-[11px] xs:text-xs sm:text-sm px-2 xs:px-3 sm:px-4 min-w-[70px] xs:min-w-0 whitespace-nowrap">
                    {t("trends")}
                  </TabsTrigger>
                  <TabsTrigger value="serve-return" className="text-[11px] xs:text-xs sm:text-sm px-2 xs:px-3 sm:px-4 min-w-[60px] xs:min-w-0 whitespace-nowrap">
                    <span className="sm:hidden">{t("serveReturnShort")}</span>
                    <span className="hidden sm:inline">{t("serveReturn")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="clutch" className="text-[11px] xs:text-xs sm:text-sm px-2 xs:px-3 sm:px-4 min-w-[70px] xs:min-w-0 whitespace-nowrap">
                    {t("clutch")}
                  </TabsTrigger>
                  <TabsTrigger value="head-to-head" className="text-[11px] xs:text-xs sm:text-sm px-2 xs:px-3 sm:px-4 min-w-[60px] xs:min-w-0 whitespace-nowrap">
                    <span className="sm:hidden">{t("headToHeadShort")}</span>
                    <span className="hidden sm:inline">{t("headToHead")}</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              {/* Scroll Indicators for Mobile */}
              <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent pointer-events-none xs:hidden" />
              <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-background to-transparent pointer-events-none xs:hidden" />
            </div>

            <TabsContent value="overview" className="space-y-4 xs:space-y-5 sm:space-y-6 -mt-2 xs:mt-0">
              <MatchPatterns patterns={stats.patterns} />
              
              {/* Quick Stats Grid - Mobile Optimized */}
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 xs:gap-4">
                <Card>
                  <CardHeader className="pb-2 xs:pb-3 px-3 xs:px-4 pt-3 xs:pt-4">
                    <CardTitle className="text-sm xs:text-base sm:text-lg">{t("pointsWon")}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 xs:pb-4 px-3 xs:px-4">
                    <div className="text-lg xs:text-xl sm:text-2xl font-bold">{stats.dominance.pointsWonPct}%</div>
                    <p className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 xs:mt-1">
                      {t("serviceDominance")}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 xs:pb-3 px-3 xs:px-4 pt-3 xs:pt-4">
                    <CardTitle className="text-sm xs:text-base sm:text-lg">{t("gamesWon")}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 xs:pb-4 px-3 xs:px-4">
                    <div className="text-lg xs:text-xl sm:text-2xl font-bold">{stats.dominance.gamesWonPct}%</div>
                    <p className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 xs:mt-1">
                      {t("matchWinRate")}
                    </p>
                  </CardContent>
                </Card>

                <Card className="col-span-1 xs:col-span-2 sm:col-span-1">
                  <CardHeader className="pb-2 xs:pb-3 px-3 xs:px-4 pt-3 xs:pt-4">
                    <CardTitle className="text-sm xs:text-base sm:text-lg">{t("setsWon")}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 xs:pb-4 px-3 xs:px-4">
                    <div className="text-lg xs:text-xl sm:text-2xl font-bold">{stats.dominance.setsWonPct}%</div>
                    <p className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 xs:mt-1">
                      {t("matchWinRate")}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends">
              <PerformanceTrends matches={filteredMatches} mainPlayerId={mainPlayer.$id} />
            </TabsContent>

            <TabsContent value="serve-return">
              <ServeReturnAnalysis 
                stats={{
                  ...stats.basicStats,
                  firstServeWinRate: stats.basicStats.firstServePointsWonPercentage,
                  secondServeWinRate: stats.basicStats.secondServePointsWonPercentage,
                  breakPointSavePct: stats.basicStats.breakPointSaveRate
                }} 
                matches={filteredMatches} 
                mainPlayerId={mainPlayer.$id} 
              />
            </TabsContent>

            <TabsContent value="clutch">
              <ClutchPerformance 
                pressureStats={stats.pressureStats}
                mentalToughness={stats.mentalToughness}
                matches={filteredMatches}
                mainPlayerId={mainPlayer.$id}
              />
            </TabsContent>

            <TabsContent value="head-to-head">
              <HeadToHeadAnalysis matches={filteredMatches} mainPlayerId={mainPlayer.$id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}