"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"
import { MinimalDashboard } from "./_components/minimal-dashboard"
import { MainPlayerSetupPrompt } from "./_components/main-player-setup-prompt"
import PWAInstallBanner from "@/components/shared/pwa-install-banner"
import { Match, Player, User, DashboardStats } from "@/lib/types"
import { useTranslations } from "@/hooks/use-translations"
import { useState, useTransition } from "react"
import { getMatchesByPlayer } from "@/lib/actions/matches-optimized"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface DashboardClientProps {
  user: User | null
  mainPlayer: Player | null
  matches: Match[]
  totalMatches: number
  isLimitedData: boolean
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

export default function DashboardClient({
  user,
  mainPlayer,
  matches: initialMatches,
  totalMatches,
  isLimitedData: initialIsLimitedData,
}: DashboardClientProps) {
  const t = useTranslations()
  const [matches, setMatches] = useState(initialMatches)
  const [isLimitedData, setIsLimitedData] = useState(initialIsLimitedData)
  const [isPending, startTransition] = useTransition()
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  // Filter for singles matches only (no playerThreeId or playerFourId)
  const singlesMatches = matches.filter(m => !m.playerThreeId && !m.playerFourId)
  
  const stats: DashboardStats = {
    totalMatches: singlesMatches.length,
    winRate: 0,
    totalPlayers: 1, // Main player focused view
    completedMatches: singlesMatches.filter(m => m.status === 'completed').length,
    inProgressMatches: singlesMatches.filter(m => m.status === 'in-progress').length,
  }

  // Calculate win rate for main player (singles only)
  let winRate = 0
  if (stats.completedMatches > 0) {
    const wonMatches = singlesMatches.filter(m => m.winnerId === mainPlayer?.$id && m.status === 'completed').length
    winRate = Math.round((wonMatches / stats.completedMatches) * 100)
  }
  stats.winRate = winRate;

  const firstName = user?.name?.split(' ')[0] || mainPlayer?.firstName || 'User'

  const handleLoadMore = async () => {
    if (!mainPlayer) return
    
    setIsLoadingMore(true)
    startTransition(async () => {
      try {
        // Fetch next batch of matches
        const newMatches = await getMatchesByPlayer(mainPlayer.$id, 20, matches.length)
        setMatches([...matches, ...newMatches])
        
        // Update limited data flag
        const newTotal = matches.length + newMatches.length
        setIsLimitedData(newTotal < totalMatches)
      } catch (error) {
        console.error("Error loading more matches:", error)
      } finally {
        setIsLoadingMore(false)
      }
    })
  }

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
            {t('welcomeToTennisScore')}
          </h1>
          <p className="text-lg text-slate-400">
            {t('performanceTrackingStarts')}
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100">
              {t('welcomeBack')}, {firstName}
            </h1>
          </div>
        </div>
        <p className="text-lg text-gray-700 dark:text-slate-400">
          {t('dashboardSubtitle')}
        </p>
      </motion.div>

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Minimal Dashboard */}
      <MinimalDashboard 
        matches={singlesMatches}
        mainPlayer={mainPlayer}
        isLimitedData={isLimitedData}
        totalMatches={totalMatches}
      />

      {/* Load More Button */}
      {isLimitedData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="flex justify-center"
        >
          <Button
            onClick={handleLoadMore}
            disabled={isLoadingMore || isPending}
            size="lg"
            variant="outline"
            className="gap-2"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("loadingMoreMatches")}
              </>
            ) : (
              <>
                {t("loadMoreMatches")}
                <span className="text-sm text-muted-foreground ml-1">
                  ({matches.length} {t("of")} {totalMatches})
                </span>
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Quick Actions Footer */}
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