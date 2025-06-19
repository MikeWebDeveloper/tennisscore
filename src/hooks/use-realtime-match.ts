"use client"

import { useEffect, useState, useCallback } from "react"
import { client, databases } from "@/lib/appwrite-client"

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

  // Test if we can access the document first
  const testDocumentAccess = useCallback(async () => {
    if (!matchId) return false
    
    try {
      console.log("🔍 Testing document access for match:", matchId)
      
      const document = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID!,
        matchId
      )
      
      console.log("✅ Document access successful:", {
        id: document.$id,
        status: document.status,
        hasScore: !!document.score
      })
      
      return true
    } catch (err) {
      console.error("❌ Document access failed:", err)
      setError(`Cannot access match document: ${err instanceof Error ? err.message : 'Unknown error'}`)
      return false
    }
  }, [matchId])

  const connect = useCallback(async () => {
    if (!matchId) {
      console.log("No matchId provided, skipping connection")
      return
    }

    console.log(`🔄 Attempting to connect to real-time updates for match: ${matchId}`)
    
    // First test if we can access the document
    const canAccess = await testDocumentAccess()
    if (!canAccess) {
      return
    }
    
    console.log("Environment variables:", {
      endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
      project: process.env.NEXT_PUBLIC_APPWRITE_PROJECT,
      database: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      collection: process.env.NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID
    })
    
    // Try different subscription approaches
    const channels = [
      // Specific document
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID}.documents.${matchId}`,
      // Collection level (might be more reliable)
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID}.documents`,
    ]
    
    console.log(`📡 Trying subscription channels:`, channels)

    try {
      // Try subscribing to both channels
      const unsubscribe = client.subscribe(
        channels,
        (response) => {
          console.log("🎉 Real-time response received:", response)
          console.log("Events:", response.events)
          console.log("Payload:", response.payload)
          
          // Check if this update is for our specific match
          const payload = response.payload as Record<string, unknown>
          if (payload && payload.$id !== matchId) {
            console.log(`🔍 Update for different match (${payload.$id}), ignoring`)
            return
          }
          
          // Check for any update events
          const hasUpdateEvent = response.events.some(event => 
            event.includes('databases') && 
            event.includes('documents') && 
            event.includes('update')
          )
          
          if (hasUpdateEvent && payload && payload.$id === matchId) {
            console.log("✅ Match updated via real-time:", payload)
            
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
          } else {
            console.log("🔍 Non-matching event received:", {
              events: response.events,
              payloadId: payload?.$id,
              expectedId: matchId
            })
          }
        }
      )

      console.log("✅ Real-time subscription established")
      setConnected(true)
      setError(null)
      
      return unsubscribe
    } catch (err) {
      console.error("❌ Failed to establish real-time connection:", err)
      setError(err instanceof Error ? err.message : "Connection failed")
      setConnected(false)
      
      // Retry connection with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000) // Max 30 seconds
      console.log(`⏳ Retrying connection in ${delay}ms (attempt ${retryCount + 1}/5)`)
      
      setTimeout(() => {
        if (retryCount < 5) {
          setRetryCount(prev => prev + 1)
          connect()
        }
      }, delay)
      
      return () => {}
    }
  }, [matchId, retryCount, testDocumentAccess])

  useEffect(() => {
    console.log("🚀 Starting real-time connection for match:", matchId)
    const connectPromise = connect()
    
    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up real-time connection")
      connectPromise.then((unsubscribe) => {
        if (typeof unsubscribe === 'function') {
          unsubscribe()
        }
      }).catch(() => {
        // Handle cleanup errors silently
      })
      setConnected(false)
    }
  }, [connect])

  // Add visibility change handler for mobile browsers
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !connected && matchId) {
        console.log("👁️ Page became visible, reconnecting...")
        connect()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connected, matchId, connect])

  // Test connection on mount
  useEffect(() => {
    if (matchId) {
      console.log("🧪 Testing Appwrite client connection...")
      console.log("Client config available:", !!client)
    }
  }, [matchId])

  return { connected, lastUpdate, error, retryCount }
} 