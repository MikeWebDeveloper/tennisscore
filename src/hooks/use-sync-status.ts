"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type SyncState = "synced" | "saving" | "unsent"

/**
 * Tracks whether the latest local score has reached the server and retries automatically.
 *
 * Wrap every save in `run(...)`. While any save is in flight the state is "saving"; when none
 * are, it is "unsent" if the most recently started save failed, otherwise "synced". While
 * unsent, `pushLatest` (a full-snapshot push) is retried when the browser comes back online and
 * on a timer while the page is visible.
 */
export function useSyncStatus(pushLatest: () => Promise<unknown>, retryMs = 10_000) {
  const [state, setState] = useState<SyncState>("synced")
  const pending = useRef(0)
  const latestId = useRef(0)
  const lastFailed = useRef(false)
  const pushRef = useRef(pushLatest)

  useEffect(() => {
    pushRef.current = pushLatest
  })

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    const id = ++latestId.current
    pending.current++
    setState("saving")
    try {
      const result = await fn()
      if (id === latestId.current) lastFailed.current = false
      return result
    } catch (error) {
      if (id === latestId.current) lastFailed.current = true
      throw error
    } finally {
      pending.current--
      if (pending.current === 0) setState(lastFailed.current ? "unsent" : "synced")
    }
  }, [])

  useEffect(() => {
    if (state !== "unsent") return
    const retry = () => {
      if (document.visibilityState !== "visible" || navigator.onLine === false) return
      run(() => pushRef.current()).catch(() => {})
    }
    window.addEventListener("online", retry)
    const timer = setInterval(retry, retryMs)
    return () => {
      window.removeEventListener("online", retry)
      clearInterval(timer)
    }
  }, [state, run, retryMs])

  return { state, run }
}
