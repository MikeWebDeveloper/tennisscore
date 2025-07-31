/**
 * Tennis-Specific Appwrite Optimizations
 * 
 * Performance optimizations tailored for tennis scoring app usage patterns:
 * - Smart caching for frequently accessed data
 * - Batch operations for related queries
 * - Optimized real-time subscriptions
 * - Memory-efficient data structures
 */

import { Query, ID } from './utils'
import type { TennisPlayer, TennisMatch } from './types'

/**
 * Smart caching for tennis data
 */
class TennisCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  set(key: string, data: any, ttlMs = 5 * 60 * 1000) { // 5 min default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }
  
  get(key: string) {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  clear() {
    this.cache.clear()
  }
  
  size() {
    return this.cache.size
  }
}

const tennisCache = new TennisCache()

/**
 * Optimized queries for common tennis operations
 */
export const TennisOptimizations = {
  /**
   * Get player with cached match statistics
   */
  async getPlayerWithStats(
    databases: any,
    databaseId: string,
    playersCollection: string,
    matchesCollection: string,
    playerId: string
  ) {
    const cacheKey = `player:${playerId}:with-stats`
    let cached = tennisCache.get(cacheKey)
    if (cached) return cached
    
    // Parallel fetch player and recent matches
    const [player, recentMatches] = await Promise.all([
      databases.getDocument(databaseId, playersCollection, playerId),
      databases.listDocuments(databaseId, matchesCollection, [
        Query.or([
          Query.equal('player1Id', playerId),
          Query.equal('player2Id', playerId)
        ]),
        Query.orderDesc('$createdAt'),
        Query.limit(20) // Only recent matches for stats
      ])
    ])
    
    const result = { player, recentMatches: recentMatches.documents }
    tennisCache.set(cacheKey, result, 2 * 60 * 1000) // Cache for 2 minutes
    return result
  },
  
  /**
   * Batch load multiple players efficiently
   */
  async getMultiplePlayers(
    databases: any,
    databaseId: string,
    playersCollection: string,
    playerIds: string[]
  ) {
    if (playerIds.length === 0) return []
    
    const cacheKey = `players:batch:${playerIds.sort().join(',')}`
    let cached = tennisCache.get(cacheKey)
    if (cached) return cached
    
    // Use single query instead of multiple getDocument calls
    const result = await databases.listDocuments(databaseId, playersCollection, [
      Query.equal('$id', playerIds),
      Query.limit(playerIds.length)
    ])
    
    tennisCache.set(cacheKey, result.documents, 5 * 60 * 1000)
    return result.documents
  },
  
  /**
   * Get live matches with player details in single query
   */
  async getLiveMatchesWithPlayers(
    databases: any,
    databaseId: string,
    matchesCollection: string,
    playersCollection: string
  ) {
    const cacheKey = 'live-matches:with-players'
    let cached = tennisCache.get(cacheKey)
    if (cached) return cached
    
    const liveMatches = await databases.listDocuments(databaseId, matchesCollection, [
      Query.equal('status', 'live'),
      Query.orderDesc('$updatedAt'),
      Query.limit(10)
    ])
    
    if (liveMatches.documents.length === 0) {
      return []
    }
    
    // Extract unique player IDs
    const playerIds = Array.from(new Set(
      liveMatches.documents.flatMap((match: any) => [match.player1Id, match.player2Id])
    )) as string[]
    
    // Batch load all players
    const players = await this.getMultiplePlayers(
      databases, databaseId, playersCollection, playerIds
    )
    
    // Create player lookup map
    const playerMap = new Map(players.map((p: any) => [p.$id, p]))
    
    // Enhance matches with player data
    const enrichedMatches = liveMatches.documents.map((match: any) => ({
      ...match,
      player1: playerMap.get(match.player1Id),
      player2: playerMap.get(match.player2Id)
    }))
    
    tennisCache.set(cacheKey, enrichedMatches, 30 * 1000) // Cache for 30 seconds (live data)
    return enrichedMatches
  },
  
  /**
   * Optimized search with intelligent caching
   */
  async searchPlayers(
    databases: any,
    databaseId: string,
    playersCollection: string,
    searchTerm: string,
    limit = 10
  ) {
    if (searchTerm.length < 2) return []
    
    const cacheKey = `search:${searchTerm.toLowerCase()}:${limit}`
    let cached = tennisCache.get(cacheKey)
    if (cached) return cached
    
    const result = await databases.listDocuments(databaseId, playersCollection, [
      Query.search('name', searchTerm),
      Query.limit(limit),
      Query.orderAsc('name')
    ])
    
    // Cache search results for 2 minutes
    tennisCache.set(cacheKey, result.documents, 2 * 60 * 1000)
    return result.documents
  },
  
  /**
   * Clear cache when data changes
   */
  invalidateCache: {
    player: (playerId: string) => {
      const keys = Array.from(tennisCache['cache'].keys())
      keys.forEach(key => {
        if (key.includes(`player:${playerId}`) || key.includes('players:batch')) {
          tennisCache['cache'].delete(key)
        }
      })
    },
    
    match: (matchId: string) => {
      const keys = Array.from(tennisCache['cache'].keys())
      keys.forEach(key => {
        if (key.includes('live-matches') || key.includes('with-stats')) {
          tennisCache['cache'].delete(key)
        }
      })
    },
    
    all: () => tennisCache.clear()
  }
}

/**
 * Real-time subscription optimizations
 */
export const RealtimeOptimizations = {
  /**
   * Debounced subscription handler to prevent excessive updates
   */
  createDebouncedHandler<T>(handler: (data: T) => void, delay = 100) {
    let timeoutId: NodeJS.Timeout | null = null
    let latestData: T | null = null
    
    return (data: T) => {
      latestData = data
      
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        if (latestData) {
          handler(latestData)
          latestData = null
        }
        timeoutId = null
      }, delay)
    }
  },
  
  /**
   * Smart subscription that only updates when data actually changes
   */
  createSmartSubscription<T>(
    handler: (data: T) => void,
    equalityCheck: (a: T, b: T) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  ) {
    let lastData: T | null = null
    
    return (data: T) => {
      if (!lastData || !equalityCheck(lastData, data)) {
        lastData = data
        handler(data)
      }
    }
  }
}

/**
 * Memory optimization utilities
 */
export const MemoryOptimizations = {
  /**
   * Cleanup old cache entries to prevent memory leaks
   */
  scheduleCleanup: (intervalMs = 10 * 60 * 1000) => { // 10 minutes
    return setInterval(() => {
      const now = Date.now()
      const entries = Array.from(tennisCache['cache'].entries())
      
      let cleaned = 0
      entries.forEach(([key, entry]) => {
        if (now - entry.timestamp > entry.ttl) {
          tennisCache['cache'].delete(key)
          cleaned++
        }
      })
      
      if (cleaned > 0) {
        console.log(`🧹 Cleaned ${cleaned} expired cache entries`)
      }
    }, intervalMs)
  },
  
  /**
   * Get cache statistics
   */
  getCacheStats: () => ({
    size: tennisCache.size(),
    entries: Array.from(tennisCache['cache'].entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl
    }))
  })
}

// Start automatic cleanup
if (typeof window !== 'undefined') {
  MemoryOptimizations.scheduleCleanup()
}

export { tennisCache }