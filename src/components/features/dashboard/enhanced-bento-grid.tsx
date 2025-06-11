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
  BarChart3,
  Activity,
  Clock
} from "lucide-react"
import Link from "next/link"
import { PerformanceCharts } from "./performance-charts"
import { Suspense } from "react"

interface PointLogEntry {
  pointNumber: number
  winner: string
  shotType?: string
  timestamp: string
}

interface Match {
  $id: string
  playerOneId: string
  playerTwoId: string
  matchDate: string
  status: string
  winnerId?: string
  pointLog?: PointLogEntry[]
}

interface Player {
  $id: string
  firstName: string
  lastName: string
  rating?: string
}

interface User {
  $id: string
  name?: string
  email: string
}

interface EnhancedBentoGridProps {
  stats: {
    totalMatches: number
    winRate: number
    totalPlayers: number
    completedMatches: number
    inProgressMatches: number
  }
  matches: Match[]
  players: Player[]
  user: User
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  }
}

// Skeleton loader for charts
function ChartSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-slate-700/50 rounded w-1/4"></div>
      <div className="h-48 bg-slate-700/30 rounded"></div>
    </div>
  )
}

export function EnhancedBentoGrid({ stats, matches, players, user }: EnhancedBentoGridProps) {
  const recentMatches = matches.slice(0, 3)
  const hasData = stats.completedMatches > 0
  
  // Enhanced player display with better error handling
  const getPlayerDisplay = (match: Match) => {
    const player1 = players.find(p => p.$id === match.playerOneId)
    const player2 = players.find(p => p.$id === match.playerTwoId)
    
    if (!player1 || !player2) {
      return "Match Data Loading..."
    }
    
    return `${player1.firstName} vs ${player2.firstName}`
  }

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Top Row - Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Win Rate Hero Card */}
        <motion.div 
          variants={itemVariants}
          className="md:col-span-4"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className="h-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border-primary/30 hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
            <CardContent className="relative p-8 flex flex-col justify-center items-center text-center h-full min-h-[200px]">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <Trophy className="h-16 w-16 text-primary mb-6" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <p className="text-5xl font-bold text-primary font-mono">
                  {hasData ? `${stats.winRate}%` : "-"}
                </p>
                <p className="text-xl font-semibold text-slate-200">Win Rate</p>
                <p className="text-sm text-slate-400">
                  {stats.completedMatches} completed matches
                </p>
                {stats.winRate >= 70 && hasData && (
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    🔥 Hot Streak
                  </Badge>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats Grid */}
        <div className="md:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div variants={itemVariants}>
            <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  {stats.inProgressMatches > 0 && (
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                      <Clock className="h-3 w-3 mr-1" />
                      Live
                    </Badge>
                  )}
                </div>
                <p className="text-3xl font-bold text-slate-200 font-mono mb-1">
                  {stats.totalMatches}
                </p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Total Matches
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Users className="h-5 w-5 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-slate-200 font-mono mb-1">
                  {stats.totalPlayers}
                </p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Players
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Activity className="h-5 w-5 text-purple-400" />
                </div>
                <p className="text-3xl font-bold text-slate-200 font-mono mb-1">
                  {stats.completedMatches}
                </p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Completed
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="h-full bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-primary/30 transition-all duration-300 group cursor-pointer">
              <CardContent className="p-6 h-full flex flex-col justify-center">
                <Link href="/matches/new" className="h-full flex flex-col justify-center">
                  <Plus className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-slate-200 group-hover:text-primary transition-colors">
                    New Match
                  </p>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Performance Charts Section */}
      {hasData && (
        <motion.div
          variants={itemVariants}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-slate-200">Performance Analytics</h2>
          </div>
          <Suspense fallback={<ChartSkeleton />}>
            <PerformanceCharts 
              matches={matches}
              players={players}
              userId={user.$id}
            />
          </Suspense>
        </motion.div>
      )}

      {/* Content Grid - Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Matches */}
        <motion.div variants={itemVariants}>
          <Card className="h-full bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Recent Matches
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/matches" className="text-slate-400 hover:text-slate-200">
                    View All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentMatches.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 mb-4">No matches yet</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/matches/new">
                      <Play className="h-4 w-4 mr-2" />
                      Start Your First Match
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentMatches.map((match, index) => (
                    <motion.div
                      key={match.$id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="group"
                    >
                      <Link href={`/matches/${match.$id}`}>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/70 transition-all cursor-pointer">
                          <div className="flex-1">
                            <p className="font-medium text-slate-200 group-hover:text-primary transition-colors">
                              {getPlayerDisplay(match)}
                            </p>
                            <p className="text-sm text-slate-400">
                              {new Date(match.matchDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={match.status === "Completed" ? "default" : "secondary"}
                              className={match.status === "Completed" 
                                ? "bg-primary/10 text-primary border-primary/20" 
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              }
                            >
                              {match.status}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Players Section */}
        <motion.div variants={itemVariants}>
          <Card className="h-full bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Your Players
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/players" className="text-slate-400 hover:text-slate-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Player
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {players.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 mb-4">No players created</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/players">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Player
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {players.slice(0, 6).map((player, index) => (
                    <motion.div
                      key={player.$id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="group"
                    >
                      <Link href="/players">
                        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/70 transition-all cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {player.firstName?.[0]}{player.lastName?.[0]}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-200 truncate group-hover:text-primary transition-colors">
                                {player.firstName} {player.lastName}
                              </p>
                              {player.rating && (
                                <p className="text-sm text-slate-400">Rating: {player.rating}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                  {players.length > 6 && (
                    <div className="text-center pt-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href="/players" className="text-slate-400 hover:text-slate-200">
                          +{players.length - 6} more players
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions Footer */}
      <motion.div
        variants={itemVariants}
        className="text-center py-8 border-t border-slate-800"
      >
        <p className="text-sm text-slate-500 mb-4">
          Ready to elevate your game? Track every point, analyze every match.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/matches/new">
              <Play className="h-4 w-4 mr-2" />
              Start New Match
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/players">
              <Users className="h-4 w-4 mr-2" />
              Manage Players
            </Link>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
} 