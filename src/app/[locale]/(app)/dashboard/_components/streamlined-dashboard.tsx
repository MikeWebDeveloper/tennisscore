"use client"

import { motion } from '@/lib/framer-motion-config'
import { Star } from "lucide-react"
import { Match, Player } from "@/lib/types"
import { useTranslations } from "@/i18n"
import { StreamlinedStatsCards } from "./streamlined-stats-cards"
import { PWAInstallationBanner } from "./pwa-installation-banner"
import { WhatsNewPanel } from "./whats-new-panel"
import { RecentMatchesOverview } from "./recent-matches-overview"
import { QuickActionsHub } from "./quick-actions-hub"
import { CreateNewMatchButton } from "./create-new-match-button"

interface StreamlinedDashboardProps {
  user: any
  mainPlayer: Player
  matches: Match[]
  playersMap: Map<string, Player>
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

export function StreamlinedDashboard({ 
  user, 
  mainPlayer, 
  matches, 
  playersMap 
}: StreamlinedDashboardProps) {
  const t = useTranslations('dashboard')

  const firstName = user?.name?.split(' ')[0] || mainPlayer?.firstName || 'User'

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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100">
              {t('welcomeBack')}, {firstName}
            </h1>
          </div>
        </div>
        <p className="text-lg text-gray-700 dark:text-slate-400">
          {t('dashboardSubtitle')}
        </p>
      </motion.div>

      {/* PWA Installation Banner */}
      <PWAInstallationBanner />

      {/* Create New Match Button */}
      <CreateNewMatchButton />

      {/* Core Stats Cards */}
      <StreamlinedStatsCards matches={matches} mainPlayer={mainPlayer} />

      {/* Dashboard Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Matches Overview */}
        <RecentMatchesOverview 
          matches={matches} 
          mainPlayer={mainPlayer} 
          playersMap={playersMap} 
        />

        {/* What's New Panel */}
        <WhatsNewPanel />
      </div>

      {/* Quick Actions Hub */}
      <QuickActionsHub />

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="text-center py-4 md:py-8"
      >
        <p className="text-xs md:text-sm text-gray-600 dark:text-slate-500">
          {t('readyToElevate')}
        </p>
      </motion.div>
    </motion.div>
  )
}