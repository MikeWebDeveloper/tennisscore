"use client"

import { motion } from '@/lib/framer-motion-config'
import { StreamlinedDashboard } from "./_components/streamlined-dashboard"
import { MainPlayerSetupPrompt } from "./_components/main-player-setup-prompt"
import { Match, Player, User } from "@/lib/types"
import { useTranslations } from "@/i18n"
import { ConnectionError } from "@/components/connection-error"
import { CreateNewMatchButton } from "./_components/create-new-match-button"

interface DashboardClientProps {
  user: User | null
  mainPlayer: Player | null
  matches: Match[]
  players: Player[]
  matchesError: boolean
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
  players,
  matchesError,
}: DashboardClientProps) {
  const t = useTranslations('dashboard')
  const common = useTranslations('common')
  
  // Create players map for efficient lookups
  const playersMap = new Map(players.map(player => [player.$id, player]))

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

  if (matchesError) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('welcomeBack')}, {mainPlayer.firstName}</h1>
        <CreateNewMatchButton />
        <ConnectionError title={common('unableToLoadMatches')} description={common('matchesConnectivityIssue')} onRetry={() => window.location.reload()} retryLabel={common('tryAgain')} />
      </div>
    )
  }

  return (
    <StreamlinedDashboard
      user={user}
      mainPlayer={mainPlayer}
      matches={matches}
      playersMap={playersMap}
    />
  )
}
