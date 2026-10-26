"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { client, databases } from "@/lib/appwrite-client"

interface RealtimeMatchData {
  score?: string
  pointLog?: string[]
  events?: string[]
  status?: "In Progress" | "Completed"
  winnerId?: string
}

const isDev = process.env.NODE_ENV !== "production"
const log = (...args: unknown[]) => {
  if (isDev) console.log(...args)
}

/**
 * Subscribe to live updates for a single match document.
 *
 * Design notes (rewritten for mobile-Safari reliability):
 * - ONE subscription per matchId. The effect is keyed only on `matchId`; all
 *   mutable state lives in refs (latest-ref pattern) so visibility/focus/network
 *   changes never tear down and re-create the WebSocket subscription.
 * - Every retry timer and unsubscribe handle is tracked and cleared on cleanup,
 *   so nothing fires on an unmounted hook and subscriptions never stack.
 * - Appwrite's web SDK keeps a single socket per client and reconnects on its
 *   own, so we don't force-reconnect on every lifecycle event — we just do a
 *   single catch-up read when the page becomes visible again, plus a gentle
 *   safety poll. This removes the old 3–15s polling that drained battery.
 * - A monotonic sequence guards against a slow REST catch-up overwriting a
 *   newer realtime push (no more score flicker/rollback).
 */
export function useRealtimeMatch(matchId: string) {
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<RealtimeMatchData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Mutable state that must NOT trigger re-subscription / re-render.
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isConnectingRef = useRef(false)
  const retryAttemptsRef = useRef(0)
  const updateSeqRef = useRef(0)
  const mountedRef = useRef(true)

  // A realtime push is the freshest source; bump the sequence so an in-flight
  // REST fetch knows it has been superseded.
  const applyRealtime = useCallback((data: RealtimeMatchData) => {
    updateSeqRef.current += 1
    if (mountedRef.current) setLastUpdate(data)
  }, [])

  // Catch-up read. Skips applying its result if a realtime push landed while it
  // was in flight, so it can never roll the score back.
  const fetchMatchData = useCallback(async () => {
    if (!matchId) return
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID?.trim()
    const collectionId = process.env.NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID?.trim()
    if (!dbId || !collectionId) return

    const seqAtStart = updateSeqRef.current
    try {
      const response = await databases.getDocument(dbId, collectionId, matchId)
      if (!mountedRef.current) return
      if (updateSeqRef.current !== seqAtStart) return // a realtime push won

      setLastUpdate({
        score: response.score as string,
        pointLog: response.pointLog as string[],
        events: response.events as string[],
        status: response.status as "In Progress" | "Completed",
        winnerId: response.winnerId as string | undefined,
      })
    } catch (err) {
      log("❌ Failed to fetch match data:", err)
    }
  }, [matchId])

  // ── Subscription lifecycle (keyed only on matchId) ──────────────────────────
  useEffect(() => {
    if (!matchId) return
    mountedRef.current = true
    retryAttemptsRef.current = 0

    const clearRetry = () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }

    const dropSubscription = () => {
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current()
        } catch (err) {
          log("Error during unsubscribe:", err)
        }
        unsubscribeRef.current = null
      }
    }

    const connect = () => {
      if (isConnectingRef.current) return
      isConnectingRef.current = true
      // Never let a previous subscription linger.
      dropSubscription()

      try {
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID?.trim()
        const collectionId = process.env.NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID?.trim()
        if (!dbId || !collectionId) {
          throw new Error("Missing required Appwrite environment variables")
        }

        const channel = `databases.${dbId}.collections.${collectionId}.documents.${matchId}`
        log("📡 Subscribing:", channel)

        unsubscribeRef.current = client.subscribe(channel, (response) => {
          const isUpdate = response.events?.some((event) => event.includes("update"))
          if (isUpdate && response.payload) {
            const payload = response.payload as Record<string, unknown>
            applyRealtime({
              score: payload.score as string,
              pointLog: payload.pointLog as string[],
              events: payload.events as string[],
              status: payload.status as "In Progress" | "Completed",
              winnerId: payload.winnerId as string | undefined,
            })
            retryAttemptsRef.current = 0
            if (mountedRef.current) {
              setConnected(true)
              setError(null)
              setRetryCount(0)
            }
          }
        })

        if (mountedRef.current) {
          setConnected(true)
          setError(null)
        }

        // Initial catch-up read.
        fetchMatchData()
      } catch (err) {
        log("❌ Real-time connection failed:", err)
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "Connection failed")
          setConnected(false)
        }
        // Bounded retry with backoff; the timer is tracked so it can be cleared.
        if (retryAttemptsRef.current < 3) {
          const delay = 1000 * Math.pow(2, retryAttemptsRef.current)
          retryAttemptsRef.current += 1
          if (mountedRef.current) setRetryCount(retryAttemptsRef.current)
          clearRetry()
          retryTimeoutRef.current = setTimeout(connect, delay)
        }
      } finally {
        isConnectingRef.current = false
      }
    }

    connect()

    return () => {
      mountedRef.current = false
      clearRetry()
      dropSubscription()
    }
  }, [matchId, fetchMatchData, applyRealtime])

  // ── Catch-up on resume + gentle safety poll (no re-subscription) ────────────
  useEffect(() => {
    if (!matchId) return

    // Debounce so a burst of lifecycle events triggers a single fetch.
    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = setTimeout(() => {
        if (document.visibilityState === "visible") fetchMatchData()
      }, 300)
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") scheduleRefresh()
    }
    const onPageShow = (event: PageTransitionEvent) => {
      // Restored from bfcache → reconcile any missed updates.
      if (event.persisted) scheduleRefresh()
    }

    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("pageshow", onPageShow)
    window.addEventListener("focus", scheduleRefresh)
    window.addEventListener("online", scheduleRefresh)

    // Gentle safety poll (every 45s, only while visible) as a WebSocket backstop.
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchMatchData()
    }, 45000)

    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current)
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("pageshow", onPageShow)
      window.removeEventListener("focus", scheduleRefresh)
      window.removeEventListener("online", scheduleRefresh)
    }
  }, [matchId, fetchMatchData])

  return { connected, lastUpdate, error, retryCount }
}
