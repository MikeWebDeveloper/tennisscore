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
    status: string
    winnerId?: string
    matchDate: string
  }>
  players: Array<{
    $id: string
    firstName: string
    lastName: string
  }>
}

// Ensure we always have safe default values
const getStats = (matches: BentoGridProps['matches'], players: BentoGridProps['players']) => {
  const safeMatches = Array.isArray(matches) ? matches : []
  const safePlayers = Array.isArray(players) ? players : []
  
  const completedMatches = safeMatches.filter(m => m.status === 'Completed')
  const inProgressMatches = safeMatches.filter(m => m.status === 'In Progress')
  
  return {
    totalMatches: safeMatches.length,
    winRate: completedMatches.length > 0 ? 
      Math.round((completedMatches.filter(m => m.winnerId).length / completedMatches.length) * 100) : 0,
    totalPlayers: safePlayers.length,
    completedMatches: completedMatches.length,
    inProgressMatches: inProgressMatches.length,
  }
}

// Generate safe demo data for empty states
const getDemoData = () => ({
  winRateData: Array.from({ length: 7 }, (_, i) => ({
    date: `Day ${i + 1}`,
    winRate: Math.floor(Math.random() * 30) + 50 + (i * 2)
  })),
  errorData: [
    { name: "Unforced Errors", value: 35, color: "#ef4444" },
    { name: "Double Faults", value: 20, color: "#f97316" },
    { name: "Net Errors", value: 45, color: "#eab308" },
  ]
})

export function BentoGrid({ matches, players }: BentoGridProps) {
  // Safely calculate stats with fallbacks
  const stats = getStats(matches, players)
  const { winRateData, errorData } = getDemoData()
  const hasData = stats.totalMatches > 0 || stats.totalPlayers > 0

  // Custom animated chart component
  const WinRateChart = () => (
    <div className="h-[140px] w-full relative">
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-1 h-full px-2">
        {winRateData.map((data, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-center flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <motion.div
              className="bg-gradient-to-t from-primary to-primary/60 rounded-t-sm w-full min-h-[20px]"
              initial={{ height: 0 }}
              animate={{ height: `${(data.winRate / 100) * 80}%` }}
              transition={{ delay: index * 0.1 + 0.2, duration: 0.6, ease: "easeOut" }}
            />
            <span className="text-xs text-muted-foreground mt-1 truncate">
              {data.date.slice(0, 3)}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )

  // Custom error distribution component
  const ErrorDistribution = () => (
    <div className="space-y-3">
      {errorData.map((error, index) => (
        <motion.div
          key={error.name}
          className="space-y-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{error.name}</span>
            <span className="text-foreground">{error.value}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: error.color }}
              initial={{ width: 0 }}
              animate={{ width: `${error.value}%` }}
              transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  )

  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="show"
      className="w-full max-w-7xl mx-auto p-4 md:p-6"
    >
      {/* Mobile Layout */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {/* Quick Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          <Card className="glass-effect">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold font-mono">{stats.totalMatches}</p>
                  <p className="text-xs text-muted-foreground">Total Matches</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold font-mono">{stats.winRate}%</p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Chart */}
        <motion.div variants={itemVariants}>
          <Card className="glass-effect">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Performance Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <WinRateChart />
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          <Link href="/players">
            <Card className="glass-effect h-full interactive-scale">
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">{stats.totalPlayers} Players</p>
                <p className="text-xs text-muted-foreground">Manage</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/matches/new">
            <Card className="glass-effect h-full interactive-scale">
              <CardContent className="p-4 text-center">
                <Plus className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">New Match</p>
                <p className="text-xs text-muted-foreground">Start Scoring</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>

      {/* Desktop Bento Grid Layout */}
      <div className="hidden md:grid grid-cols-4 auto-rows-[180px] gap-4 max-w-7xl mx-auto">
        {/* Large Main Card - Performance Overview (2x2) */}
        <motion.div variants={itemVariants} className="col-span-2 row-span-2">
          <Card className="h-full glass-effect">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 h-[calc(100%-4rem)] flex flex-col">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-3xl font-bold font-mono text-primary">{stats.winRate}%</p>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold font-mono">{stats.totalMatches}</p>
                  <p className="text-sm text-muted-foreground">Total Matches</p>
                </div>
              </div>
              <div className="flex-1">
                <WinRateChart />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Wide KPI Card - Match Stats (2x1) */}
        <motion.div variants={itemVariants} className="col-span-2">
          <Card className="h-full glass-effect">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Match Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-4 h-[calc(180px-5rem)]">
                <div className="text-center">
                  <motion.p 
                    className="text-2xl font-bold font-mono text-primary"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {stats.completedMatches}
                  </motion.p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="text-center">
                  <motion.p 
                    className="text-2xl font-bold font-mono text-amber-500"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {stats.inProgressMatches}
                  </motion.p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
                <div className="text-center">
                  <motion.p 
                    className="text-2xl font-bold font-mono"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {stats.totalPlayers}
                  </motion.p>
                  <p className="text-xs text-muted-foreground">Players</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Square Card - Players (1x1) */}
        <motion.div variants={itemVariants}>
          <Link href="/players">
            <Card className="h-full glass-effect interactive-scale">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                <Users className="h-8 w-8 text-primary mb-3" />
                <p className="text-xl font-bold font-mono">{stats.totalPlayers}</p>
                <p className="text-sm text-muted-foreground">Players</p>
                <Button size="sm" className="mt-2 text-xs">
                  Manage
                </Button>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Square Card - Error Analysis (1x1) */}
        <motion.div variants={itemVariants}>
          <Card className="h-full glass-effect">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Error Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 h-[calc(100%-4rem)]">
              <ErrorDistribution />
            </CardContent>
          </Card>
        </motion.div>

        {/* Square Card - Quick Match (1x1) */}
        <motion.div variants={itemVariants}>
          <Link href="/matches/new">
            <Card className="h-full glass-effect interactive-scale">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                <Plus className="h-8 w-8 text-primary mb-3" />
                <p className="text-lg font-medium">New Match</p>
                <p className="text-sm text-muted-foreground">Start Scoring</p>
                <Button size="sm" className="mt-2 text-xs">
                  Begin
                </Button>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Square Card - Schedule (1x1) */}
        <motion.div variants={itemVariants}>
          <Link href="/matches">
            <Card className="h-full glass-effect interactive-scale">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                <Calendar className="h-8 w-8 text-primary mb-3" />
                <p className="text-lg font-medium">Schedule</p>
                <p className="text-sm text-muted-foreground">View Matches</p>
                <Button size="sm" className="mt-2 text-xs">
                  View All
                </Button>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>

      {/* Empty State Message */}
      {!hasData && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <div className="max-w-md mx-auto">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-heading mb-2">Welcome to TennisScore!</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding players and creating your first match to see statistics here.
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild size="sm">
                <Link href="/players">Add Players</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/matches/new">Start Match</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
} 