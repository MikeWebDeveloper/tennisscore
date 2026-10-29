"use client"

import { Link } from "@/i18n/navigation"
import { Match, Player } from "@/lib/types"
import { useLocale, useTranslations } from "@/i18n"
import { cn } from "@/lib/utils"
import { formatMatchDuration } from "@/lib/utils/statistics-summary"

interface StreamlinedStatsCardsProps {
  matches: Match[]
  mainPlayer: Player
}

export function StreamlinedStatsCards({ matches, mainPlayer }: StreamlinedStatsCardsProps) {
  const t = useTranslations('dashboard')
  const locale = useLocale()

  const singles = matches.filter(m => !m.isDoubles)
  const completed = singles
    .filter(m => m.status === 'completed')
    .sort((a, b) => new Date(a.matchDate || a.$createdAt).getTime() - new Date(b.matchDate || b.$createdAt).getTime())
  const won = completed.filter(m => m.winnerId === mainPlayer.$id)
  const winRate = completed.length > 0 ? Math.round((won.length / completed.length) * 100) : 0

  const lastFive = completed.slice(-5)
  const lastFiveWins = lastFive.filter(m => m.winnerId === mainPlayer.$id).length
  const form = lastFive.length > 0 ? Math.round((lastFiveWins / lastFive.length) * 100) : 0

  const timed = completed.filter(m => m.startTime && m.endTime)
  // Unrounded, so a 22-second average reads "22 s" rather than vanishing as 0 minutes
  const avgDuration = timed.length > 0
    ? timed.reduce((sum, m) => sum + (new Date(m.endTime!).getTime() - new Date(m.startTime!).getTime()) / 60000, 0) / timed.length
    : 0
  const inProgress = singles.filter(m => m.status === 'in-progress').length

  const tile = "surface surface-hover press rise flex min-h-[8.5rem] flex-col justify-between rounded-2xl p-4"
  const label = "text-xs font-medium uppercase tracking-wide text-muted-foreground"
  const sub = "text-xs text-muted-foreground"

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Link href="/statistics" className={tile} style={{ "--i": 2 } as React.CSSProperties}>
        <div className="flex items-start justify-between gap-2">
          <span className={label}>{t('winRate')}</span>
          <span className="relative h-11 w-11 shrink-0">
            <span className="ring absolute inset-0 rounded-full" style={{ "--p": winRate } as React.CSSProperties} aria-hidden="true" />
          </span>
        </div>
        <div>
          {/* Like the duration tile: no number until there is something to measure */}
          <div className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">{completed.length > 0 ? `${winRate}%` : '--'}</div>
          <div className={sub}>{won.length}/{completed.length} {t('matchesWon')}</div>
        </div>
      </Link>

      <Link href="/statistics" className={tile} style={{ "--i": 3 } as React.CSSProperties}>
        <span className={label}>{t('recentForm')}</span>
        <div>
          <div className="mb-2 flex gap-1.5" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => {
              const match = lastFive[lastFive.length - 5 + i]
              const result = match ? (match.winnerId === mainPlayer.$id ? 'win' : 'loss') : 'none'
              return (
                <span
                  key={i}
                  className={cn(
                    "h-2.5 flex-1 rounded-full",
                    result === 'win' && "bg-win",
                    result === 'loss' && "bg-loss/70",
                    result === 'none' && "bg-foreground/10"
                  )}
                />
              )
            })}
          </div>
          <div className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">{lastFive.length > 0 ? `${form}%` : '--'}</div>
          <div className={sub}>{t('last5Matches')}</div>
        </div>
      </Link>

      <Link href="/matches" className={tile} style={{ "--i": 4 } as React.CSSProperties}>
        <span className={label}>{t('singlesMatches')}</span>
        <div>
          <div className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">{completed.length}</div>
          <div className={sub}>{inProgress > 0 ? t('inProgressWithCount', { count: inProgress }) : t('completedMatches')}</div>
        </div>
      </Link>

      <Link href="/statistics" className={tile} style={{ "--i": 5 } as React.CSSProperties}>
        <span className={label}>{t('avgDuration')}</span>
        <div>
          <div data-duration-value className="whitespace-nowrap text-3xl font-semibold tracking-tight tabular-nums text-foreground">
            {/* Numbers large, units small, so "1 h 30 min" fits the tile on one line */}
            {(formatMatchDuration(avgDuration, locale) || '--').split(/(\d+)/).filter(Boolean).map((part, i) =>
              /^\d+$/.test(part) || part === '--'
                ? <span key={i}>{part}</span>
                : <span key={i} data-unit className="text-base font-medium text-muted-foreground">{part}</span>
            )}
          </div>
          <div className={sub}>{t('perMatch')}</div>
        </div>
      </Link>
    </div>
  )
}
