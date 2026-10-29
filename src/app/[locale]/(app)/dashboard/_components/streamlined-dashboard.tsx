"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Match, Player, User } from "@/lib/types"
import { useTranslations } from "@/i18n"
import { StreamlinedStatsCards } from "./streamlined-stats-cards"
import { PWAInstallationBanner } from "./pwa-installation-banner"
import { WhatsNewPanel } from "./whats-new-panel"
import { RecentMatchesOverview } from "./recent-matches-overview"
import { CreateNewMatchButton } from "./create-new-match-button"
import { findResumeMatch } from "@/lib/utils/resume-match"
import { getDashboardHighlights } from "@/lib/utils/dashboard-highlights"
import { Link } from "@/i18n/navigation"
import { Plus, UserPlus, Users } from "lucide-react"

const actionTile = "surface surface-hover press flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-center text-xs font-medium leading-tight text-muted-foreground hover:text-foreground"

const CreatePlayerDialog = dynamic(() => import("../../players/_components/create-player-dialog").then(mod => mod.CreatePlayerDialog))

interface StreamlinedDashboardProps {
  user: User | null
  mainPlayer: Player
  matches: Match[]
  playersMap: Map<string, Player>
}

export function StreamlinedDashboard({ user, mainPlayer, matches, playersMap }: StreamlinedDashboardProps) {
  const t = useTranslations('dashboard')
  const [createPlayerOpen, setCreatePlayerOpen] = useState(false)
  const firstName = user?.name?.split(' ')[0] || mainPlayer?.firstName || 'User'
  const resume = findResumeMatch(matches)
  const highlights = getDashboardHighlights(matches, mainPlayer.$id)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 md:space-y-5">
      <header className="rise px-1 pt-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {t('welcomeBack')}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">{t('dashboardSubtitle')}</p>
      </header>

      <CreateNewMatchButton resume={resume ? { match: resume, mainPlayerId: mainPlayer.$id, playersMap } : undefined} />
      {/* Equal boxed tiles: a wrapping row of loose links looked ragged on phones */}
      <div className={`grid gap-2 ${resume ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {resume && <Link href="/matches/new" className={actionTile}><Plus className="h-5 w-5" aria-hidden="true" />{t('startNewMatch')}</Link>}
        <button type="button" onClick={() => setCreatePlayerOpen(true)} className={actionTile}><UserPlus className="h-5 w-5" aria-hidden="true" />{t('addPlayer')}</button>
        <Link href="/players" className={actionTile}><Users className="h-5 w-5" aria-hidden="true" />{t('yourPlayers')}</Link>
      </div>
      <StreamlinedStatsCards matches={matches} mainPlayer={mainPlayer} />

      <details className="surface rounded-2xl px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">{t('performanceInsights')}</summary>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-xs text-muted-foreground">{t('thisMonthHeader')}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{highlights.thisMonth}</p></div>
          <div><p className="text-xs text-muted-foreground">{t('winStreak')}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{highlights.winStreak}</p></div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t('singlesMatches')}</p>
        <Link href="/statistics" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-foreground underline underline-offset-4">{t('viewDetailedStatistics')}</Link>
      </details>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentMatchesOverview matches={matches} mainPlayer={mainPlayer} playersMap={playersMap} />
        <WhatsNewPanel />
      </div>
      <PWAInstallationBanner />
      {createPlayerOpen && <CreatePlayerDialog isOpen={createPlayerOpen} onOpenChange={setCreatePlayerOpen} />}
    </div>
  )
}
