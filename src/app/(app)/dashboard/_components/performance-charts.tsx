"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { TrendingUp, Target } from "lucide-react"
import { useMemo, useState, useEffect } from "react"
import { Match, Player } from "@/lib/types"
import { useTranslations } from "@/hooks/use-translations"

interface PerformanceChartsProps {
  matches: Match[]
  mainPlayer: Player | null
}

export function PerformanceCharts({ matches, mainPlayer }: PerformanceChartsProps) {
  const [isClient, setIsClient] = useState(false)
  const t = useTranslations()

  // Ensure this only runs on the client to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Prepare win/loss trend data
  const winLossTrend = useMemo(() => {
    if (!isClient || !mainPlayer) return []
    
    const completedMatches = matches
      .filter(m => m.status === "completed")
      .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())
      .slice(-10) // Last 10 matches
    
    let wins = 0
    let total = 0
    
    return completedMatches.map((match, index) => {
      total++
      // Check if main player won this match
      const userWon = match.winnerId === mainPlayer.$id
      if (userWon) wins++
      
      return {
        match: index + 1,
        winRate: Math.round((wins / total) * 100),
        date: new Date(match.matchDate).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      }
    })
  }, [matches, mainPlayer, isClient])

  // Prepare performance breakdown data
  const performanceBreakdown = useMemo(() => {
    if (!isClient) return []
    
    const completedMatches = matches.filter(m => m.status === "completed")
    if (completedMatches.length === 0) return []

    const errorBreakdown = [
      { name: t('unforcedErrorsLabel'), value: 25, fill: 'rgb(var(--foreground))' },
      { name: t('forcedErrorsLabel'), value: 20, fill: 'rgb(var(--muted-foreground))' },
      { name: 'Aces', value: 10, fill: 'rgb(var(--primary))' }
    ]

    return errorBreakdown
  }, [matches, isClient, t])

  // Recent form data
  const recentForm = useMemo(() => {
    if (!isClient || !mainPlayer) return []
    
    const recent = matches
      .filter(m => m.status === "completed")
      .slice(-5)
      .map((match, index) => ({
        match: `M${index + 1}`,
        result: match.winnerId === mainPlayer.$id ? 'W' : 'L',
        score: '6-4' // This would come from actual match score
      }))

    return recent
  }, [matches, mainPlayer, isClient])

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-4 bg-slate-700/50 rounded w-1/4 mx-auto"></div>
              <div className="h-48 bg-slate-700/30 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (matches.filter(m => m.status === "completed").length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <TrendingUp className="h-12 w-12 text-gray-600 dark:text-slate-600 mb-4" />
            <p className="text-gray-700 dark:text-slate-500 mb-2">No performance data yet</p>
            <p className="text-sm text-gray-600 dark:text-slate-600">Complete some matches to see your charts</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Win Rate Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-2"
      >
        <Card className="h-full bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-slate-200">
              <TrendingUp className="h-5 w-5 text-primary" />
              Win Rate Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={winLossTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="rgb(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="rgb(var(--muted-foreground))"
                  fontSize={12}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgb(var(--card))',
                    border: '1px solid rgb(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: 'rgb(var(--foreground))'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="winRate" 
                  stroke="rgb(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'rgb(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'rgb(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="h-full bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-slate-200">
              <Target className="h-5 w-5 text-primary" />
              Point Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={performanceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {performanceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgb(var(--card))',
                    border: '1px solid rgb(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: 'rgb(var(--foreground))'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {performanceBreakdown.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.fill }}
                  />
                  <span className="text-xs text-gray-700 dark:text-slate-400">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="xl:col-span-1 lg:col-span-2"
      >
        <Card className="h-full bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-gray-900 dark:text-slate-200">Recent Form</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 justify-center mb-4">
              {recentForm.map((match, index) => (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    match.result === 'W' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {match.result}
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-700 dark:text-slate-500">
              Last {recentForm.length} matches
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 