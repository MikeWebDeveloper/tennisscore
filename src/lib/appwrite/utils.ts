/**
 * Optimized Appwrite Utilities
 * Tree-shakeable exports for commonly used utilities
 */

// Dynamic imports to reduce initial bundle size
let _Query: typeof import('node-appwrite').Query | null = null
let _ID: typeof import('node-appwrite').ID | null = null
let _AppwriteException: typeof import('node-appwrite').AppwriteException | null = null

// Client-side utilities (smaller bundle)
let _ClientQuery: typeof import('appwrite').Query | null = null

/**
 * Lazy-loaded Query utility for server-side operations
 */
export const Query = new Proxy({} as typeof import('node-appwrite').Query, {
  get(target, prop) {
    if (!_Query) {
      // Only import when actually used
      _Query = require('node-appwrite').Query
    }
    if (!_Query) {
      throw new Error('Failed to load node-appwrite Query')
    }
    return _Query[prop as keyof typeof _Query]
  }
})

/**
 * Lazy-loaded Query utility for client-side operations
 */
export const ClientQuery = new Proxy({} as typeof import('appwrite').Query, {
  get(target, prop) {
    if (!_ClientQuery) {
      // Only import when actually used
      _ClientQuery = require('appwrite').Query
    }
    if (!_ClientQuery) {
      throw new Error('Failed to load appwrite Query')
    }
    return _ClientQuery[prop as keyof typeof _ClientQuery]
  }
})

/**
 * Lazy-loaded ID utility
 */
export const ID = new Proxy({} as typeof import('node-appwrite').ID, {
  get(target, prop) {
    if (!_ID) {
      _ID = require('node-appwrite').ID
    }
    if (!_ID) {
      throw new Error('Failed to load node-appwrite ID')
    }
    return _ID[prop as keyof typeof _ID]
  }
})

/**
 * Lazy-loaded AppwriteException
 */
export const AppwriteException = new Proxy({} as typeof import('node-appwrite').AppwriteException, {
  get(target, prop) {
    if (!_AppwriteException) {
      _AppwriteException = require('node-appwrite').AppwriteException
    }
    if (!_AppwriteException) {
      throw new Error('Failed to load node-appwrite AppwriteException')
    }
    return _AppwriteException[prop as keyof typeof _AppwriteException]
  }
})

// Commonly used query helpers (tennis-specific)
export const TennisQueries = {
  /**
   * Get matches for a specific player
   */
  getPlayerMatches: (playerId: string) => [
    Query.or([
      Query.equal('player1Id', playerId),
      Query.equal('player2Id', playerId)
    ])
  ],
  
  /**
   * Get active/live matches
   */
  getLiveMatches: () => [
    Query.equal('status', 'live')
  ],
  
  /**
   * Get recent matches with limit
   */
  getRecentMatches: (limit = 10) => [
    Query.orderDesc('$createdAt'),
    Query.limit(limit)
  ],
  
  /**
   * Search players by name
   */
  searchPlayers: (searchTerm: string) => [
    Query.search('name', searchTerm)
  ]
}

// Performance optimized batch operations
export const BatchQueries = {
  /**
   * Create multiple queries efficiently
   */
  batch: (...queries: any[][]) => queries.flat(),
  
  /**
   * Pagination helper
   */
  paginate: (offset: number, limit: number = 25) => [
    Query.offset(offset),
    Query.limit(limit)
  ]
}