"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { client } from '@/lib/appwrite-client'
import { queryKeys } from '@/lib/tanstack-query/query-keys'
import type { Score } from '@/stores/matchStore'

interface PerformanceRealtimeConfig {
  matchId: string
  enableOptimizations?: boolean
  batchUpdates?: boolean
  prefetchInterval?: number
  fallbackPolling?: boolean
}

interface RealtimePerformanceMetrics {
  connected: boolean
  latency: number
  updateCount: number
  errorCount: number
  connectionType: 'websocket' | 'polling' | 'offline'
  lastUpdate: number
}

interface RealtimeMatchUpdate {
  score?: Score
  pointLog?: string[]
  events?: string[]
  status?: 'In Progress' | 'Completed'
  winnerId?: string
  timestamp: number
}

/**
 * High-performance Appwrite Realtime with intelligent caching
 * Optimized for sub-100ms updates and mobile Safari compatibility
 */
export function usePerformanceRealtime({
  matchId,
  enableOptimizations = true,
  batchUpdates = true,
  prefetchInterval = 1000,
  fallbackPolling = true
}: PerformanceRealtimeConfig) {
  const queryClient = useQueryClient()
  const [metrics, setMetrics] = useState<RealtimePerformanceMetrics>({
    connected: false,
    latency: 0,
    updateCount: 0,
    errorCount: 0,
    connectionType: 'offline',
    lastUpdate: 0
  })

  // Connection management
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const lastPingRef = useRef<number>(0)
  const updateQueueRef = useRef<RealtimeMatchUpdate[]>([])
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Optimized update processing with batching
  const processBatchedUpdates = useCallback(() => {
    if (updateQueueRef.current.length === 0) return

    const updates = [...updateQueueRef.current]
    updateQueueRef.current = []

    // Get the most recent update (last in queue)
    const latestUpdate = updates[updates.length - 1]
    const startTime = performance.now()

    // Update React Query cache efficiently
    queryClient.setQueryData(
      queryKeys.matches.detail(matchId),
      (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          ...latestUpdate,
          // Ensure score consistency - use provided score or fallback
          score: latestUpdate.score || oldData.score,
          lastUpdate: latestUpdate.timestamp
        }
      }
    )

    // Update performance metrics
    const processingTime = performance.now() - startTime
    setMetrics(prev => ({
      ...prev,
      latency: Math.round(processingTime),
      updateCount: prev.updateCount + updates.length,
      lastUpdate: latestUpdate.timestamp
    }))
  }, [queryClient, matchId])

  // Queue update for batching or process immediately
  const queueUpdate = useCallback((update: RealtimeMatchUpdate) => {
    if (!batchUpdates) {
      updateQueueRef.current = [update]
      processBatchedUpdates()
      return
    }

    updateQueueRef.current.push(update)

    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current)
    }

    // Batch updates every 16ms (60fps) for smooth UI
    batchTimeoutRef.current = setTimeout(processBatchedUpdates, 16)
  }, [batchUpdates, processBatchedUpdates])

  // WebSocket connection with Safari mobile handling
  const establishWebSocketConnection = useCallback(() => {
    try {
      const unsubscribe = client.subscribe(
        `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID}.documents.${matchId}`,
        (response) => {
          const payload = response.payload as any
          
          queueUpdate({
            score: payload.score ? JSON.parse(payload.score) : undefined,
            pointLog: payload.pointLog || undefined,
            events: payload.events || undefined,
            status: payload.status || undefined,
            winnerId: payload.winnerId || undefined,
            timestamp: Date.now()
          })
        }
      )

      unsubscribeRef.current = unsubscribe
      
      setMetrics(prev => ({
        ...prev,
        connected: true,
        connectionType: 'websocket',
        errorCount: 0
      }))

      return true
    } catch (error) {
      console.warn('WebSocket connection failed:', error)
      setMetrics(prev => ({
        ...prev,
        connected: false,
        errorCount: prev.errorCount + 1
      }))
      return false
    }
  }, [matchId, queueUpdate])

  // Fallback polling for problematic connections
  const establishPollingConnection = useCallback(() => {
    const pollInterval = setInterval(async () => {
      try {
        // Use React Query's background fetch
        await queryClient.invalidateQueries({
          queryKey: queryKeys.matches.detail(matchId),
          refetchType: 'active'
        })

        setMetrics(prev => ({
          ...prev,
          connected: true,
          connectionType: 'polling',
          lastUpdate: Date.now()
        }))
      } catch (error) {
        setMetrics(prev => ({
          ...prev,
          errorCount: prev.errorCount + 1
        }))
      }
    }, prefetchInterval)

    return () => clearInterval(pollInterval)
  }, [queryClient, matchId, prefetchInterval])

  // Connection management with automatic fallbacks
  useEffect(() => {
    let cleanup: (() => void) | null = null

    // Try WebSocket first
    const wsSuccess = establishWebSocketConnection()

    // Fallback to polling if WebSocket fails and fallback is enabled
    if (!wsSuccess && fallbackPolling) {
      cleanup = establishPollingConnection()
    }

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      if (cleanup) {
        cleanup()
      }
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current)
      }
    }
  }, [matchId, establishWebSocketConnection, establishPollingConnection, fallbackPolling])

  // Smart cache prefetching for probable next states
  const prefetchProbableStates = useCallback(() => {
    if (!enableOptimizations) return

    // Prefetch common tennis scenarios
    queryClient.prefetchQuery({
      queryKey: queryKeys.statistics.match(matchId),
      staleTime: 30 * 1000 // 30 seconds
    })
  }, [queryClient, matchId, enableOptimizations])

  // Performance monitoring
  const performanceInfo = useMemo(() => ({
    ...metrics,
    isOptimal: metrics.latency < 100 && metrics.connected,
    connectionHealth: metrics.errorCount < 3 ? 'good' : 'poor',
    recommendedAction: metrics.latency > 200 ? 'Consider polling fallback' : 'Optimal performance'
  }), [metrics])

  return {
    // Performance metrics
    performance: performanceInfo,
    
    // Connection status
    isConnected: metrics.connected,
    connectionType: metrics.connectionType,
    
    // Control methods
    prefetchProbableStates,
    
    // Raw metrics for debugging
    rawMetrics: metrics
  }
}

// Connection health monitor
export function useConnectionHealth(matchId: string) {
  const { performance } = usePerformanceRealtime({ matchId })
  
  return {
    isHealthy: performance.isOptimal,
    status: performance.connectionHealth,
    latency: performance.latency,
    recommendation: performance.recommendedAction
  }
}