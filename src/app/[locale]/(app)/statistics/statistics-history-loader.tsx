"use client"

import { useEffect, useState } from "react"
import { getMatchesWithStats } from "@/lib/actions/statistics"
import { useTranslations } from "@/i18n"
import type { Match, Player } from "@/lib/types"
import EnhancedStatisticsClient from "./enhanced-statistics-client"

const PAGE_SIZE = 50

export function StatisticsHistoryLoader({ mainPlayer, initialMatches }: { mainPlayer: Player; initialMatches: Match[] }) {
  const t = useTranslations('statistics')
  const [matches, setMatches] = useState(initialMatches)
  const [state, setState] = useState<'loading' | 'done' | 'error'>(initialMatches.length === PAGE_SIZE ? 'loading' : 'done')

  useEffect(() => {
    let cancelled = false
    setMatches(initialMatches)
    if (initialMatches.length < PAGE_SIZE) {
      setState('done')
      return () => { cancelled = true }
    }
    setState('loading')
    const loadHistory = async () => {
      let cursorAfter = initialMatches[initialMatches.length - 1].$id
      try {
        while (!cancelled) {
          const page = await getMatchesWithStats(mainPlayer.$id, { limit: PAGE_SIZE, cursorAfter })
          if (cancelled) return
          setMatches(previous => {
            const known = new Set(previous.map(match => match.$id))
            return [...previous, ...page.filter(match => !known.has(match.$id))]
          })
          if (page.length < PAGE_SIZE) {
            setState('done')
            return
          }
          const nextCursor = page[page.length - 1].$id
          if (nextCursor === cursorAfter) throw new Error('History cursor did not advance')
          cursorAfter = nextCursor
        }
      } catch {
        if (!cancelled) setState('error')
      }
    }
    void loadHistory()
    return () => { cancelled = true }
  }, [initialMatches, mainPlayer.$id])

  return (
    <>
      {state !== 'done' && (
        <p role="status" className="mb-3 rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
          {t(state === 'loading' ? 'loadingOlderMatches' : 'historyLoadFailed')}
        </p>
      )}
      <EnhancedStatisticsClient mainPlayer={mainPlayer} matches={matches} />
    </>
  )
}
