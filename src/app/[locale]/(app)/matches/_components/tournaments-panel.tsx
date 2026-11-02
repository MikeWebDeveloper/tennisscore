"use client"

import { useEffect, useState } from "react"
import { Trophy } from "lucide-react"
import { useLocale, useTranslations } from "@/i18n"
import { getTournamentSummaries } from "@/lib/actions/tournaments"
import type { TournamentSummary } from "@/lib/utils/tournaments"

/** The account's tournaments, newest first; tapping one shows its matches */
export function TournamentsPanel({ onPick }: { onPick: (tournament: TournamentSummary) => void }) {
  const t = useTranslations("match")
  const locale = useLocale()
  const [tournaments, setTournaments] = useState<TournamentSummary[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    getTournamentSummaries().then((result) => {
      if (cancelled) return
      if (result.tournaments) setTournaments(result.tournaments)
      else setFailed(true)
    })
    return () => { cancelled = true }
  }, [])

  if (failed) return <p role="status" className="text-sm text-muted-foreground">{t("tournamentsLoadFailed")}</p>
  if (!tournaments) return <div className="space-y-2" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
  if (tournaments.length === 0) return <p className="text-sm text-muted-foreground">{t("noTournaments")}</p>

  const day = new Intl.DateTimeFormat(locale, { day: "numeric", month: "numeric", year: "numeric" })
  const dates = (summary: TournamentSummary) => {
    const from = day.format(new Date(summary.from))
    const to = day.format(new Date(summary.to))
    return from === to ? from : t("tournamentDates", { from, to })
  }

  return (
    <ul className="space-y-2">
      {tournaments.map((summary) => (
        <li key={summary.key}>
          <button type="button" onClick={() => onPick(summary)} className="surface surface-hover press flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left">
            <Trophy className="h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">{summary.name}</span>
              <span className="block text-xs text-muted-foreground">{dates(summary)}</span>
            </span>
            <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
              {t("tournamentRecord", { count: summary.matches, wins: summary.wins, losses: summary.losses })}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
