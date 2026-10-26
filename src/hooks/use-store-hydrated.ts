"use client"

import { useEffect, useState } from "react"

interface PersistApi {
  hasHydrated: () => boolean
  onFinishHydration: (fn: () => void) => () => void
}

/**
 * True once a persisted zustand store has loaded from (async) storage.
 * A safety timeout lets the app continue if storage never answers, so it can never hang.
 */
export function useStoreHydrated(persist: PersistApi | undefined, timeoutMs = 4000): boolean {
  const [hydrated, setHydrated] = useState(() => !persist || persist.hasHydrated())

  useEffect(() => {
    if (!persist || hydrated) return
    // Hydration may have finished between render and effect
    if (persist.hasHydrated()) { setHydrated(true); return }
    const unsubscribe = persist.onFinishHydration(() => setHydrated(true))
    const timer = setTimeout(() => setHydrated(true), timeoutMs)
    return () => { unsubscribe(); clearTimeout(timer) }
  }, [persist, hydrated, timeoutMs])

  return hydrated
}
