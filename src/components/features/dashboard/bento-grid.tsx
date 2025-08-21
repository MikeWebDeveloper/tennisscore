"use client"

import { motion } from "@/lib/framer-motion-config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Trophy, 
  Users, 
  Calendar, 
  Play
} from "lucide-react"
import Link from "next/link"

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
      staggerChildren: 0.15,
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
      type: "spring" as const,
      stiffness: 200,
      damping: 20
    }
  }
}

export function BentoGrid({ stats, matches, players }: BentoGridProps) {
  const recentMatches = matches.slice(0, 3)
  
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 auto-rows-fr"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Main Win Rate Card - Large */}
      <motion.div 
        variants={itemVariants}
        className="md:col-span-2 lg:col-span-2 md:row-span-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card className="h-full bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:border-primary/30 transition-all duration-300">
          <CardContent className="p-8 flex flex-col justify-center items-center text-center h-full">
            <Trophy className="h-16 w-16 text-primary mb-6" />
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              className="space-y-2"
            >
              <p className="text-6xl font-bold text-primary font-mono">
                {stats.completedMatches > 0 ? `${stats.winRate}%` : "-"}
              </p>
              <p className="text-lg font-semibold text-slate-200">Win Rate</p>
              <p className="text-sm text-slate-400">
                {stats.completedMatches} completed matches
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats - Small Cards */}
      <motion.div variants={itemVariants} className="md:col-span-1">
        <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Calendar className="h-5 w-5 text-blue-400" />
              {stats.inProgressMatches > 0 && (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                  Live
                </Badge>
              )}
            </div>
            <p className="text-3xl font-bold text-slate-200 font-mono mb-1">
              {stats.totalMatches}
            </p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              Total Matches
            </p>
            <p className="text-xs text-slate-400">
              {stats.inProgressMatches} in progress
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="md:col-span-1">
        <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Users className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-slate-200 font-mono mb-1">
              {stats.totalPlayers}
            </p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              Players
            </p>
            <p className="text-xs text-slate-400">
              Profiles created
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* New Match CTA - Medium */}
      <motion.div 
        variants={itemVariants}
        className="md:col-span-2 lg:col-span-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card className="h-full bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-primary/30 transition-all duration-300 group">
          <CardContent className="p-6 flex items-center justify-between h-full">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-200 group-hover:text-primary transition-colors">
                Start New Match
              </h3>
              <p className="text-sm text-slate-400">
                Begin scoring a live tennis match
              </p>
            </div>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-black font-semibold">
              <Link href="/matches/new">
                <Plus className="h-5 w-5 mr-2" />
                New Match
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Matches - Wide */}
      <motion.div 
        variants={itemVariants}
        className="md:col-span-4 lg:col-span-3"
      >
        <Card className="h-full bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-200">Recent Matches</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/matches" className="text-slate-400 hover:text-slate-200">
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentMatches.length === 0 ? (
              <div className="text-center py-8">
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
              <div className="space-y-3">
                {recentMatches.map((match, index) => (
                  <motion.div
                    key={match.$id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-200">Match vs Opponent</p>
                      <p className="text-sm text-slate-400">
                        {new Date(match.matchDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={match.status === "Completed" ? "default" : "secondary"}
                      className={match.status === "Completed" 
                        ? "bg-primary/10 text-primary border-primary/20" 
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
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

      {/* Players Section - Wide */}
      <motion.div 
        variants={itemVariants}
        className="md:col-span-4 lg:col-span-3"
      >
        <Card className="h-full bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-200">Your Players</CardTitle>
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
              <div className="text-center py-8">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {players.slice(0, 4).map((player, index) => (
                  <motion.div
                    key={player.$id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {player.firstName?.[0]}{player.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-200 truncate">
                          {player.firstName} {player.lastName}
                        </p>
                        {player.rating && (
                          <p className="text-sm text-slate-400">Rating: {player.rating}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
} 