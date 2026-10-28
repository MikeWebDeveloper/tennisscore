"use client"

import { Link } from "@/i18n/navigation"
import { Play, ArrowRight } from "lucide-react"
import { useTranslations } from "@/i18n"
import type { Match, Player } from "@/lib/types"
import { matchPerspective } from "@/lib/utils/match-perspective"
import { formatPlayerFromObject } from "@/lib/utils"

interface ResumeContext {
  match: Match
  mainPlayerId: string
  playersMap: Map<string, Player>
}

export function CreateNewMatchButton({ resume }: { resume?: ResumeContext }) {
  const t = useTranslations('dashboard')
  const opponentNames = resume
    ? matchPerspective(resume.match, resume.mainPlayerId).opponents.map(id => {
        const player = resume.playersMap.get(id)
        return player ? formatPlayerFromObject(player) : null
      })
    : []
  // If any name is unavailable, avoid presenting a misleading partial doubles team.
  const opponents = opponentNames.length > 0 && opponentNames.every(Boolean) ? opponentNames.join(' / ') : null
  let games: [number, number] | null = null
  if (resume) {
    const isTeamOne = [resume.match.playerOneId, resume.match.playerThreeId].includes(resume.mainPlayerId)
    const isTeamTwo = [resume.match.playerTwoId, resume.match.playerFourId].includes(resume.mainPlayerId)
    try {
      const score = JSON.parse(resume.match.score)
      if (isTeamOne !== isTeamTwo && Array.isArray(score.games) && score.games.length === 2 &&
          score.games.every((value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)) {
        games = isTeamOne ? [score.games[0], score.games[1]] : [score.games[1], score.games[0]]
      }
    } catch { /* Older or unscored matches may have no valid score. */ }
  }

  return (
    <Link
      href={resume ? `/matches/live/${resume.match.$id}` : "/matches/new"}
      className="surface surface-hover press rise group relative flex items-center gap-4 overflow-hidden rounded-2xl p-4"
      style={{ "--i": 1 } as React.CSSProperties}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand/20 blur-2xl" aria-hidden="true" />
      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg shadow-brand/30">
        <Play className="h-5 w-5 fill-current" aria-hidden="true" />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block text-base font-semibold tracking-tight text-foreground">{t(resume ? 'resumeMatch' : 'startNewMatch')}</span>
        <span className="block break-words text-sm leading-snug text-muted-foreground">{opponents ? t('matchVsOpponent', { opponentName: opponents }) : t(resume ? 'continueYourMatch' : 'beginScoringLiveMatch')}</span>
      </span>
      {games && <span className="relative shrink-0 text-right">
        <span className="block text-xs text-muted-foreground">{t('yourGamesLabel')}</span>
        <span className="block font-mono text-lg font-semibold tabular-nums text-foreground" aria-label={t('yourGamesScore', { yours: games[0], opponent: games[1] })}>{games[0]}–{games[1]}</span>
      </span>}
      <ArrowRight className="relative h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  )
}
