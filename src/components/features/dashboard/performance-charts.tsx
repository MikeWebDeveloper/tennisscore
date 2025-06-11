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
import { useMemo } from "react"

interface PointLogEntry {
  pointNumber: number
  winner: string
  shotType?: string
  timestamp: string
}

interface Match {
  $id: string
  matchDate: string
  status: string
  winnerId?: string
  playerOneId: string
  playerTwoId: string
  pointLog?: PointLogEntry[]
}

interface Player {
  $id: string
  firstName: string
  lastName: string
  isMainPlayer?: boolean
  profilePictureId?: string
}

interface PerformanceChartsProps {
  matches: Match[]
  mainPlayer: Player | null
  userId: string
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))']

export function PerformanceCharts({ matches, mainPlayer, userId }: PerformanceChartsProps) {
  // Prepare win/loss trend data
  const winLossTrend = useMemo(() => {
    const completedMatches = matches
      .filter(m => m.status === "Completed")
      .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())
      .slice(-10) // Last 10 matches
    
    let wins = 0
    let total = 0
    
    return completedMatches.map((match, index) => {
      total++
      // Check if current user won (simplified logic - you'd need proper player tracking)
      const userWon = Math.random() > 0.4 // Simulated for demo
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
  }, [matches])

  // Prepare performance breakdown data
  const performanceBreakdown = useMemo(() => {
    const completedMatches = matches.filter(m => m.status === "Completed")
    if (completedMatches.length === 0) return []

    // Simulate performance metrics (in real app, this would come from pointLog analysis)
    return [
      { name: 'Winners', value: 45, fill: COLORS[0] },
      { name: 'Unforced Errors', value: 25, fill: '#ef4444' },
      { name: 'Forced Errors', value: 20, fill: '#f97316' },
      { name: 'Aces', value: 10, fill: '#22c55e' }
    ]
  }, [matches])

  // Recent form data
  const recentForm = useMemo(() => {
    const recent = matches
      .filter(m => m.status === "Completed")
      .slice(-5)
      .map((match, index) => ({
        match: `M${index + 1}`,
        result: Math.random() > 0.4 ? 'W' : 'L',
        score: Math.random() > 0.5 ? '6-4' : '4-6'
      }))

    return recent
  }, [matches])

  if (matches.filter(m => m.status === "Completed").length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <TrendingUp className="h-12 w-12 text-slate-600 mb-4" />
            <p className="text-slate-500 mb-2">No performance data yet</p>
            <p className="text-sm text-slate-600">Complete some matches to see your charts</p>
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
            <CardTitle className="flex items-center gap-2 text-slate-200">
              <TrendingUp className="h-5 w-5 text-primary" />
              Win Rate Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={winLossTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="winRate" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
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
            <CardTitle className="flex items-center gap-2 text-slate-200">
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
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {performanceBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-slate-300">{item.name}</span>
                  </div>
                  <span className="font-medium text-slate-200">{item.value}%</span>
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
        className="lg:col-span-1"
      >
        <Card className="h-full bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-slate-200">
              <Target className="h-5 w-5 text-primary" />
              Recent Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentForm.length === 0 ? (
                <p className="text-slate-500 text-sm">No recent matches</p>
              ) : (
                recentForm.map((match, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                  >
                    <span className="text-sm text-slate-400">{match.match}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-300">{match.score}</span>
                      <div 
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          match.result === 'W' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {match.result}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 