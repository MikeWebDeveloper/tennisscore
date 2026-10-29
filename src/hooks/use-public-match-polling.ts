"use client"

import { useEffect, useState } from 'react'

export interface PublicMatchUpdate {
  score?: string
  status?: string
  winnerId?: string
  pointLog?: string[]
  isPaused?: boolean
  pauseReason?: string
}

// Lightweight spectator mode intentionally avoids loading the Appwrite SDK.
export function usePublicMatchPolling(matchId: string) {
  const [lastUpdate, setLastUpdate] = useState<PublicMatchUpdate | null>(null)
  useEffect(() => {
    if (!matchId) return
    let cancelled = false
    let sequence = 0
    const refresh = async () => {
      if (document.visibilityState !== 'visible') return
      const current = ++sequence
      try {
        const response = await fetch(`/api/live/${encodeURIComponent(matchId)}`, { cache: 'no-store' })
        if (!response.ok) return
        const update: PublicMatchUpdate = await response.json()
        if (!cancelled && current === sequence) setLastUpdate(update)
      } catch { /* Keep the last score; the next poll will retry. */ }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh() }
    void refresh()
    const timer = setInterval(refresh, 5000)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [matchId])
  return lastUpdate
}
