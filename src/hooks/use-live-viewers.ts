import { useEffect, useRef, useState } from "react"

function generateUserId() {
  // Use crypto if available, fallback to Math.random
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function useLiveViewers(matchId: string, isPublic: boolean = true) {
  const [count, setCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const userIdRef = useRef<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!matchId) return
    // Generate userId once per tab
    if (!userIdRef.current) {
      userIdRef.current = generateUserId()
    }
    let stopped = false

    async function heartbeat() {
      try {
        await fetch("/api/live-viewers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId, userId: userIdRef.current, isPublic })
        })
      } catch {
        // Ignore errors
      }
    }

    async function fetchCount() {
      setLoading(true)
      try {
        const res = await fetch(`/api/live-viewers?matchId=${encodeURIComponent(matchId)}`)
        const data = await res.json()
        if (!stopped && data.success) {
          setCount(data.count)
        }
      } catch {
        // Ignore errors
      } finally {
        setLoading(false)
      }
    }

    // Initial heartbeat and count
    heartbeat()
    fetchCount()

    // Heartbeat every 15s, fetch count every 10s
    intervalRef.current = setInterval(() => {
      heartbeat()
      fetchCount()
    }, 10000)

    return () => {
      stopped = true
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [matchId, isPublic])

  return { count, loading }
} 