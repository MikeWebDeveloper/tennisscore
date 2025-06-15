"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Calendar,
  Clock,
  Target,
  Activity,
  Zap,
  Award,
  BarChart3,
  Timer,
  Flame,
  Plus,
  UserPlus,
  LucideIcon
} from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { PerformanceCharts } from "./performance-charts"
import { Match, Player } from "@/lib/types"

interface EnhancedBentoGridProps {
  matches: Match[]
  mainPlayer: Player | null
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  show: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
}

const buttonVariants = {
  hover: { 
    scale: 1.02,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  },
  tap: { 
    scale: 0.98,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  }
}

// Skeleton components for loading states
function ChartsSkeleton() {
  return (
    <div className="h-[300px] w-full animate-pulse rounded-lg bg-muted/50" />
  )
}

export function EnhancedBentoGrid({ matches, mainPlayer }: EnhancedBentoGridProps) {
  // Calculate stats
  const totalMatches = matches.length
  const completedMatches = matches.filter(match => match.status === "Completed")
  const wonMatches = completedMatches.filter(match => 
    match.winnerId === mainPlayer?.$id
  ).length
  const winRate = totalMatches > 0 ? Math.round((wonMatches / totalMatches) * 100) : 0

  // Calculate additional stats (placeholder for now)
  const avgMatchDuration = "1h 45m" // Will be calculated from actual data later
  const longestWinStreak = 3 // Will be calculated from actual data later
  const totalSetsWon = wonMatches * 2 // Simplified calculation
  const aces = wonMatches * 8 // Placeholder
  const doubleFaults = wonMatches * 3 // Placeholder
  const winners = wonMatches * 15 // Placeholder
  const unforced = wonMatches * 8 // Placeholder

  // Recent matches for quick access
  const recentMatches = matches
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
    .slice(0, 3)

  // Stat card component with animations
  const StatCard = ({ icon: Icon, label, value, className = "" }: {
    icon: LucideIcon
    label: string
    value: string | number
    className?: string
  }) => {
    return (
      <motion.div variants={itemVariants} className={className}>
        <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className="text-xl font-bold text-foreground group-hover:scale-105 transition-transform duration-200">{value}</p>
              </div>
              <div className="p-2 rounded-full bg-muted group-hover:bg-muted/80 transition-colors duration-200">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-4 space-y-6"
    >
      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap" className="flex-1">
          <Button asChild className="w-full h-11 font-medium shadow-sm">
            <Link href="/matches/new">
              <Plus className="h-4 w-4 mr-2" />
              New Match
            </Link>
          </Button>
        </motion.div>
        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap" className="flex-1">
          <Button variant="outline" asChild className="w-full h-11">
            <Link href="/players/new">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Player
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3"
      >
        <StatCard icon={Trophy} label="Matches Won" value={wonMatches} />
        <StatCard icon={TrendingUp} label="Win Rate" value={`${winRate}%`} />
        <StatCard icon={Users} label="Total Matches" value={totalMatches} />
        <StatCard icon={Clock} label="Avg Duration" value={avgMatchDuration} />
        <StatCard icon={Flame} label="Win Streak" value={longestWinStreak} />
        <StatCard icon={Award} label="Sets Won" value={totalSetsWon} />
        <StatCard icon={Target} label="Aces" value={aces} />
        <StatCard icon={Zap} label="Winners" value={winners} />
        <StatCard icon={Activity} label="Double Faults" value={doubleFaults} />
        <StatCard icon={BarChart3} label="Unforced Errors" value={unforced} />
        <StatCard icon={Timer} label="Active Matches" value={matches.filter(m => m.status === "In Progress").length} />
        <StatCard icon={Calendar} label="This Month" value={matches.filter(m => new Date(m.matchDate).getMonth() === new Date().getMonth()).length} />
      </motion.div>

      {/* Performance Charts */}
      <motion.div variants={itemVariants}>
        <Card className="hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Performance Overview</h3>
              <Badge variant="outline" className="text-xs">
                Last 30 days
              </Badge>
            </div>
            <Suspense fallback={<ChartsSkeleton />}>
              <PerformanceCharts matches={matches} mainPlayer={mainPlayer} />
            </Suspense>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Matches */}
      {recentMatches.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Recent Matches</h3>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/matches">View All</Link>
                </Button>
              </div>
              <div className="space-y-3">
                {recentMatches.map((match, index) => (
                  <motion.div
                    key={match.$id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        match.status === "Completed" 
                          ? match.winnerId === mainPlayer?.$id 
                            ? "bg-green-500" 
                            : "bg-red-500"
                          : "bg-yellow-500"
                      }`} />
                      <div>
                        <p className="text-sm font-medium">
                          vs {match.playerTwoId === mainPlayer?.$id ? "Player 1" : "Player 2"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(match.matchDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={match.status === "Completed" ? "secondary" : "default"} className="text-xs">
                      {match.status}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
} 