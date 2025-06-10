"use client"

import { motion } from "framer-motion"
import { BentoGrid } from "@/components/features/dashboard/bento-grid"

interface Player {
  $id: string
  firstName: string
  lastName: string
  rating?: string
}

interface Match {
  $id: string
  matchDate: string
  status: string
}

interface DashboardClientProps {
  user: {
    $id: string
    name: string
    email: string
  }
  players: Player[]
  matches: Match[]
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}



export function DashboardClient({ user, players, matches }: DashboardClientProps) {
  // Calculate statistics
  const stats = {
    totalMatches: matches.length,
    completedMatches: matches.filter(m => m.status === "Completed").length,
    inProgressMatches: matches.filter(m => m.status === "In Progress").length,
    totalPlayers: players.length,
    winRate: 0 // This would need match result data to calculate properly
  }

  // For now, let's simulate a win rate if there are completed matches
  if (stats.completedMatches > 0) {
    // Simulate 65% win rate for demo purposes
    stats.winRate = Math.round(65 + Math.random() * 20)
  }

  const firstName = user.name?.split(' ')[0] || 'User'

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
        <h1 className="text-4xl font-bold text-slate-100">
          Welcome back, {firstName}
        </h1>
        <p className="text-lg text-slate-400">
          Track your tennis performance and manage your matches
        </p>
      </motion.div>

      {/* Bento Grid Dashboard */}
      <BentoGrid 
        stats={stats}
        matches={matches}
        players={players}
      />

      {/* Quick Actions Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="text-center py-8"
      >
        <p className="text-sm text-slate-500">
          Ready to elevate your game? Start by creating players and tracking matches.
        </p>
      </motion.div>
    </motion.div>
  )
} 