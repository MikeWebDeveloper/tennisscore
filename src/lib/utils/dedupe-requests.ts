// Request deduplication utilities to prevent duplicate API calls

interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
  abortController?: AbortController
}

export class RequestDeduper {
  private static instance: RequestDeduper
  private pendingRequests = new Map<string, PendingRequest<any>>()
  private requestCounts = new Map<string, number>()
  
  static getInstance(): RequestDeduper {
    if (!RequestDeduper.instance) {
      RequestDeduper.instance = new RequestDeduper()
    }
    return RequestDeduper.instance
  }

  // Deduplicate identical requests within a time window
  async dedupe<T>(
    key: string,
    requestFn: (signal?: AbortSignal) => Promise<T>,
    options: {
      timeout?: number // Max time to wait for pending request (ms)
      useAbortSignal?: boolean
    } = {}
  ): Promise<T> {
    const { timeout = 30000, useAbortSignal = true } = options
    
    // Check if identical request is already pending
    const pending = this.pendingRequests.get(key)
    if (pending) {
      // Check if request hasn't timed out
      if (Date.now() - pending.timestamp < timeout) {
        this.incrementRequestCount(key)
        return pending.promise
      } else {
        // Clean up timed out request
        if (pending.abortController) {
          pending.abortController.abort()
        }
        this.pendingRequests.delete(key)
      }
    }

    // Create new request with abort controller
    const abortController = useAbortSignal ? new AbortController() : undefined
    const promise = requestFn(abortController?.signal)
      .finally(() => {
        this.pendingRequests.delete(key)
      })

    // Store pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
      abortController
    })

    this.incrementRequestCount(key)
    return promise
  }

  // Generate cache key for tennis-specific requests
  static generateKey(type: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    
    return `${type}:${sortedParams}`
  }

  // Tennis-specific request keys
  static keys = {
    match: (matchId: string) => `match:${matchId}`,
    matchesByUser: (userId: string, page?: number, limit?: number) => 
      `matchesByUser:${userId}:${page || 0}:${limit || 20}`,
    matchesByPlayer: (playerId: string) => `matchesByPlayer:${playerId}`,
    player: (playerId: string) => `player:${playerId}`,
    playersByUser: (userId: string, page?: number, limit?: number) => 
      `playersByUser:${userId}:${page || 0}:${limit || 20}`,
    playersByIds: (playerIds: string[]) => `playersByIds:${playerIds.sort().join(',')}`,
    matchStats: (matchId: string) => `matchStats:${matchId}`,
    playerStats: (playerId: string, timeframe?: string) => 
      `playerStats:${playerId}:${timeframe || 'all'}`,
    recentMatches: (limit: number = 10) => `recentMatches:${limit}`,
    playerComparisons: (playerId: string) => `playerComparisons:${playerId}`
  }

  // Cancel all pending requests (useful for cleanup)
  cancelAll(): void {
    for (const [key, pending] of this.pendingRequests.entries()) {
      if (pending.abortController) {
        pending.abortController.abort()
      }
    }
    this.pendingRequests.clear()
  }

  // Cancel requests matching a pattern
  cancelByPattern(pattern: string): void {
    for (const [key, pending] of this.pendingRequests.entries()) {
      if (key.includes(pattern)) {
        if (pending.abortController) {
          pending.abortController.abort()
        }
        this.pendingRequests.delete(key)
      }
    }
  }

  // Get statistics about request deduplication
  getStats() {
    const totalRequests = Array.from(this.requestCounts.values())
      .reduce((sum, count) => sum + count, 0)
    
    const deduplicatedRequests = Array.from(this.requestCounts.values())
      .reduce((sum, count) => sum + Math.max(0, count - 1), 0)

    return {
      totalRequests,
      deduplicatedRequests,
      savingsRatio: totalRequests > 0 ? deduplicatedRequests / totalRequests : 0,
      pendingRequests: this.pendingRequests.size,
      requestsByType: this.getRequestsByType()
    }
  }

  private incrementRequestCount(key: string): void {
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1)
  }

  private getRequestsByType(): Record<string, number> {
    const byType: Record<string, number> = {}
    
    for (const [key, count] of this.requestCounts.entries()) {
      const type = key.split(':')[0]
      byType[type] = (byType[type] || 0) + count
    }
    
    return byType
  }
}

// Wrapper functions for common tennis requests
export const dedupeRequest = RequestDeduper.getInstance().dedupe.bind(RequestDeduper.getInstance())
export const requestKeys = RequestDeduper.keys

// React hook for using deduplicated requests
import { useCallback, useRef } from 'react'

export function useDeduplicatedRequest() {
  const deduper = useRef(RequestDeduper.getInstance())
  
  const dedupe = useCallback(<T>(
    key: string,
    requestFn: (signal?: AbortSignal) => Promise<T>,
    options?: { timeout?: number; useAbortSignal?: boolean }
  ) => {
    return deduper.current.dedupe(key, requestFn, options)
  }, [])

  const cancelPattern = useCallback((pattern: string) => {
    deduper.current.cancelByPattern(pattern)
  }, [])

  const getStats = useCallback(() => {
    return deduper.current.getStats()
  }, [])

  return {
    dedupe,
    cancelPattern,
    getStats,
    keys: requestKeys
  }
}