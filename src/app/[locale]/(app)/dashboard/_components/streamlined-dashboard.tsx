"use client"

import { Match, Player, User } from "@/lib/types"
import { useTranslations } from "@/i18n"
import { StreamlinedStatsCards } from "./streamlined-stats-cards"
import { PWAInstallationBanner } from "./pwa-installation-banner"
import { WhatsNewPanel } from "./whats-new-panel"
import { RecentMatchesOverview } from "./recent-matches-overview"
import { CreateNewMatchButton } from "./create-new-match-button"

interface StreamlinedDashboardProps {
  user: User | null
  mainPlayer: Player
  matches: Match[]
  playersMap: Map<string, Player>
}

export function StreamlinedDashboard({ user, mainPlayer, matches, playersMap }: StreamlinedDashboardProps) {
  const t = useTranslations('dashboard')
  const firstName = user?.name?.split(' ')[0] || mainPlayer?.firstName || 'User'

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 md:space-y-5">
      <header className="rise px-1 pt-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {t('welcomeBack')}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">{t('dashboardSubtitle')}</p>
      </header>

      <PWAInstallationBanner />
      <CreateNewMatchButton />
      <StreamlinedStatsCards matches={matches} mainPlayer={mainPlayer} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentMatchesOverview matches={matches} mainPlayer={mainPlayer} playersMap={playersMap} />
        <WhatsNewPanel />
      </div>
    </div>
  )
}
