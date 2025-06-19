"use client"

import { useEffect, useState, useRef } from "react"
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
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const isConnectingRef = useRef(false)

  useEffect(() => {
    if (!matchId || isConnectingRef.current) {
      return
    }

    console.log("🚀 Starting real-time connection for match:", matchId)
    isConnectingRef.current = true

    const connectToRealtime = () => {
      try {
        console.log("🔄 Connecting to real-time updates...")
        
        // Verify environment variables and trim whitespace/newlines
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID?.trim()
        const collectionId = process.env.NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID?.trim()
        
        console.log("🔍 Environment check:", {
          endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim(),
          project: process.env.NEXT_PUBLIC_APPWRITE_PROJECT?.trim(),
          database: dbId,
          collection: collectionId,
          matchId
        })
        
        if (!dbId || !collectionId) {
          throw new Error(`Missing required environment variables: database=${!!dbId}, collection=${!!collectionId}`)
        }
        
        // Simple subscription to the specific document
        const channel = `databases.${dbId}.collections.${collectionId}.documents.${matchId}`
        
        console.log("📡 Subscription channel:", channel)
        console.log("🔧 Client configuration:", {
          hasClient: !!client
        })

        const unsubscribe = client.subscribe(
          channel,
          (response) => {
            console.log("🎉 Real-time event received:", response)
            
            // Check if this is an update event
            const isUpdate = response.events.some(event => 
              event.includes('update')
            )
            
            if (isUpdate && response.payload) {
              const payload = response.payload as Record<string, unknown>
              console.log("✅ Match updated:", payload)
              
              setLastUpdate({
                score: payload.score as string,
                pointLog: payload.pointLog as string[],
                events: payload.events as string[],
                status: payload.status as "In Progress" | "Completed",
                winnerId: payload.winnerId as string | undefined
              })
              setConnected(true)
              setError(null)
              setRetryCount(0)
            }
          }
        )

        unsubscribeRef.current = unsubscribe
        setConnected(true)
        setError(null)
        console.log("✅ Real-time subscription established")

      } catch (err) {
        console.error("❌ Real-time connection failed:", err)
        setError(err instanceof Error ? err.message : "Connection failed")
        setConnected(false)
        
        // Retry with exponential backoff
        if (retryCount < 3) {
          const delay = 1000 * Math.pow(2, retryCount)
          console.log(`⏳ Retrying in ${delay}ms...`)
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
            connectToRealtime()
          }, delay)
        }
      } finally {
        isConnectingRef.current = false
      }
    }

    // Start connection
    connectToRealtime()

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up real-time connection")
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current()
        } catch (err) {
          console.error("Error during cleanup:", err)
        }
        unsubscribeRef.current = null
      }
      setConnected(false)
      isConnectingRef.current = false
    }
  }, [matchId, retryCount])

  // Handle page visibility changes for mobile
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !connected && matchId && !isConnectingRef.current) {
        console.log("👁️ Page became visible, reconnecting...")
        setRetryCount(0) // Reset retry count
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connected, matchId])

  return { connected, lastUpdate, error, retryCount }
} 