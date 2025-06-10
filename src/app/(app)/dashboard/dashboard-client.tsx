"use client"

import { motion } from "framer-motion"
import { signOut } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trophy, Users, Calendar, TrendingUp } from "lucide-react"
import Link from "next/link"
import { User, Player, Match, DashboardStats } from "@/lib/types"

interface DashboardClientProps {
  user: User
  players: Player[]
  matches: Match[]
  stats: DashboardStats
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

export function DashboardClient({ user, players, matches, stats }: DashboardClientProps) {
  return (
    <motion.div 
      className="min-h-screen bg-background p-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              {user.name ? `${user.name}'s Dashboard` : "Dashboard"}
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome to TennisScore - Your digital tennis companion
            </p>
          </div>
          
          <form action={signOut}>
            <Button variant="outline" type="submit">
              Sign Out
            </Button>
          </form>
        </div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMatches}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.inProgressMatches} in progress
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.completedMatches > 0 ? `${stats.winRate}%` : "-"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.completedMatches} completed matches
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Players</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPlayers}</div>
                <p className="text-xs text-muted-foreground">
                  Players created
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {stats.winRate > 60 ? "Good" : stats.winRate > 40 ? "Fair" : stats.completedMatches > 0 ? "Poor" : "-"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall rating
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Matches */}
          <motion.div variants={cardVariants} initial="hidden" animate="show">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Matches</CardTitle>
                <Button asChild size="sm">
                  <Link href="/matches">
                    <Plus className="h-4 w-4 mr-2" />
                    New Match
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No matches yet</p>
                    <Button asChild>
                      <Link href="/matches">Start Your First Match</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matches.slice(0, 3).map((match) => (
                      <div key={match.$id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Match vs Player</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(match.matchDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={match.status === "Completed" ? "default" : "secondary"}>
                          {match.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Players */}
          <motion.div variants={cardVariants} initial="hidden" animate="show">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Your Players</CardTitle>
                <Button asChild size="sm" variant="outline">
                  <Link href="/players">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Player
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {players.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No players created</p>
                    <Button asChild>
                      <Link href="/players">Create Your First Player</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {players.slice(0, 3).map((player) => (
                      <div key={player.$id} className="flex items-center p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">
                            {player.firstName} {player.lastName}
                          </p>
                          {player.rating && (
                            <p className="text-sm text-muted-foreground">
                              Rating: {player.rating}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Getting Started - Show only if no data */}
        {stats.totalMatches === 0 && players.length === 0 && (
          <motion.div 
            className="mt-8"
            variants={cardVariants}
            initial="hidden"
            animate="show"
          >
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Welcome to TennisScore! Here&apos;s what you can do:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Create player profiles for yourself and opponents</li>
                    <li>Start scoring live matches with detailed statistics</li>
                    <li>Share live matches with coaches, family, and friends</li>
                    <li>Analyze your performance with beautiful charts and insights</li>
                  </ul>
                  <div className="flex gap-4 mt-4">
                    <Button asChild>
                      <Link href="/players">Create Your First Player</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/matches">Start a Match</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
} 