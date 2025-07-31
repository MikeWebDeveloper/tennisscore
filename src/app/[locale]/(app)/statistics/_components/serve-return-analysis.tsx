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
  PieChart,
  Pie,
  Cell,
  Legend,
  RadialBarChart,
  RadialBar
} from "recharts"
import { Match } from "@/lib/types"
import { Zap } from "lucide-react"
import { Target } from "lucide-react"
import { Shield } from "lucide-react"
import { TrendingUp } from "lucide-react"
import { useTranslations } from "@/i18n"

interface ServeReturnAnalysisProps {
  stats: {
    breakPointConversionRate: number
    breakPointSavePct?: number
    totalAces: number
    totalMatches: number
    totalDoubleFaults: number
    totalServes?: number
    firstServePercentage: number
    firstServeWinRate: number
    secondServeWinRate: number
    returnPointsPct: number
    totalReturnPointsPlayed?: number
    totalServicePointsWon?: number
    totalReturnPointsWon?: number
    totalBreakPointsWon?: number
    totalBreakPointOpportunities?: number
    totalBreakPointsSaved?: number
    totalBreakPointsFaced?: number
  }
  matches: Match[]
  mainPlayerId: string
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export function ServeReturnAnalysis({ stats, matches, mainPlayerId }: ServeReturnAnalysisProps) {
  const t = useTranslations('statistics')

  // Calculate detailed serve statistics
  const serveAnalysis = useMemo(() => {
    const analysis = {
      firstServePoints: { won: 0, total: 0 },
      secondServePoints: { won: 0, total: 0 },
      acesByPlacement: {
        wide: 0,
        body: 0,
        t: 0,
        unknown: 0
      },
      doubleFaultsBySet: [] as number[],
      serveSpeed: {
        slow: { count: 0, won: 0 },
        medium: { count: 0, won: 0 },
        fast: { count: 0, won: 0 }
      },
      serveTrends: [] as { match: number; value: number }[]
    }

    matches.filter(m => m.status === 'completed').forEach(match => {
      // For now, we'll skip detailed stats calculation
      // as it requires point log parsing which is complex

      // Analyze aces by placement (if available in point log)
      if (match.pointLog) {
        match.pointLog.forEach(pointStr => {
          try {
            const point = JSON.parse(pointStr)
            if (point.pointOutcome === 'ace' && 
                ((match.playerOneId === mainPlayerId && point.winner === 'p1') ||
                 (match.playerTwoId === mainPlayerId && point.winner === 'p2'))) {
              const placement = point.servePlacement || 'unknown'
              analysis.acesByPlacement[placement as keyof typeof analysis.acesByPlacement]++
            }
          } catch {
            // Skip invalid point
          }
        })
      }
    })

    // Calculate percentages
    const firstServePct = analysis.firstServePoints.total > 0 
      ? Math.round((analysis.firstServePoints.won / analysis.firstServePoints.total) * 100)
      : 0
    const secondServePct = analysis.secondServePoints.total > 0
      ? Math.round((analysis.secondServePoints.won / analysis.secondServePoints.total) * 100)
      : 0

    return {
      ...analysis,
      firstServeWinPct: firstServePct,
      secondServeWinPct: secondServePct
    }
  }, [matches, mainPlayerId])

  // Calculate return statistics
  const returnAnalysis = useMemo(() => {
    const analysis = {
      firstReturnPoints: { won: 0, total: 0 },
      secondReturnPoints: { won: 0, total: 0 },
      breakPointsBySet: [] as { set: number, converted: number, total: number }[],
      returnDepth: {
        deep: { success: 0, points: 0 },
        mid: { success: 0, points: 0 },
        short: { success: 0, points: 0 }
      },
      aggressiveness: {
        defensive: 0,
        neutral: 0,
        offensive: 0
      }
    }

    matches.filter(m => m.status === 'completed').forEach(() => {
      // For now, we'll skip detailed stats calculation
      // as it requires point log parsing which is complex
    })

    const firstReturnPct = analysis.firstReturnPoints.total > 0
      ? Math.round((analysis.firstReturnPoints.won / analysis.firstReturnPoints.total) * 100)
      : 0

    return {
      ...analysis,
      firstReturnWinPct: firstReturnPct
    }
  }, [matches])

  // Serve placement data for pie chart
  const servePlacementData = Object.entries(serveAnalysis.acesByPlacement)
    .filter(([, value]) => value > 0)
    .map(([placement, count]) => ({
      name: placement.charAt(0).toUpperCase() + placement.slice(1),
      value: count
    }))

  // Serve effectiveness comparison
  const serveEffectivenessData = [
    {
      category: "First Serve",
      percentage: serveAnalysis.firstServeWinPct,
      points: serveAnalysis.firstServePoints.won
    },
    {
      category: "Second Serve",
      percentage: serveAnalysis.secondServeWinPct,
      points: serveAnalysis.secondServePoints.won
    }
  ]

  // Return effectiveness data with NaN safeguards
  const returnEffectivenessData = [
    {
      category: "Break Point Conversion",
      value: isNaN(stats.breakPointConversionRate) || !stats.breakPointConversionRate ? 0 : stats.breakPointConversionRate,
      max: 100
    },
    {
      category: "Return Points Won",
      value: returnAnalysis.firstReturnWinPct,
      max: 100
    },
    {
      category: "Break Points Saved",
      value: stats.breakPointSavePct || 0,
      max: 100
    }
  ]

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <Badge variant="outline">Serve</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{stats.totalAces}</p>
              <p className="text-xs text-muted-foreground">{t('totalAces')}</p>
              <Progress value={Math.min((stats.totalAces / Math.max(stats.totalMatches, 1)) * 10, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-blue-500" />
              <Badge variant="outline">Accuracy</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{stats.firstServePercentage}%</p>
              <p className="text-xs text-muted-foreground">{t('firstServeIn')}</p>
              <Progress value={stats.firstServePercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="h-5 w-5 text-green-500" />
              <Badge variant="outline">Return</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{stats.breakPointConversionRate}%</p>
              <p className="text-xs text-muted-foreground">{t('breakPointConversion')}</p>
              <Progress value={stats.breakPointConversionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <Badge variant="outline">Pressure</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{stats.breakPointSavePct || 0}%</p>
              <p className="text-xs text-muted-foreground">{t('breakPointsSaved')}</p>
              <Progress value={stats.breakPointSavePct || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Serve Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('serveEffectiveness')}</CardTitle>
            <CardDescription>
              {t('pointsWonOnServe')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] sm:h-[225px] md:h-[250px] min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serveEffectivenessData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="category" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="percentage" fill="#3b82f6" name="Win Percentage" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('acePlacement')}</CardTitle>
            <CardDescription>
              {t('whereYouServeAces')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {servePlacementData.length > 0 ? (
              <div className="h-[200px] sm:h-[225px] md:h-[250px] min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <Pie
                    data={servePlacementData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {servePlacementData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No ace data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Return Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>{t('returnGameEffectiveness')}</CardTitle>
          <CardDescription>
            {t('performanceWhenReturning')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] sm:h-[275px] md:h-[300px] min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="10%" 
              outerRadius="80%" 
              data={returnEffectivenessData}
            >
              <RadialBar 
                dataKey="value" 
                cornerRadius={10}
                fill="#8b5cf6"
              />
              <Legend />
              <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('detailedServeReturnStats')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">{t('serveStatistics')}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('totalServes')}</span>
                    <span>{stats.totalServes || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('doubleFaults')}</span>
                    <span>{stats.totalDoubleFaults}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('acesPerMatch')}</span>
                    <span>{(stats.totalAces / Math.max(stats.totalMatches, 1)).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('servicePointsWon')}</span>
                    <span>{stats.totalServicePointsWon || 0}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">{t('returnStatistics')}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('returnPointsPlayed')}</span>
                    <span>{stats.totalReturnPointsPlayed || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('returnPointsWon')}</span>
                    <span>{stats.totalReturnPointsWon || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('breakPointsWon')}</span>
                    <span>{stats.totalBreakPointsWon || 0} / {stats.totalBreakPointOpportunities || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('breakPointsSaved')}</span>
                    <span>{stats.totalBreakPointsSaved || 0} / {stats.totalBreakPointsFaced || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}