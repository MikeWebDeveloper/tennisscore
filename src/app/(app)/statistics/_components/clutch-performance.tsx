"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from "recharts"
import { Match } from "@/lib/types"
import { Trophy, Target, Brain, Flame, Heart } from "lucide-react"

interface ClutchPerformanceProps {
  pressureStats: {
    pressurePerformanceIndex: number
    breakPointsSaved: number
    breakPointsFaced: number
    breakPointsConverted: number
    breakPointOpportunities: number
    tiebreaksWon: number
    tiebreaksPlayed: number
    decidingSetsWon: number
    decidingSetsPlayed: number
    breakPointSavePct: number
    breakPointConversionPct: number
    tiebreakWinPct: number
    decidingSetWinPct: number
  }
  mentalToughness: {
    mentalToughnessScore: number
    comebacks: number
    comebackPct: number
    closeMatches: number
    closeMatchWins: number
    closeMatchWinPct: number
  }
  matches: Match[]
  mainPlayerId: string
}

export function ClutchPerformance({ 
  pressureStats, 
  mentalToughness, 
  matches, 
  mainPlayerId 
}: ClutchPerformanceProps) {

  // Calculate clutch performance by score situation
  const clutchByScore = useMemo(() => {
    const situations = {
      servingForSet: { won: 0, total: 0 },
      servingForMatch: { won: 0, total: 0 },
      facingSetPoint: { saved: 0, total: 0 },
      facingMatchPoint: { saved: 0, total: 0 },
      deuce: { won: 0, total: 0 },
      tiebreak: { won: 0, total: 0 }
    }

    matches.filter(m => m.status === 'completed' && m.pointLog).forEach(match => {
      // Analyze point log for clutch situations
      match.pointLog?.forEach((pointStr) => {
        try {
          const point = JSON.parse(pointStr)
          const isPlayerPoint = (
            (match.playerOneId === mainPlayerId && point.winner === 'p1') ||
            (match.playerTwoId === mainPlayerId && point.winner === 'p2')
          )

          // Check score situations
          if (point.score) {
            // Deuce situations
            if (point.score === '40-40' || point.score.includes('Deuce')) {
              situations.deuce.total++
              if (isPlayerPoint) situations.deuce.won++
            }

            // Set/Match point situations (this is simplified - would need more complex logic)
            if (point.isSetPoint) {
              if (point.serverId === mainPlayerId) {
                situations.servingForSet.total++
                if (isPlayerPoint) situations.servingForSet.won++
              } else {
                situations.facingSetPoint.total++
                if (isPlayerPoint) situations.facingSetPoint.saved++
              }
            }

            if (point.isMatchPoint) {
              if (point.serverId === mainPlayerId) {
                situations.servingForMatch.total++
                if (isPlayerPoint) situations.servingForMatch.won++
              } else {
                situations.facingMatchPoint.total++
                if (isPlayerPoint) situations.facingMatchPoint.saved++
              }
            }
          }
        } catch {
          // Skip invalid points
        }
      })
    })

    return Object.entries(situations).map(([situation, stats]) => ({
      situation: situation.replace(/([A-Z])/g, ' $1').trim(), // Convert camelCase to readable text
      successRate: stats.total > 0 ? Math.round((('won' in stats ? stats.won : stats.saved) / stats.total) * 100) : 0,
      total: stats.total,
      successful: 'won' in stats ? stats.won : stats.saved
    }))
  }, [matches, mainPlayerId])

  // Mental toughness radar data
  const mentalRadarData = [
    {
      metric: "Pressure Index",
      value: pressureStats.pressurePerformanceIndex,
      fullMark: 100
    },
    {
      metric: "Comebacks",
      value: mentalToughness.comebackPct,
      fullMark: 100
    },
    {
      metric: "Tiebreaks",
      value: pressureStats.tiebreakWinPct,
      fullMark: 100
    },
    {
      metric: "Deciding Sets",
      value: pressureStats.decidingSetWinPct,
      fullMark: 100
    },
    {
      metric: "Close Matches",
      value: mentalToughness.closeMatchWinPct,
      fullMark: 100
    },
    {
      metric: "Break Points",
      value: (pressureStats.breakPointSavePct + pressureStats.breakPointConversionPct) / 2,
      fullMark: 100
    }
  ]

  // Pressure timeline data
  const pressureTimeline = useMemo(() => {
    return matches
      .filter(m => m.status === 'completed')
      .slice(-10)
      .map((match, index) => {
        const isWin = match.winnerId === mainPlayerId
        const wasCloseMatch = match.score && match.score.includes('7-6') || match.score?.includes('6-7')
        const hadPressure = wasCloseMatch || match.score?.includes('7-5') || match.score?.includes('5-7')

        return {
          match: `M${index + 1}`,
          pressure: hadPressure ? (isWin ? 80 : 40) : (isWin ? 60 : 30),
          result: isWin ? 1 : 0
        }
      })
  }, [matches, mainPlayerId])

  // Calculate clutch rating
  const getClutchRating = () => {
    const score = pressureStats.pressurePerformanceIndex
    if (score >= 80) return { rating: "Ice in Veins", color: "text-blue-500" }
    if (score >= 60) return { rating: "Clutch Performer", color: "text-green-500" }
    if (score >= 40) return { rating: "Steady", color: "text-yellow-500" }
    return { rating: "Developing", color: "text-gray-500" }
  }

  const clutchRating = getClutchRating()

  return (
    <div className="space-y-6">
      {/* Clutch Performance Overview - Mobile Optimized */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <Card className="md:col-span-1">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Brain className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-purple-500" />
              <Badge variant="outline" className={clutchRating.color}>
                {clutchRating.rating}
              </Badge>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-2xl sm:text-3xl font-bold">{pressureStats.pressurePerformanceIndex}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Pressure Performance Index</p>
              </div>
              <Progress value={pressureStats.pressurePerformanceIndex} className="h-2 sm:h-3" />
              <p className="text-xs text-muted-foreground">
                Based on performance in clutch situations
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Key Clutch Stats</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 sm:pb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-blue-500" />
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">{pressureStats.tiebreakWinPct}%</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Tiebreaks</p>
                <p className="text-[10px] sm:text-xs">{pressureStats.tiebreaksWon}/{pressureStats.tiebreaksPlayed}</p>
              </div>
              <div className="text-center">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-yellow-500" />
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">{pressureStats.decidingSetWinPct}%</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Deciding Sets</p>
                <p className="text-[10px] sm:text-xs">{pressureStats.decidingSetsWon}/{pressureStats.decidingSetsPlayed}</p>
              </div>
              <div className="text-center">
                <Flame className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-orange-500" />
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">{mentalToughness.comebacks}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Comebacks</p>
                <p className="text-[10px] sm:text-xs">{mentalToughness.comebackPct}% of matches</p>
              </div>
              <div className="text-center">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-red-500" />
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">{mentalToughness.closeMatchWinPct}%</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Close Matches</p>
                <p className="text-[10px] sm:text-xs">{mentalToughness.closeMatchWins}/{mentalToughness.closeMatches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mental Toughness Radar */}
      <Card>
        <CardHeader>
          <CardTitle>Mental Toughness Profile</CardTitle>
          <CardDescription>
            Performance under pressure across key metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] sm:h-[275px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={mentalRadarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid className="stroke-muted" />
              <PolarAngleAxis dataKey="metric" className="text-xs" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-xs" />
              <Radar 
                name="Performance" 
                dataKey="value" 
                stroke="#8b5cf6" 
                fill="#8b5cf6" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Clutch Situations Performance - Mobile Optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Clutch Situations</CardTitle>
            <CardDescription>
              Success rate in key situations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] xs:h-[225px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clutchByScore} layout="horizontal" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" domain={[0, 100]} className="text-xs" />
                <YAxis dataKey="situation" type="category" className="text-[10px] xs:text-xs" width={80} />
                <Tooltip />
                <Bar dataKey="successRate" fill="#8b5cf6" name="Success Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pressure Trend</CardTitle>
            <CardDescription>
              Recent match pressure performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] xs:h-[225px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pressureTimeline} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="match" className="text-xs" />
                <YAxis className="text-xs" domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="pressure" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Pressure Performance"
                />
                <Line 
                  type="step" 
                  dataKey="result" 
                  stroke="#22c55e" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  name="Win/Loss"
                  yAxisId="right"
                />
                <YAxis yAxisId="right" orientation="right" domain={[0, 1]} hide />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Break Points Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Break Point Performance</CardTitle>
          <CardDescription>
            Crucial moments in matches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium">Break Points Converted</span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {pressureStats.breakPointsConverted}/{pressureStats.breakPointOpportunities}
                  </span>
                </div>
                <Progress value={pressureStats.breakPointConversionPct} className="h-2 sm:h-3" />
                <p className="text-[10px] sm:text-xs text-right">{pressureStats.breakPointConversionPct}%</p>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium">Break Points Saved</span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {pressureStats.breakPointsSaved}/{pressureStats.breakPointsFaced}
                  </span>
                </div>
                <Progress value={pressureStats.breakPointSavePct} className="h-2 sm:h-3" />
                <p className="text-[10px] sm:text-xs text-right">{pressureStats.breakPointSavePct}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}