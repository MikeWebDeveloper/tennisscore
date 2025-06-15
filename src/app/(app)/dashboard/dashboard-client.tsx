"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"
import { EnhancedBentoGrid } from "@/components/features/dashboard/enhanced-bento-grid"
import { MainPlayerSetupPrompt } from "@/components/features/dashboard/main-player-setup-prompt"
import { Match, Player, User, DashboardStats } from "@/lib/types"

interface DashboardClientProps {
  user: User | null
  mainPlayer: Player | null
  matches: Match[]
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

export default function DashboardClient({
  user,
  mainPlayer,
  matches,
}: DashboardClientProps) {
  const stats: DashboardStats = {
    totalMatches: matches.length,
    winRate: 0,
    totalPlayers: 1, // Main player focused view
    completedMatches: matches.filter(m => m.status === 'Completed').length,
    inProgressMatches: matches.filter(m => m.status === 'In Progress').length,
  }

  // Calculate win rate for main player
  let winRate = 0
  if (stats.completedMatches > 0) {
    const wonMatches = matches.filter(m => m.winnerId === mainPlayer?.$id).length
    winRate = Math.round((wonMatches / stats.completedMatches) * 100)
  }
  stats.winRate = winRate;

  const firstName = user?.name?.split(' ')[0] || mainPlayer?.firstName || 'User'

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
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Star className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100">
              Welcome back, {firstName}
            </h1>
          </div>
        </div>
        <p className="text-lg text-slate-400">
          Track your tennis performance and improve your game
        </p>
      </motion.div>

      {/* Enhanced Bento Grid */}
      <EnhancedBentoGrid 
        matches={matches}
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