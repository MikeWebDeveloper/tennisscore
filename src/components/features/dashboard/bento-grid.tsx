"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Plus, Calendar, TrendingUp } from "lucide-react"

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

// Simplified chart component that always renders
function WinRateChart({ winRate }: { winRate: number }) {
  const segments = [
    { label: "Jan", value: 65 },
    { label: "Feb", value: 72 },
    { label: "Mar", value: 68 },
    { label: "Apr", value: 75 },
    { label: "May", value: winRate || 70 },
  ];

  return (
    <div className="flex items-end justify-between h-24 w-full px-2">
      {segments.map((segment, index) => (
        <div key={segment.label} className="flex flex-col items-center gap-2 h-full justify-end">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${Math.max((segment.value / 100) * 80, 8)}%` }}
            transition={{ duration: 0.8, delay: index * 0.1, type: "spring" }}
            className="w-6 bg-gradient-to-t from-primary/60 to-primary rounded-t-sm min-h-[8px]"
          />
          <span className="text-xs text-muted-foreground">{segment.label}</span>
        </div>
      ))}
    </div>
  );
}

// Welcome screen component
function WelcomeScreen() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="text-center p-8 bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-slate-700/50">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-primary/20 border border-primary/30">
              <Trophy className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-heading">Welcome to TennisScore!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-lg">
            Ready to elevate your game? Start by creating players and tracking matches.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-black font-semibold">
              <Link href="/players">
                <Plus className="mr-2 h-4 w-4" /> 
                Add Players
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/matches/new">
                <Calendar className="mr-2 h-4 w-4" />
                Start Match
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function BentoGrid({ stats, matches, players }: BentoGridProps) {
  // More lenient condition for showing data
  const hasData = (matches && matches.length > 0) || (players && players.length > 0) || stats.totalMatches > 0;

  console.log('BentoGrid Debug:', { hasData, matches: matches?.length, players: players?.length, stats });

  if (!hasData) {
    return <WelcomeScreen />;
  }

  return (
    <motion.div 
      variants={listVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-6 max-w-7xl mx-auto"
    >
      {/* Stats Overview Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Matches */}
        <motion.div variants={itemVariants}>
          <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-slate-200 font-mono">
                  {stats.totalMatches || 0}
                </p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Total Matches
                </p>
                <p className="text-xs text-slate-400">
                  {stats.inProgressMatches || 0} in progress
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Win Rate */}
        <motion.div variants={itemVariants}>
          <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-slate-200 font-mono">
                  {stats.completedMatches > 0 ? `${stats.winRate}%` : "-"}
                </p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Win Rate
                </p>
                <p className="text-xs text-slate-400">
                  {stats.completedMatches || 0} completed
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Players */}
        <motion.div variants={itemVariants}>
          <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-green-400" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-slate-200 font-mono">
                  {stats.totalPlayers || 0}
                </p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Players
                </p>
                <p className="text-xs text-slate-400">
                  Total registered
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance */}
        <motion.div variants={itemVariants}>
          <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-slate-200 font-mono">
                  {stats.completedMatches === 0 ? "-" : 
                   stats.winRate >= 70 ? "Great" :
                   stats.winRate >= 60 ? "Good" :
                   stats.winRate >= 40 ? "Fair" : "Improving"}
                </p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Performance
                </p>
                <p className="text-xs text-slate-400">
                  Overall rating
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart - Takes up 2 columns on large screens */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-2"
        >
          <Card className="h-full bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-slate-700/50 shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-heading">Performance Trend</CardTitle>
                  <p className="text-sm text-muted-foreground">Your win rate over time</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center mb-4">
                <div className="text-4xl font-mono font-bold text-primary mb-1">
                  {stats.completedMatches > 0 ? `${stats.winRate}%` : "-"}
                </div>
                <p className="text-sm text-muted-foreground">Current Win Rate</p>
              </div>
              <WinRateChart winRate={stats.winRate} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column - Actions and Recent Matches */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30 hover:from-primary/25 hover:to-primary/15 transition-all">
              <Link href="/matches/new" className="block">
                <CardContent className="p-6 text-center">
                  <Plus className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="text-lg font-heading font-bold text-foreground mb-1">
                    Start New Match
                  </h3>
                  <p className="text-sm text-muted-foreground">Begin scoring now</p>
                </CardContent>
              </Link>
            </Card>
          </motion.div>

          {/* Recent Matches */}
          <motion.div variants={itemVariants}>
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Matches</CardTitle>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/matches" className="text-xs">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {matches && matches.length > 0 ? (
                  <div className="space-y-3">
                    {matches.slice(0, 3).map((match) => (
                      <div key={match.$id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            match.status === 'Completed' ? 'bg-green-400' : 
                            match.status === 'In Progress' ? 'bg-yellow-400' : 'bg-slate-400'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">
                              {new Date(match.matchDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium ${
                          match.status === 'Completed' ? 'text-green-400' : 
                          match.status === 'In Progress' ? 'text-yellow-400' : 'text-slate-400'
                        }`}>
                          {match.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No matches yet</p>
                    <Button asChild variant="outline" size="sm" className="mt-2">
                      <Link href="/matches/new">Start First Match</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
} 