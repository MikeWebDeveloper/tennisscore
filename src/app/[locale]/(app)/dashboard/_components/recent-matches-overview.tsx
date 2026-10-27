"use client"

import { Link } from "@/i18n/navigation"
import { ArrowRight, Play } from "lucide-react"
import { Match, Player } from "@/lib/types"
import { useLocale, useTranslations } from "@/i18n"
import { formatPlayerFromObject } from "@/lib/utils"
import { matchPerspective } from "@/lib/utils/match-perspective"

interface RecentMatchesOverviewProps {
  matches: Match[]
  mainPlayer: Player
  playersMap: Map<string, Player>
}

export function RecentMatchesOverview({ matches, mainPlayer, playersMap }: RecentMatchesOverviewProps) {
  const t = useTranslations('dashboard')
  const matchT = useTranslations('match')
  const commonT = useTranslations('common')
  const locale = useLocale()

  const recent = [...matches]
    .sort((a, b) => new Date(b.matchDate || b.$createdAt).getTime() - new Date(a.matchDate || a.$createdAt).getTime())
    .slice(0, 4)

  const opponentName = (match: Match) => {
    const opponents = matchPerspective(match, mainPlayer.$id).opponents
    return opponents.map(opponentId => {
      if (opponentId.startsWith('anonymous-')) {
        return opponentId.includes('player-1') ? 'Player 1' : opponentId.includes('player-2') ? 'Player 2' : 'Anonymous'
      }
      const opponent = playersMap.get(opponentId)
      return opponent ? formatPlayerFromObject(opponent) : '—'
    }).join(' / ') || '—'
  }

  const setScores = (match: Match): [number, number][] => {
    try {
      const score = JSON.parse(match.score)
      if (Array.isArray(score.sets)) return score.sets.map((set: number[]) => [set[0], set[1]])
    } catch { /* unscored match */ }
    return []
  }

  const relativeDate = (iso: string) => {
    const days = Math.round((new Date(iso).getTime() - Date.now()) / 86400000)
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(days, 'day')
  }

  return (
    <section className="surface rise rounded-2xl p-2" style={{ "--i": 6 } as React.CSSProperties}>
      <div className="flex items-center justify-between px-3 pb-1 pt-2">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{t('recentMatches')}</h2>
        <Link href="/matches" className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
          {t('viewAll')}
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="px-3 py-8 text-center">
          <p className="mb-4 text-sm text-muted-foreground">{t('noMatchesYet')}</p>
          <Link href="/matches/new" className="press inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
            <Play className="h-4 w-4" aria-hidden="true" />
            {t('startNewMatch')}
          </Link>
        </div>
      ) : (
        <ul>
          {recent.map(match => {
            const live = match.status === 'in-progress'
            const isWin = matchPerspective(match, mainPlayer.$id).isWin
            const finished = match.status === 'completed' && isWin !== null
            const sets = setScores(match)
            return (
              <li key={match.$id}>
                <Link
                  href={live ? `/matches/live/${match.$id}` : `/matches/${match.$id}`}
                  className="press group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-foreground/[0.04]"
                >
                  <span
                    className={
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold " +
                      (live ? "bg-brand/15 text-brand" : finished ? (isWin ? "bg-win/15 text-win" : "bg-loss/15 text-loss") : "bg-foreground/10 text-muted-foreground")
                    }
                  >
                    {live ? <span className="live-dot h-2.5 w-2.5 rounded-full bg-brand" aria-hidden="true" /> : finished ? (isWin ? commonT('won')[0] : commonT('lost')[0]) : '·'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{opponentName(match)}</span>
                    <span className="block text-xs text-muted-foreground">
                      {live ? matchT('inProgress') : relativeDate(match.matchDate || match.$createdAt)}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-2 font-mono text-sm tabular-nums" aria-label={sets.map(s => `${s[0]}-${s[1]}`).join(', ')}>
                    {sets.map((s, i) => (
                      <span key={i} className="flex flex-col items-center leading-tight">
                        <span className={s[0] > s[1] ? "font-semibold text-foreground" : "text-muted-foreground"}>{s[0]}</span>
                        <span className={s[1] > s[0] ? "font-semibold text-foreground" : "text-muted-foreground"}>{s[1]}</span>
                      </span>
                    ))}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
