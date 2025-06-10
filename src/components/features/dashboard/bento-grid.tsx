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
      duration: 0.4
    }
  }
}

export function BentoGrid({ stats, matches, players }: BentoGridProps) {
  const recentMatches = matches.slice(0, 3)
  
  return (
    <div className="w-full space-y-6">
      {/* Mobile Layout - Stack vertically */}
      <div className="block lg:hidden">
        <motion.div
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Win Rate Card */}
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30">
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
                <div className="text-4xl font-bold text-primary mb-2 font-mono">
                  {stats.completedMatches > 0 ? `${stats.winRate}%` : "-"}
                </div>
                <p className="text-lg font-semibold text-foreground mb-1">Win Rate</p>
                <p className="text-sm text-muted-foreground">
                  {stats.completedMatches} completed matches
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div variants={itemVariants}>
              <Card className="bg-muted/20 border-muted">
                <CardContent className="p-4">
                  <div className="flex items-center mb-3">
                    <Calendar className="h-5 w-5 text-blue-400 mr-2" />
                    {stats.inProgressMatches > 0 && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                        Live
                      </Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1 font-mono">
                    {stats.totalMatches}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Total Matches
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-muted/20 border-muted">
                <CardContent className="p-4">
                  <div className="flex items-center mb-3">
                    <Users className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1 font-mono">
                    {stats.totalPlayers}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Players
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* New Match CTA */}
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-card to-muted border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Start New Match</h3>
                    <p className="text-sm text-muted-foreground">Begin scoring a live tennis match</p>
                  </div>
                  <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                    <Link href="/matches/new">
                      <Plus className="h-4 w-4 mr-2" />
                      New
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Desktop Bento Grid */}
      <div className="hidden lg:block">
        <motion.div
          className="grid grid-cols-4 grid-rows-4 gap-6 h-[600px]"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Win Rate Card - Large (2x2) */}
          <motion.div 
            variants={itemVariants}
            className="col-span-2 row-span-2"
          >
            <Card className="h-full bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30 overflow-hidden">
              <CardContent className="h-full p-8 flex flex-col justify-center items-center text-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                <div className="relative z-10">
                  <Trophy className="h-16 w-16 text-primary mb-6" />
                  <div className="space-y-2">
                    <div className="text-6xl font-bold text-primary font-mono tracking-tight">
                      {stats.completedMatches > 0 ? `${stats.winRate}%` : "-"}
                    </div>
                    <p className="text-xl font-semibold text-foreground">Win Rate</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.completedMatches} completed matches
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Matches */}
          <motion.div variants={itemVariants} className="col-span-1 row-span-1">
            <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="h-full p-6 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-3">
                  <Calendar className="h-6 w-6 text-blue-400" />
                  {stats.inProgressMatches > 0 && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 pulse-primary">
                      Live
                    </Badge>
                  )}
                </div>
                <div className="text-3xl font-bold text-foreground mb-1 font-mono">
                  {stats.totalMatches}
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Total Matches
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.inProgressMatches} in progress
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Players */}
          <motion.div variants={itemVariants} className="col-span-1 row-span-1">
            <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="h-full p-6 flex flex-col justify-center">
                <div className="flex items-center mb-3">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1 font-mono">
                  {stats.totalPlayers}
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Players
                </p>
                <p className="text-xs text-muted-foreground">
                  Profiles created
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* New Match CTA */}
          <motion.div 
            variants={itemVariants}
            className="col-span-2 row-span-1"
          >
            <Card className="h-full bg-gradient-to-r from-card to-card/80 border-border hover:border-primary/50 transition-all duration-300 group">
              <CardContent className="h-full p-6 flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">Start New Match</h3>
                  <p className="text-sm text-muted-foreground">Begin scoring a live tennis match</p>
                </div>
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-primary/25 transition-all">
                  <Link href="/matches/new">
                    <Plus className="h-5 w-5 mr-2" />
                    New Match
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Matches */}
          <motion.div 
            variants={itemVariants}
            className="col-span-2 row-span-2"
          >
            <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-foreground">Recent Matches</CardTitle>
                  <Button asChild variant="ghost" size="sm" className="hover:text-primary">
                    <Link href="/matches" className="text-muted-foreground hover:text-foreground">
                      View All
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-full pt-0">
                {recentMatches.length === 0 ? (
                  <div className="text-center py-8 flex flex-col items-center justify-center h-full">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-4">No matches yet</p>
                    <Button asChild variant="outline" size="sm" className="border-primary/50 hover:bg-primary/10">
                      <Link href="/matches/new">
                        <Play className="h-4 w-4 mr-2" />
                        Start Your First Match
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[280px] pr-2">
                    {recentMatches.map((match) => (
                      <motion.div
                        key={match.$id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-colors"
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

          {/* Players */}
          <motion.div 
            variants={itemVariants}
            className="col-span-2 row-span-1"
          >
            <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-foreground">Players</CardTitle>
                  <Button asChild variant="ghost" size="sm" className="hover:text-primary">
                    <Link href="/players" className="text-muted-foreground hover:text-foreground">
                      Manage
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {players.length === 0 ? (
                  <div className="text-center py-4">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-muted-foreground text-sm mb-3">No players created</p>
                    <Button asChild variant="outline" size="sm" className="border-primary/50 hover:bg-primary/10">
                      <Link href="/players">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Players
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4 overflow-x-auto pb-2">
                    {players.slice(0, 3).map((player, index) => (
                      <motion.div
                        key={player.$id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex-shrink-0 flex items-center space-x-3 p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-colors min-w-[180px]"
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">
                            {player.firstName[0]}{player.lastName[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {player.firstName} {player.lastName}
                          </p>
                          {player.rating && (
                            <p className="text-xs text-muted-foreground">Rating: {player.rating}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {players.length > 3 && (
                      <div className="flex-shrink-0 text-center p-3">
                        <Button asChild variant="ghost" size="sm" className="hover:text-primary">
                          <Link href="/players" className="text-muted-foreground hover:text-foreground">
                            +{players.length - 3} more
                          </Link>
                        </Button>
                      </div>
                    )}
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