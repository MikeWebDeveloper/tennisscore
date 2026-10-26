"use client"

import { useEffect } from "react"

/**
 * Keep the screen awake while `active` is true (e.g. while scoring a live match).
 * The lock is dropped by the browser whenever the tab is hidden, so it is re-requested
 * on `visibilitychange`. Silently does nothing where the Screen Wake Lock API is unavailable.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () => {
      if (cancelled || document.visibilityState !== "visible" || sentinel) return
      try {
        const lock = await navigator.wakeLock.request("screen")
        if (cancelled) {
          void lock.release().catch(() => {})
          return
        }
        sentinel = lock
        lock.addEventListener("release", () => {
          if (sentinel === lock) sentinel = null
        })
      } catch {
        // Denied (low battery, unsupported context): scoring must keep working
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible") void acquire()
    }

    void acquire()
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", onVisibility)
      void sentinel?.release().catch(() => {})
      sentinel = null
    }
  }, [active])
}
