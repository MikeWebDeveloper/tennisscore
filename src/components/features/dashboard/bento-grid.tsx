"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Trophy, 
  Users, 
  Calendar, 
  Play,
  TrendingUp,
  Zap,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface BentoGridProps {
  stats: {
    totalMatches: number
    winRate: number
    totalPlayers: number
    completedMatches: number
    inProgressMatches: number
  }
  matches: Array<{
    $id: string
    matchDate: string
    status: string
  }>
  players: Array<{
    $id: string
    firstName: string
    lastName: string
    rating?: string
  }>
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

export function BentoGrid({ stats, matches, players }: BentoGridProps) {
  // Mock data for charts (in real app this would come from props)
  const winLossData = [
    { date: 'Jan', winRate: 65 },
    { date: 'Feb', winRate: 70 },
    { date: 'Mar', winRate: 68 },
    { date: 'Apr', winRate: 72 },
    { date: 'May', winRate: 75 },
    { date: 'Jun', winRate: stats.winRate }
  ]

  const errorData = [
    { name: 'Forehand', value: 35, color: '#ef4444' },
    { name: 'Backhand', value: 25, color: '#f97316' },
    { name: 'Serve', value: 15, color: '#eab308' },
    { name: 'Volley', value: 25, color: '#39FF14' }
  ]

  const recentMatches = matches.slice(0, 2)
  
  return (
    <div className="w-full space-y-8">
      {/* Mobile Layout - Stack vertically */}
      <div className="block lg:hidden">
        <motion.div
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Win Rate Card */}
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border-primary/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <CardContent className="p-8 text-center relative z-10">
                <Trophy className="h-12 w-12 text-primary mx-auto mb-6" />
                <div className="text-5xl font-bold text-primary mb-2 font-mono">
                  {stats.completedMatches > 0 ? `${stats.winRate}%` : "-"}
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-2">Win Rate</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.completedMatches} completed matches
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* KPI Cards Row */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div variants={itemVariants}>
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-mono font-bold text-foreground">85%</div>
                  <p className="text-xs text-muted-foreground font-medium">1st Serve</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-mono font-bold text-foreground">62%</div>
                  <p className="text-xs text-muted-foreground font-medium">Break Pts</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-mono font-bold text-foreground">23</div>
                  <p className="text-xs text-muted-foreground font-medium">Aces</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Other cards... */}
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-r from-card to-card/80 border-border hover:border-primary/50 transition-all duration-300 group">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-heading font-bold text-foreground group-hover:text-primary transition-colors">Start New Match</h3>
                  <p className="text-sm text-muted-foreground">Begin scoring a live tennis match</p>
                </div>
                <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-primary/25">
                  <Link href="/matches/new">
                    <Plus className="h-4 w-4 mr-2" />
                    New
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Desktop Bento Grid - Exact Frontend.md Specification */}
      <div className="hidden lg:block">
        <motion.div
          className="grid grid-cols-4 grid-rows-4 gap-6 h-[700px]"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Large Main Card (2x2): Win/Loss Record Chart */}
          <motion.div 
            variants={itemVariants}
            className="col-span-2 row-span-2"
          >
            <Card className="h-full bg-gradient-to-br from-primary/20 via-primary/15 to-primary/5 border-primary/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
              <CardHeader className="pb-4 relative z-10">
                <CardTitle className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  Performance Over Time
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full pt-0 relative z-10">
                <div className="text-center mb-6">
                  <div className="text-6xl font-mono font-bold text-primary mb-2 tracking-tight">
                    {stats.completedMatches > 0 ? `${stats.winRate}%` : "-"}
                  </div>
                  <p className="text-lg font-heading font-semibold text-foreground">Current Win Rate</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.completedMatches} completed matches
                  </p>
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={winLossData}>
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <YAxis hide />
                      <Line 
                        type="monotone" 
                        dataKey="winRate" 
                        stroke="#39FF14" 
                        strokeWidth={3}
                        dot={{ fill: '#39FF14', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#39FF14', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Wide Card (2x1): Key Performance Indicators */}
          <motion.div 
            variants={itemVariants}
            className="col-span-2 row-span-1"
          >
            <Card className="h-full bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-heading font-semibold text-foreground">Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold text-primary mb-1">85%</div>
                    <p className="text-sm font-medium text-muted-foreground">1st Serve %</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold text-blue-400 mb-1">62%</div>
                    <p className="text-sm font-medium text-muted-foreground">Break Points</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold text-green-400 mb-1">68%</div>
                    <p className="text-sm font-medium text-muted-foreground">Return Points</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Square Card (1x1): Serve Weapon */}
          <motion.div variants={itemVariants} className="col-span-1 row-span-1">
            <Card className="h-full bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  Serve Weapon
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Aces</span>
                    <span className="text-2xl font-mono font-bold text-green-400">23</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Double Faults</span>
                    <span className="text-2xl font-mono font-bold text-red-400">7</span>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <div className="text-center">
                      <div className="text-lg font-mono font-bold text-primary">3.3:1</div>
                      <p className="text-xs text-muted-foreground">Ace/DF Ratio</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Square Card (1x1): Error Analysis */}
          <motion.div variants={itemVariants} className="col-span-1 row-span-1">
            <Card className="h-full bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-400" />
                  Error Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-center">
                <div className="h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={errorData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {errorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Call-to-Action Card (1x1): Start New Match */}
          <motion.div 
            variants={itemVariants}
            className="col-span-1 row-span-1"
          >
            <Card className="h-full bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30 hover:border-primary/50 transition-all duration-300 group cursor-pointer">
              <Link href="/matches/new" className="h-full block">
                <CardContent className="h-full p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent group-hover:from-primary/10 transition-all duration-300" />
                  <div className="relative z-10">
                    <Plus className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="text-lg font-heading font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                      Start New Match
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Begin scoring
                    </p>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </motion.div>

          {/* Players Management (1x1) */}
          <motion.div variants={itemVariants} className="col-span-1 row-span-1">
            <Card className="h-full bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Players
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {players.length === 0 ? (
                  <div className="text-center py-4">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-muted-foreground text-sm mb-3">No players</p>
                    <Button asChild variant="outline" size="sm" className="border-primary/50 hover:bg-primary/10">
                      <Link href="/players">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center mb-4">
                      <div className="text-2xl font-mono font-bold text-foreground">{stats.totalPlayers}</div>
                      <p className="text-xs text-muted-foreground">Total Players</p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full border-primary/50 hover:bg-primary/10">
                      <Link href="/players">
                        Manage Players
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Matches (2x1) */}
          <motion.div 
            variants={itemVariants}
            className="col-span-2 row-span-1"
          >
            <Card className="h-full bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-400" />
                    Recent Matches
                  </CardTitle>
                  <Button asChild variant="ghost" size="sm" className="hover:text-primary">
                    <Link href="/matches" className="text-muted-foreground hover:text-foreground">
                      View All
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {recentMatches.length === 0 ? (
                  <div className="text-center py-6">
                    <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground mb-4">No matches yet</p>
                    <Button asChild variant="outline" size="sm" className="border-primary/50 hover:bg-primary/10">
                      <Link href="/matches/new">
                        <Play className="h-4 w-4 mr-2" />
                        Start First Match
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentMatches.map((match, index) => (
                      <motion.div
                        key={match.$id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Match • {new Date(match.matchDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(match.matchDate).toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge
                          className={
                            match.status === "Completed"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-amber-500/20 text-amber-400 border-amber-500/30 pulse-primary"
                          }
                        >
                          {match.status}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
} 