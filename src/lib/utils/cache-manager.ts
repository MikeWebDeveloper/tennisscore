/**
 * Cache Manager for TennisScore Application
 * Provides in-memory caching with TTL and automatic invalidation
 */

interface CacheEntry<T> {
  value: T
  timestamp: number
  ttl: number
}

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  evictions: number
  size: number
}

class CacheManager {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, evictions: 0, size: 0 }
  private maxSize: number = 1000 // Maximum cache entries
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start cleanup interval to remove expired entries
    this.startCleanupInterval()
  }

  /**
   * Get a cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.stats.evictions++
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return entry.value
  }

  /**
   * Set a cached value with TTL
   */
  set<T>(key: string, value: T, ttlMs: number = 300000): void { // Default 5 minutes
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
        this.stats.evictions++
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttlMs
    })

    this.stats.sets++
    this.stats.size = this.cache.size
  }

  /**
   * Delete a cached value
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    this.stats.size = this.cache.size
    return deleted
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.stats.size = 0
    this.stats.evictions += this.stats.size
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses
    return total > 0 ? this.stats.hits / total : 0
  }

  /**
   * Clear entries matching a pattern
   */
  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    this.stats.size = this.cache.size
  }

  /**
   * Start cleanup interval to remove expired entries
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000) // Clean up every minute
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key)
      this.stats.evictions++
    })

    this.stats.size = this.cache.size
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Cache durations (in milliseconds)
export const CACHE_DURATIONS = {
  PLAYER_DATA: 30 * 60 * 1000, // 30 minutes
  MATCH_DATA: 15 * 60 * 1000, // 15 minutes
  PLAYER_STATS: 30 * 60 * 1000, // 30 minutes
  DASHBOARD_STATS: 10 * 60 * 1000, // 10 minutes
  MATCH_STATS: 30 * 60 * 1000, // 30 minutes
  LIVE_MATCH: 0, // No caching for live matches
  USER_PREFERENCES: 60 * 60 * 1000, // 1 hour
} as const

// Global cache instance
export const cacheManager = new CacheManager()

/**
 * Cache key generators
 */
export const CACHE_KEYS = {
  PLAYER: (playerId: string) => `player:${playerId}`,
  PLAYERS_BY_USER: (userId: string) => `players:user:${userId}`,
  MATCH: (matchId: string) => `match:${matchId}`,
  MATCHES_BY_USER: (userId: string) => `matches:user:${userId}`,
  MATCHES_BY_PLAYER: (playerId: string) => `matches:player:${playerId}`,
  PLAYER_STATS: (playerId: string) => `stats:player:${playerId}`,
  DASHBOARD_STATS: (userId: string) => `stats:dashboard:${userId}`,
  MAIN_PLAYER: (userId: string) => `main-player:${userId}`,
  BATCH_PLAYERS: (playerIds: string[]) => `batch-players:${playerIds.sort().join(',')}`,
} as const

/**
 * Cache invalidation helpers
 */
export const CACHE_INVALIDATION = {
  onPlayerUpdate: (playerId: string, userId: string) => {
    cacheManager.delete(CACHE_KEYS.PLAYER(playerId))
    cacheManager.delete(CACHE_KEYS.PLAYERS_BY_USER(userId))
    cacheManager.delete(CACHE_KEYS.MAIN_PLAYER(userId))
    cacheManager.delete(CACHE_KEYS.PLAYER_STATS(playerId))
    cacheManager.delete(CACHE_KEYS.DASHBOARD_STATS(userId))
    cacheManager.clearPattern(`batch-players:*`)
  },
  
  onMatchUpdate: (matchId: string, userId: string, playerIds: string[]) => {
    cacheManager.delete(CACHE_KEYS.MATCH(matchId))
    cacheManager.delete(CACHE_KEYS.MATCHES_BY_USER(userId))
    cacheManager.delete(CACHE_KEYS.DASHBOARD_STATS(userId))
    
    playerIds.forEach(playerId => {
      cacheManager.delete(CACHE_KEYS.MATCHES_BY_PLAYER(playerId))
      cacheManager.delete(CACHE_KEYS.PLAYER_STATS(playerId))
    })
  },
  
  onMatchCreate: (userId: string, playerIds: string[]) => {
    cacheManager.delete(CACHE_KEYS.MATCHES_BY_USER(userId))
    cacheManager.delete(CACHE_KEYS.DASHBOARD_STATS(userId))
    
    playerIds.forEach(playerId => {
      cacheManager.delete(CACHE_KEYS.MATCHES_BY_PLAYER(playerId))
      cacheManager.delete(CACHE_KEYS.PLAYER_STATS(playerId))
    })
  },
  
  onMatchDelete: (matchId: string, userId: string, playerIds: string[]) => {
    cacheManager.delete(CACHE_KEYS.MATCH(matchId))
    cacheManager.delete(CACHE_KEYS.MATCHES_BY_USER(userId))
    cacheManager.delete(CACHE_KEYS.DASHBOARD_STATS(userId))
    
    playerIds.forEach(playerId => {
      cacheManager.delete(CACHE_KEYS.MATCHES_BY_PLAYER(playerId))
      cacheManager.delete(CACHE_KEYS.PLAYER_STATS(playerId))
    })
  }
} as const

/**
 * Cached function wrapper
 */
export function cached<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  ttl: number = CACHE_DURATIONS.PLAYER_DATA
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args)
    
    // Try to get from cache first
    const cached = cacheManager.get<R>(key)
    if (cached !== null) {
      return cached
    }
    
    // Execute function and cache result
    const result = await fn(...args)
    cacheManager.set(key, result, ttl)
    
    return result
  }
}