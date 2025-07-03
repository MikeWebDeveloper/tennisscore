"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { client } from "@/lib/appwrite-client"
import { databases } from "@/lib/appwrite-client"

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
  const lastVisibilityChangeRef = useRef<number>(0)

  // Function to fetch current match data
  const fetchMatchData = useCallback(async () => {
    if (!matchId) return

    try {
      console.log("📊 Fetching current match data...")
      const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID?.trim()
      const collectionId = process.env.NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID?.trim()
      
      if (!dbId || !collectionId) {
        throw new Error("Missing environment variables")
      }

      const response = await databases.getDocument(
        dbId,
        collectionId,
        matchId
      )

      console.log("✅ Match data fetched:", response)
      
      setLastUpdate({
        score: response.score as string,
        pointLog: response.pointLog as string[],
        events: response.events as string[],
        status: response.status as "In Progress" | "Completed",
        winnerId: response.winnerId as string | undefined
      })
    } catch (err) {
      console.error("❌ Failed to fetch match data:", err)
    }
  }, [matchId])

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

        // Fetch initial data after establishing connection
        fetchMatchData()

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
  }, [matchId, retryCount, fetchMatchData])

  // Enhanced visibility change handling with Safari mobile fixes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const now = Date.now()
      
      if (document.visibilityState === 'visible' && matchId) {
        console.log("👁️ Page became visible")
        
        // Calculate time since last visibility change
        const timeSinceLastChange = now - lastVisibilityChangeRef.current
        
        // Detect if we're on a Vercel preview URL
        const isVercelPreview = typeof window !== 'undefined' && 
          (window.location.hostname.includes('vercel.app') || 
           window.location.hostname.includes('-git-'))
        
        // For Safari mobile on Vercel preview: More aggressive refresh (3s)
        // Safari aggressively suspends WebSocket connections on preview URLs
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
        
        let forceRefreshThreshold = 10000 // Default 10s
        if (isVercelPreview && isSafari && isMobile) {
          forceRefreshThreshold = 3000 // Very aggressive on preview + Safari mobile
        } else if (isVercelPreview && isSafari) {
          forceRefreshThreshold = 5000 // Aggressive on preview + Safari desktop
        } else if (isSafari) {
          forceRefreshThreshold = 5000 // Safari-specific
        }
        
        console.log(`🔍 Environment: Preview=${isVercelPreview}, Safari=${isSafari}, Mobile=${isMobile}, Threshold=${forceRefreshThreshold}ms`)
        
        if (timeSinceLastChange > forceRefreshThreshold) {
          console.log(`🔄 Page was hidden for >${forceRefreshThreshold/1000}s, refreshing data...`)
          fetchMatchData()
          
          // For Vercel preview URLs, also force reconnection
          if (isVercelPreview && !isConnectingRef.current) {
            console.log("🔌 Vercel preview detected - forcing reconnection...")
            if (unsubscribeRef.current) {
              unsubscribeRef.current()
              unsubscribeRef.current = null
            }
            setConnected(false)
            setRetryCount(0)
          }
        }
        
        // If not connected and not already connecting, trigger reconnection
        if (!connected && !isConnectingRef.current) {
          console.log("🔌 Not connected, triggering reconnection...")
          setRetryCount(0) // Reset retry count to trigger reconnection
        }
      } else if (document.visibilityState === 'hidden') {
        lastVisibilityChangeRef.current = now
        console.log("👻 Page became hidden")
      }
    }

    // Safari-specific page lifecycle handling
    const handlePageShow = (event: PageTransitionEvent) => {
      console.log("📄 Page show event", { persisted: event.persisted })
      if (event.persisted && matchId) {
        // Page was restored from cache (Safari back/forward cache)
        console.log("🔄 Page restored from cache, forcing refresh...")
        fetchMatchData()
        if (!connected && !isConnectingRef.current) {
          setRetryCount(0)
        }
      }
    }

    const handlePageHide = () => {
      console.log("📄 Page hide event")
      lastVisibilityChangeRef.current = Date.now()
    }

    // Initial timestamp
    lastVisibilityChangeRef.current = Date.now()
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('pagehide', handlePageHide)
    
    // Enhanced focus/blur handling for Safari mobile
    const handleFocus = () => {
      console.log("🎯 Window focused")
      if (matchId) {
        // Always refresh on focus for Safari mobile to ensure fresh data
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
        if (isSafari) {
          console.log("🍎 Safari detected, forcing refresh on focus")
          fetchMatchData()
        }
        
        if (!connected && !isConnectingRef.current) {
          console.log("🔌 Not connected on focus, triggering reconnection...")
          setRetryCount(0)
        }
      }
    }

    const handleBlur = () => {
      console.log("😶‍🌫️ Window blurred")
      lastVisibilityChangeRef.current = Date.now()
    }
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    // Safari-specific: Handle app state changes on iOS
    const handleAppStateChange = () => {
      console.log("📱 App state change detected")
      if (document.visibilityState === 'visible' && matchId) {
        fetchMatchData()
        if (!connected && !isConnectingRef.current) {
          setRetryCount(0)
        }
      }
    }

    // Listen for iOS-specific events
    document.addEventListener('resume', handleAppStateChange)
    document.addEventListener('online', handleAppStateChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('resume', handleAppStateChange)
      document.removeEventListener('online', handleAppStateChange)
    }
  }, [connected, matchId, fetchMatchData])

  // Periodically check connection health with Safari-specific heartbeat
  useEffect(() => {
    if (!matchId || !connected) return

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const isVercelPreview = typeof window !== 'undefined' && 
      (window.location.hostname.includes('vercel.app') || 
       window.location.hostname.includes('-git-'))
    
    // More frequent checks for Safari mobile (every 15 seconds instead of 30)
    // Even more frequent for Vercel preview URLs (every 10 seconds)
    let checkInterval = 30000 // Default
    if (isVercelPreview && isSafari && isMobile) {
      checkInterval = 8000  // Very frequent for preview + Safari mobile
    } else if (isVercelPreview) {
      checkInterval = 10000 // Frequent for preview URLs
    } else if (isSafari && isMobile) {
      checkInterval = 15000 // Safari mobile
    }

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log("⏰ Periodic connection check")
        
        // For Safari mobile, actively check if real-time is still working
        if (isSafari && isMobile) {
          console.log("🍎📱 Safari mobile heartbeat - checking data freshness")
          fetchMatchData()
        }
        
        // For Vercel preview URLs, use more aggressive polling as WebSocket fallback
        if (isVercelPreview) {
          console.log("🔄 Vercel preview polling fallback")
          fetchMatchData()
        }
      }
    }, checkInterval)

    return () => clearInterval(interval)
  }, [matchId, connected, fetchMatchData])

  return { connected, lastUpdate, error, retryCount }
} 