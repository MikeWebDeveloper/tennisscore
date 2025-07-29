"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts"
import { Match } from "@/lib/types"
import { aggregatePlayerStatsAcrossMatches } from "@/lib/utils/match-stats"
import { useTranslations } from "@/i18n"
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns"

interface PerformanceTrendsProps {
  matches: Match[]
  mainPlayerId: string
}

export function PerformanceTrends({ matches, mainPlayerId }: PerformanceTrendsProps) {
  const t = useTranslations('common')
  const tStats = useTranslations('statistics')

  // Calculate monthly performance data
  const monthlyData = useMemo(() => {
    const completedMatches = matches.filter(m => m.status === 'completed')
    
    // Get last 12 months
    const now = new Date()
    const twelveMonthsAgo = subMonths(now, 11)
    const months = eachMonthOfInterval({
      start: twelveMonthsAgo,
      end: now
    })

    return months.map(month => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      
      const monthMatches = completedMatches.filter(match => {
        const matchDate = new Date(match.matchDate)
        return matchDate >= monthStart && matchDate <= monthEnd
      })

      const monthStats = aggregatePlayerStatsAcrossMatches(monthMatches, mainPlayerId)
      
      return {
        month: format(month, 'MMM yy'),
        matches: monthMatches.length,
        winRate: monthStats.winRate,
        avgDuration: 0, // Not available in aggregated stats
        firstServe: monthStats.firstServePercentage,
        pointsWon: 0, // Not available in aggregated stats
        breakPointConversion: monthStats.breakPointConversionRate,
        aces: monthStats.totalAces,
        winners: monthStats.totalWinners,
        errors: monthStats.totalUnforcedErrors
      }
    })
  }, [matches, mainPlayerId])

  // Calculate form over last 10 matches
  const formData = useMemo(() => {
    const completedMatches = matches
      .filter(m => m.status === 'completed')
      .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
      .slice(0, 10)
      .reverse()

    return completedMatches.map((match, index) => {
      const isWin = match.winnerId === mainPlayerId
      const stats = aggregatePlayerStatsAcrossMatches([match], mainPlayerId)
      
      return {
        match: `M${index + 1}`,
        result: isWin ? 1 : 0,
        pointsWon: 0, // Not available in aggregated stats
        firstServe: stats.firstServePercentage,
        winners: stats.totalWinners,
        errors: stats.totalUnforcedErrors,
        date: format(new Date(match.matchDate), 'dd/MM')
      }
    })
  }, [matches, mainPlayerId])

  // Calculate performance by time of day
  const timeOfDayData = useMemo(() => {
    const timeSlots = {
      morning: { matches: 0, wins: 0, label: 'Morning (6-12)' },
      afternoon: { matches: 0, wins: 0, label: 'Afternoon (12-18)' },
      evening: { matches: 0, wins: 0, label: 'Evening (18-24)' }
    }

    matches.filter(m => m.status === 'completed' && m.startTime).forEach(match => {
      const hour = new Date(match.startTime!).getHours()
      const isWin = match.winnerId === mainPlayerId

      if (hour < 12) {
        timeSlots.morning.matches++
        if (isWin) timeSlots.morning.wins++
      } else if (hour < 18) {
        timeSlots.afternoon.matches++
        if (isWin) timeSlots.afternoon.wins++
      } else {
        timeSlots.evening.matches++
        if (isWin) timeSlots.evening.wins++
      }
    })

    return Object.values(timeSlots).map(slot => ({
      time: slot.label,
      matches: slot.matches,
      winRate: slot.matches > 0 ? Math.round((slot.wins / slot.matches) * 100) : 0
    }))
  }, [matches, mainPlayerId])

  // Performance radar chart data
  const radarData = useMemo(() => {
    const stats = aggregatePlayerStatsAcrossMatches(matches, mainPlayerId)
    
    return [
      {
        metric: 'Serve',
        value: stats.firstServePercentage,
        fullMark: 100
      },
      {
        metric: 'Return',
        value: stats.returnPointsPct,
        fullMark: 100
      },
      {
        metric: 'Winners',
        value: Math.min((stats.totalWinners / Math.max(stats.totalMatches, 1)) * 5, 100),
        fullMark: 100
      },
      {
        metric: 'Consistency',
        value: Math.max(100 - (stats.totalUnforcedErrors / Math.max(stats.totalMatches, 1)) * 2, 0),
        fullMark: 100
      },
      {
        metric: 'Break Points',
        value: stats.breakPointConversionRate,
        fullMark: 100
      },
      {
        metric: 'Pressure',
        value: stats.breakPointSaveRate,
        fullMark: 100
      }
    ]
  }, [matches, mainPlayerId])

  return (
    <div className="space-y-6">
      {/* Monthly Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle>{tStats('monthlyPerformanceTrend')}</CardTitle>
          <CardDescription>
            {tStats('trackYourPerformanceOverTime')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="winrate" className="space-y-4">
            <div className="overflow-x-auto scrollbar-hide pb-2">
              <TabsList className="flex w-max xs:w-full xs:grid xs:grid-cols-4">
                <TabsTrigger value="winrate" className="text-xs sm:text-sm px-2 xs:px-3 sm:px-4 min-w-[70px] xs:min-w-0">Win Rate</TabsTrigger>
                <TabsTrigger value="serve" className="text-xs sm:text-sm px-2 xs:px-3 sm:px-4 min-w-[70px] xs:min-w-0">Serve Stats</TabsTrigger>
                <TabsTrigger value="points" className="text-xs sm:text-sm px-2 xs:px-3 sm:px-4 min-w-[70px] xs:min-w-0">Points Won</TabsTrigger>
                <TabsTrigger value="shotmaking" className="text-xs sm:text-sm px-2 xs:px-3 sm:px-4 min-w-[85px] xs:min-w-0">Shot Making</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="winrate">
              <div className="h-[200px] xs:h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="winRate" 
                    stroke="#22c55e" 
                    fill="#22c55e20" 
                    strokeWidth={2}
                    name="Win Rate (%)"
                  />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="serve">
              <div className="h-[200px] xs:h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="firstServe" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="First Serve %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="aces" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name={t("common.charts.aces")}
                  />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="points">
              <div className="h-[200px] xs:h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="pointsWon" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf620" 
                    strokeWidth={2}
                    name="Points Won %"
                  />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="shotmaking">
              <div className="h-[200px] xs:h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="winners" fill="#22c55e" name={t("common.charts.winners")} />
                  <Bar dataKey="errors" fill="#ef4444" name={t("common.charts.unforcedErrors")} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Form - Mobile Optimized Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{tStats('recentForm')}</CardTitle>
            <CardDescription>
              {tStats('lastTenMatchesPerformance')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] xs:h-[225px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="match" className="text-xs" />
                <YAxis className="text-xs" domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="pointsWon" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Points Won %"
                />
                <Line 
                  type="monotone" 
                  dataKey="firstServe" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="First Serve %"
                />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Radar */}
        <Card>
          <CardHeader>
            <CardTitle>{tStats('performanceProfile')}</CardTitle>
            <CardDescription>
              {tStats('overallStrengthsAndWeaknesses')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] xs:h-[225px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid className="stroke-muted" />
                <PolarAngleAxis dataKey="metric" className="text-xs" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-xs" />
                <Radar 
                  name={t("common.charts.performance")} 
                  dataKey="value" 
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time of Day Performance */}
      <Card>
        <CardHeader>
          <CardTitle>{tStats('performanceByTimeOfDay')}</CardTitle>
          <CardDescription>
            {tStats('whenYouPlayBest')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[150px] xs:h-[175px] sm:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeOfDayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="time" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Bar dataKey="winRate" fill="#3b82f6" name="Win Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}