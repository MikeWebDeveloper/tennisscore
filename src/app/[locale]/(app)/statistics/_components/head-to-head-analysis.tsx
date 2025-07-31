"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { UPlotBarChart, UPlotLineChart, UPlotPieChart } from "@/components/ui/charts"
import { Match, Player } from "@/lib/types"
import { TrendingUp } from "lucide-react"
import { TrendingDown } from "lucide-react"
import { Users } from "lucide-react"
import { aggregatePlayerStatsAcrossMatches } from "@/lib/utils/match-stats"
import { useTranslations } from "@/i18n"

interface HeadToHeadAnalysisProps {
  matches: Match[]
  mainPlayerId: string
}

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6']

export function HeadToHeadAnalysis({ matches, mainPlayerId }: HeadToHeadAnalysisProps) {
  const t = useTranslations('statistics')

  // Group matches by opponent
  const opponentData = useMemo(() => {
    const completedMatches = matches.filter(m => m.status === 'completed')
    const opponentMap = new Map<string, {
      opponent: Player | null
      matches: Match[]
      wins: number
      losses: number
    }>()

    completedMatches.forEach(match => {
      const opponentId = match.playerOneId === mainPlayerId ? match.playerTwoId : match.playerOneId
      const opponent = match.playerOneId === mainPlayerId ? match.playerTwo : match.playerOne
      
      if (!opponentMap.has(opponentId)) {
        opponentMap.set(opponentId, {
          opponent: opponent || null,
          matches: [],
          wins: 0,
          losses: 0
        })
      }

      const data = opponentMap.get(opponentId)!
      data.matches.push(match)
      
      if (match.winnerId === mainPlayerId) {
        data.wins++
      } else {
        data.losses++
      }
    })

    // Convert to array and sort by total matches
    return Array.from(opponentMap.values())
      .filter(data => data.matches.length >= 2) // Only show opponents with 2+ matches
      .sort((a, b) => b.matches.length - a.matches.length)
  }, [matches, mainPlayerId])

  // Calculate detailed stats for each opponent
  const detailedOpponentStats = useMemo(() => {
    return opponentData.map(({ opponent, matches, wins, losses }) => {
      const stats = aggregatePlayerStatsAcrossMatches(matches, mainPlayerId)
      const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0

      // Calculate average match duration
      let totalDuration = 0
      let matchesWithDuration = 0
      matches.forEach(match => {
        if (match.startTime && match.endTime) {
          const duration = new Date(match.endTime).getTime() - new Date(match.startTime).getTime()
          totalDuration += duration / 60000 // Convert to minutes
          matchesWithDuration++
        }
      })
      const avgDuration = matchesWithDuration > 0 ? Math.round(totalDuration / matchesWithDuration) : 0

      // Calculate recent form (last 3 matches)
      const recentMatches = matches
        .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
        .slice(0, 3)
      const recentWins = recentMatches.filter(m => m.winnerId === mainPlayerId).length

      return {
        opponent,
        totalMatches: matches.length,
        wins,
        losses,
        winRate,
        avgDuration,
        recentForm: `${recentWins}/${recentMatches.length}`,
        pointsWonPct: 0, // This stat is not available in aggregated stats
        breakPointConversionPct: stats.breakPointConversionRate,
        firstServePct: stats.firstServePercentage,
        acesPerMatch: Math.round((stats.totalAces / matches.length) * 10) / 10,
        matches
      }
    })
  }, [opponentData, mainPlayerId])

  // Selected opponent for detailed view
  const selectedOpponentStats = detailedOpponentStats[0] // Default to most played opponent

  // H2H comparison chart data
  const h2hComparisonData = selectedOpponentStats ? [
    {
      metric: "Win Rate",
      you: selectedOpponentStats.winRate,
      opponent: 100 - selectedOpponentStats.winRate
    },
    {
      metric: "Points Won",
      you: selectedOpponentStats.pointsWonPct,
      opponent: 100 - selectedOpponentStats.pointsWonPct
    },
    {
      metric: "Break Points",
      you: selectedOpponentStats.breakPointConversionPct,
      opponent: 100 - selectedOpponentStats.breakPointConversionPct
    },
    {
      metric: "First Serve",
      you: selectedOpponentStats.firstServePct,
      opponent: 100 - selectedOpponentStats.firstServePct
    }
  ] : []

  // Match history chart
  const matchHistoryData = selectedOpponentStats ? 
    selectedOpponentStats.matches
      .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())
      .map((match, index) => ({
        match: `Match ${index + 1}`,
        result: match.winnerId === mainPlayerId ? 1 : 0,
        date: new Date(match.matchDate).toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'short',
          year: '2-digit'
        })
      }))
    : []

  // Performance by surface/conditions
  const surfaceData = useMemo(() => {
    if (!selectedOpponentStats) return []

    const surfaces = new Map<string, { wins: number, total: number }>()
    
    selectedOpponentStats.matches.forEach(match => {
      const surface = "Unknown" // Surface property doesn't exist in Match type
      if (!surfaces.has(surface)) {
        surfaces.set(surface, { wins: 0, total: 0 })
      }
      
      const data = surfaces.get(surface)!
      data.total++
      if (match.winnerId === mainPlayerId) {
        data.wins++
      }
    })

    return Array.from(surfaces.entries()).map(([surface, data]) => ({
      surface,
      winRate: Math.round((data.wins / data.total) * 100),
      matches: data.total
    }))
  }, [selectedOpponentStats, mainPlayerId])

  if (opponentData.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center space-y-3">
            <Users className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">{t('notEnoughH2HData')}</p>
            <p className="text-sm text-muted-foreground">{t('playMoreMatches')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Opponent Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{t('opponentOverview')}</CardTitle>
          <CardDescription>
            {t('yourPerformanceAgainstRegularOpponents')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {detailedOpponentStats.slice(0, 5).map((stats, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    {(stats.opponent?.firstName?.charAt(0) || "") + (stats.opponent?.lastName?.charAt(0) || "") || "?"}
                  </div>
                  <div>
                    <p className="font-medium">{stats.opponent ? `${stats.opponent.firstName} ${stats.opponent.lastName}`.trim() : t('unknownPlayer')}</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.totalMatches} matches • Last match: {stats.recentForm}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-2xl font-bold">{stats.wins}-{stats.losses}</p>
                    <p className="text-sm text-muted-foreground">{t('winLoss')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{stats.winRate}%</p>
                    <Progress value={stats.winRate} className="w-20 h-2" />
                  </div>
                  {stats.winRate >= 50 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedOpponentStats && (
        <>
          {/* Detailed H2H Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* H2H Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>
                  vs {selectedOpponentStats.opponent ? `${selectedOpponentStats.opponent.firstName} ${selectedOpponentStats.opponent.lastName}`.trim() : ""}
                </CardTitle>
                <CardDescription>
                  {t('keyMetricsComparison')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] sm:h-[225px] md:h-[250px] min-h-[200px]">
                  <UPlotBarChart 
                    data={h2hComparisonData} 
                    dataKeys={['you', 'opponent']} 
                    nameKey="metric" 
                    colors={['#22c55e', '#ef4444']} 
                    height={250} 
                    layout="horizontal"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Match History */}
            <Card>
              <CardHeader>
                <CardTitle>{t('matchHistory')}</CardTitle>
                <CardDescription>
                  {t('resultsTrendVs')} {selectedOpponentStats.opponent ? `${selectedOpponentStats.opponent.firstName} ${selectedOpponentStats.opponent.lastName}`.trim() : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] sm:h-[225px] md:h-[250px] min-h-[200px]">
                  <UPlotLineChart 
                    data={matchHistoryData} 
                    height={200} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance by Conditions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* By Surface */}
            {surfaceData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('bySurface')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[150px] sm:h-[175px] md:h-[200px] min-h-[150px]">
                    <UPlotPieChart 
                      data={surfaceData.map((item, index) => ({
                        name: `${item.surface}: ${item.winRate}%`,
                        value: item.winRate,
                        fill: COLORS[index % COLORS.length]
                      }))}
                      height={150}
                      outerRadius={70}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Key Stats */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">{t('keyStatsVs')} {selectedOpponentStats.opponent ? `${selectedOpponentStats.opponent.firstName} ${selectedOpponentStats.opponent.lastName}`.trim() : ""}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('avgMatchDuration')}</p>
                      <p className="text-xl font-semibold">{selectedOpponentStats.avgDuration} min</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('acesPerMatch')}</p>
                      <p className="text-xl font-semibold">{selectedOpponentStats.acesPerMatch}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('longestWinStreak')}</p>
                      <p className="text-xl font-semibold">
                        {calculateLongestStreak(selectedOpponentStats.matches, mainPlayerId)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('currentStreak')}</p>
                      <p className="text-xl font-semibold">
                        {calculateCurrentStreak(selectedOpponentStats.matches, mainPlayerId)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

// Helper functions
function calculateLongestStreak(matches: Match[], playerId: string): string {
  const sortedMatches = [...matches].sort((a, b) => 
    new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
  )
  
  let longestStreak = 0
  let currentStreak = 0
  
  sortedMatches.forEach(match => {
    if (match.winnerId === playerId) {
      currentStreak++
      longestStreak = Math.max(longestStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  })
  
  return `W${longestStreak}`
}

function calculateCurrentStreak(matches: Match[], playerId: string): string {
  const sortedMatches = [...matches].sort((a, b) => 
    new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
  )
  
  let streak = 0
  let isWinStreak = true
  
  for (const match of sortedMatches) {
    if (streak === 0) {
      // First match determines the type of streak
      isWinStreak = match.winnerId === playerId
      streak = 1
    } else {
      // Check if streak continues
      const isWin = match.winnerId === playerId
      if (isWin === isWinStreak) {
        streak++
      } else {
        break
      }
    }
  }
  
  return isWinStreak ? `W${streak}` : `L${streak}`
}