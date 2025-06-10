"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Zap, AlertTriangle, Users, Calendar, Plus, BarChart3 } from "lucide-react"

const listVariants = {
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
  show: { opacity: 1, y: 0 }
}

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

// CSS-based chart components
function WinRateChart({ winRate }: { winRate: number }) {
  const segments = [
    { label: "Jan", value: 65 },
    { label: "Feb", value: 72 },
    { label: "Mar", value: 68 },
    { label: "Apr", value: 75 },
    { label: "May", value: winRate || 70 },
  ]

  return (
    <div className="flex items-end justify-between h-32 px-2">
      {segments.map((segment, index) => (
        <div key={segment.label} className="flex flex-col items-center gap-2">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(segment.value / 100) * 80}%` }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            className="w-8 bg-gradient-to-t from-primary/60 to-primary rounded-t-sm min-h-[4px]"
          />
          <span className="text-xs text-muted-foreground">{segment.label}</span>
        </div>
      ))}
    </div>
  )
}

function ErrorDistribution() {
  const errors = [
    { label: "Winners", value: 45, color: "bg-green-500" },
    { label: "Unforced", value: 35, color: "bg-red-500" },
    { label: "Forced", value: 20, color: "bg-orange-500" },
  ]

  return (
    <div className="space-y-3">
      {errors.map((error, index) => (
        <div key={error.label} className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${error.color}`} />
          <div className="flex-1">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">{error.label}</span>
              <span className="text-muted-foreground">{error.value}%</span>
            </div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${error.value}%` }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className={`h-1.5 rounded-full mt-1 ${error.color}`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function BentoGrid({ stats, matches, players }: BentoGridProps) {
  return (
    <motion.div 
      variants={listVariants}
      initial="hidden"
      animate="show"
      className="w-full max-w-7xl mx-auto p-6"
    >
      {/* Mobile Layout */}
      <div className="grid grid-cols-1 gap-6 md:hidden">
        {/* Main Card - Mobile */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-heading font-bold text-foreground">Welcome Back, Mike</h2>
                  <p className="text-sm text-muted-foreground">Track your tennis performance and manage your matches</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-mono font-bold text-primary mb-1 tracking-tight">
                    {stats.completedMatches > 0 ? `${stats.winRate}%` : "-"}
                  </div>
                  <p className="text-sm font-heading font-medium text-foreground">Current Win Rate</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.completedMatches} completed matches
                  </p>
                </div>
                
                <WinRateChart winRate={stats.winRate} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mobile KPI Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-mono font-bold text-primary mb-1">85%</div>
              <p className="text-xs font-medium text-muted-foreground">1st Serve</p>
            </CardContent>
          </Card>
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-mono font-bold text-blue-400 mb-1">62%</div>
              <p className="text-xs font-medium text-muted-foreground">Break Pts</p>
            </CardContent>
          </Card>
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-mono font-bold text-green-400 mb-1">23</div>
              <p className="text-xs font-medium text-muted-foreground">Aces</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional mobile cards... */}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-4 md:auto-rows-[180px] md:gap-6">
        
        {/* Large Main Card (2x2): Primary Win Rate + Chart */}
        <motion.div 
          variants={itemVariants}
          className="col-span-2 row-span-2"
        >
          <Card className="h-full bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-slate-700/50 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
            <CardContent className="relative z-10 p-8 h-full flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-primary/20 border border-primary/30 backdrop-blur-sm">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold text-foreground">Welcome Back, Mike</h2>
                  <p className="text-sm text-muted-foreground">Track your tennis performance and manage your matches</p>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col">
                <div className="text-center mb-6">
                  <div className="text-5xl font-mono font-bold text-primary mb-2 tracking-tight">
                    {stats.completedMatches > 0 ? `${stats.winRate}%` : "-"}
                  </div>
                  <p className="text-lg font-heading font-medium text-foreground">Current Win Rate</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.completedMatches} completed matches
                  </p>
                </div>
                
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-full max-w-md">
                    <WinRateChart winRate={stats.winRate} />
                  </div>
                </div>
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
              <CardTitle className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Key Performance Indicators
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-6 h-full">
                <div className="text-center">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-3xl font-mono font-bold text-primary mb-1"
                  >
                    85%
                  </motion.div>
                  <p className="text-sm font-medium text-muted-foreground">1st Serve %</p>
                </div>
                <div className="text-center">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-3xl font-mono font-bold text-blue-400 mb-1"
                  >
                    62%
                  </motion.div>
                  <p className="text-sm font-medium text-muted-foreground">Break Points</p>
                </div>
                <div className="text-center">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-3xl font-mono font-bold text-green-400 mb-1"
                  >
                    68%
                  </motion.div>
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
                  <motion.span 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-2xl font-mono font-bold text-green-400"
                  >
                    23
                  </motion.span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Double Faults</span>
                  <motion.span 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-2xl font-mono font-bold text-red-400"
                  >
                    7
                  </motion.span>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <div className="text-center">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="text-lg font-mono font-bold text-primary"
                    >
                      3.3:1
                    </motion.div>
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
                Shot Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ErrorDistribution />
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
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Plus className="h-10 w-10 text-primary mb-3" />
                  </motion.div>
                  <h3 className="text-lg font-heading font-bold text-foreground group-hover:text-primary transition-colors mb-1">
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
                <div className="text-center py-2">
                  <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-50" />
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
                  <div className="text-center">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="text-2xl font-mono font-bold text-foreground"
                    >
                      {stats.totalPlayers}
                    </motion.div>
                    <p className="text-xs text-muted-foreground">Total Players</p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full border-primary/50 hover:bg-primary/10">
                    <Link href="/players">
                      Manage
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
              {matches.length === 0 ? (
                <div className="text-center py-4">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground text-sm mb-3">No matches yet</p>
                  <p className="text-xs text-muted-foreground">Ready to elevate your game? Start by creating players and tracking matches.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {matches.slice(0, 3).map((match, index) => (
                    <motion.div 
                      key={match.$id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          match.status === 'Completed' ? 'bg-green-400' : 'bg-yellow-400'
                        }`} />
                        <span className="text-sm font-medium text-foreground">
                          Match vs Opponent
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(match.matchDate).toLocaleDateString()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  )
} 