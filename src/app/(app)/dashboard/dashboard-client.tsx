"use client"

import { motion } from "framer-motion"
import { EnhancedBentoGrid } from "@/components/features/dashboard/enhanced-bento-grid"
import { MainPlayerSetupPrompt } from "@/components/features/dashboard/main-player-setup-prompt"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, User, Plus } from "lucide-react"
import Link from "next/link"
import { Player } from "@/lib/types"

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

interface DashboardClientProps {
  user: {
    $id: string
    name?: string
    email: string
  }
  mainPlayer: Player | null
  matches: Match[]
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}



export function DashboardClient({ user, mainPlayer, matches }: DashboardClientProps) {
  const firstName = user.name?.split(' ')[0] || mainPlayer?.firstName || 'User'

  // If no main player is set, show setup prompt
  if (!mainPlayer) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-2 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-slate-100">
            Welcome to TennisScore
          </h1>
          <p className="text-lg text-slate-400">
            Your tennis performance tracking starts here
          </p>
        </motion.div>

        <MainPlayerSetupPrompt />
      </motion.div>
    )
  }

  // Calculate comprehensive statistics for main player
  const completedMatches = matches.filter(m => m.status === "Completed")
  const inProgressMatches = matches.filter(m => m.status === "In Progress")
  
  // Calculate win rate for main player
  let winRate = 0
  if (completedMatches.length > 0) {
    const wonMatches = completedMatches.filter(m => m.winnerId === mainPlayer.$id).length
    winRate = Math.round((wonMatches / completedMatches.length) * 100)
  }

  const stats = {
    totalMatches: matches.length,
    completedMatches: completedMatches.length,
    inProgressMatches: inProgressMatches.length,
    totalPlayers: 1, // Main player focused view
    winRate
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="space-y-6 md:space-y-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-2"
      >
        <h1 className="text-2xl md:text-4xl font-bold text-slate-100">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm md:text-lg text-slate-400">
          {mainPlayer && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 text-primary" fill="currentColor" />
              Tracking stats for {mainPlayer.firstName} {mainPlayer.lastName}
            </span>
          )}
        </p>
      </motion.div>

      {/* Mobile-Optimized Enhanced Bento Grid Dashboard */}
      <EnhancedBentoGrid 
        stats={stats}
        matches={matches}
        user={user}
        mainPlayer={mainPlayer}
      />

      {/* Quick Actions Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="text-center py-4 md:py-8"
      >
        <p className="text-xs md:text-sm text-slate-500">
          Ready to elevate your game? Start tracking matches and analyzing your performance.
        </p>
      </motion.div>
    </motion.div>
  )
} 