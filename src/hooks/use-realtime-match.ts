"use client"

import { useEffect, useState, useCallback } from "react"
import { client } from "@/lib/appwrite-client"

interface RealtimeMatchData {
  score?: string
  pointLog?: string[]
  events?: string[]
  status?: "In Progress" | "Completed"
  winnerId?: string
}

export function useRealtimeMatch(matchId: string) {
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<RealtimeMatchData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const connect = useCallback(() => {
    if (!matchId) return

    console.log(`Attempting to connect to real-time updates for match: ${matchId}`)
    
    // Build the subscription channel
    const channel = `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID}.documents.${matchId}`
    
    console.log(`Subscription channel: ${channel}`)

    try {
      const unsubscribe = client.subscribe(
        channel,
        (response) => {
          console.log("Real-time response received:", response)
          
          // Check if this is an update event
          if (response.events.includes('databases.*.collections.*.documents.*.update')) {
            const updatedMatch = response.payload as Record<string, unknown>
            
            console.log("Match updated:", updatedMatch)
            
            setLastUpdate({
              score: updatedMatch.score as string,
              pointLog: updatedMatch.pointLog as string[],
              events: updatedMatch.events as string[],
              status: updatedMatch.status as "In Progress" | "Completed",
              winnerId: updatedMatch.winnerId as string | undefined
            })
            setConnected(true)
            setError(null)
            setRetryCount(0)
          }
        }
      )

      // Connection established
      setConnected(true)
      setError(null)
      
      return unsubscribe
    } catch (err) {
      console.error("Failed to establish real-time connection:", err)
      setError(err instanceof Error ? err.message : "Connection failed")
      setConnected(false)
      
      // Retry connection with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000) // Max 30 seconds
      setTimeout(() => {
        if (retryCount < 5) {
          setRetryCount(prev => prev + 1)
          connect()
        }
      }, delay)
      
      return () => {}
    }
  }, [matchId, retryCount])

  useEffect(() => {
    const unsubscribe = connect()
    
    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
      setConnected(false)
    }
  }, [connect])

  // Add visibility change handler for mobile browsers
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !connected && matchId) {
        console.log("Page became visible, reconnecting...")
        connect()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connected, matchId, connect])

  return { connected, lastUpdate, error, retryCount }
} 