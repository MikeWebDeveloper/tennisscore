/**
 * IndexedDB storage utilities for offline data caching
 * Provides persistent storage for matches, players, and other app data
 */

const DB_NAME = 'TennisScoreApp'
const DB_VERSION = 2 // Increment version to trigger upgrade

// Store names
export const STORES = {
  MATCHES: 'matches',
  PLAYERS: 'players',
  USERS: 'users',
  CACHE: 'cache'
} as const

type StoreNames = typeof STORES[keyof typeof STORES]

interface CacheEntry<T = any> {
  id: string
  data: T
  timestamp: number
  expiresAt?: number
}

class IndexedDBManager {
  private db: IDBDatabase | null = null
  private dbPromise: Promise<IDBDatabase> | null = null

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db
    if (this.dbPromise) return this.dbPromise

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Matches store
        if (!db.objectStoreNames.contains(STORES.MATCHES)) {
          const matchStore = db.createObjectStore(STORES.MATCHES, { keyPath: '$id' })
          // Create separate indexes for each player ID instead of array with multiEntry
          matchStore.createIndex('playerOneId', 'playerOneId')
          matchStore.createIndex('playerTwoId', 'playerTwoId')
          matchStore.createIndex('playerThreeId', 'playerThreeId')
          matchStore.createIndex('playerFourId', 'playerFourId')
          matchStore.createIndex('matchDate', 'matchDate')
          matchStore.createIndex('status', 'status')
          matchStore.createIndex('userId', 'userId')
        }

        // Players store
        if (!db.objectStoreNames.contains(STORES.PLAYERS)) {
          const playerStore = db.createObjectStore(STORES.PLAYERS, { keyPath: '$id' })
          playerStore.createIndex('firstName', 'firstName')
          playerStore.createIndex('lastName', 'lastName')
          playerStore.createIndex('userId', 'userId')
        }

        // Users store
        if (!db.objectStoreNames.contains(STORES.USERS)) {
          db.createObjectStore(STORES.USERS, { keyPath: '$id' })
        }

        // Cache store for computed data
        if (!db.objectStoreNames.contains(STORES.CACHE)) {
          const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: 'id' })
          cacheStore.createIndex('expiresAt', 'expiresAt')
        }
      }
    })

    return this.dbPromise
  }

  async getStore(storeName: StoreNames, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.init()
    const transaction = db.transaction(storeName, mode)
    return transaction.objectStore(storeName)
  }

  // Generic CRUD operations
  async get<T>(storeName: StoreNames, key: string): Promise<T | null> {
    try {
      const store = await this.getStore(storeName)
      const request = store.get(key)
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error(`IndexedDB get error:`, error)
      return null
    }
  }

  async getAll<T>(storeName: StoreNames): Promise<T[]> {
    try {
      const store = await this.getStore(storeName)
      const request = store.getAll()
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error(`IndexedDB getAll error:`, error)
      return []
    }
  }

  async put<T>(storeName: StoreNames, data: T): Promise<boolean> {
    try {
      const store = await this.getStore(storeName, 'readwrite')
      const request = store.put(data)
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(true)
        request.onerror = () => {
          console.error(`IndexedDB put error:`, request.error)
          resolve(false)
        }
      })
    } catch (error) {
      console.error(`IndexedDB put error:`, error)
      return false
    }
  }

  async putMany<T>(storeName: StoreNames, items: T[]): Promise<boolean> {
    try {
      const store = await this.getStore(storeName, 'readwrite')
      const promises = items.map(item => {
        const request = store.put(item)
        return new Promise<boolean>((resolve) => {
          request.onsuccess = () => resolve(true)
          request.onerror = () => resolve(false)
        })
      })

      const results = await Promise.all(promises)
      return results.every(Boolean)
    } catch (error) {
      console.error(`IndexedDB putMany error:`, error)
      return false
    }
  }

  async delete(storeName: StoreNames, key: string): Promise<boolean> {
    try {
      const store = await this.getStore(storeName, 'readwrite')
      const request = store.delete(key)
      
      return new Promise((resolve) => {
        request.onsuccess = () => resolve(true)
        request.onerror = () => resolve(false)
      })
    } catch (error) {
      console.error(`IndexedDB delete error:`, error)
      return false
    }
  }

  // Cache-specific methods
  async setCache<T>(key: string, data: T, ttlMinutes?: number): Promise<boolean> {
    const cacheEntry: CacheEntry<T> = {
      id: key,
      data,
      timestamp: Date.now(),
      expiresAt: ttlMinutes ? Date.now() + (ttlMinutes * 60 * 1000) : undefined
    }

    return this.put(STORES.CACHE, cacheEntry)
  }

  async getCache<T>(key: string): Promise<T | null> {
    try {
      const entry = await this.get<CacheEntry<T>>(STORES.CACHE, key)
      if (!entry) return null

      // Check if cache has expired
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        await this.delete(STORES.CACHE, key)
        return null
      }

      return entry.data
    } catch (error) {
      console.error('Error getting cache:', error)
      return null
    }
  }

  async clearExpiredCache(): Promise<void> {
    try {
      const store = await this.getStore(STORES.CACHE, 'readwrite')
      const index = store.index('expiresAt')
      const request = index.openCursor(IDBKeyRange.upperBound(Date.now()))

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        }
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error)
    }
  }

  // Query methods
  async getByIndex<T>(storeName: StoreNames, indexName: string, value: any): Promise<T[]> {
    try {
      const store = await this.getStore(storeName)
      const index = store.index(indexName)
      const request = index.getAll(value)
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error(`IndexedDB getByIndex error:`, error)
      return []
    }
  }

  // New method to get matches by player ID (handles both playerOneId and playerTwoId)
  async getMatchesByPlayerId(playerId: string): Promise<any[]> {
    try {
      const matches1 = await this.getByIndex(STORES.MATCHES, 'playerOneId', playerId)
      const matches2 = await this.getByIndex(STORES.MATCHES, 'playerTwoId', playerId)
      const matches3 = await this.getByIndex(STORES.MATCHES, 'playerThreeId', playerId)
      const matches4 = await this.getByIndex(STORES.MATCHES, 'playerFourId', playerId)
      
      // Combine and deduplicate matches
      const allMatches = [...matches1, ...matches2, ...matches3, ...matches4]
      const uniqueMatches = allMatches.filter((match, index, self) => 
        index === self.findIndex(m => (m as any).$id === (match as any).$id)
      )
      
      return uniqueMatches
    } catch (error) {
      console.error('Error getting matches by player ID:', error)
      return []
    }
  }
}

// Singleton instance
export const indexedDBManager = new IndexedDBManager()

// Utility functions for common operations
export async function cacheMatches(matches: any[]): Promise<boolean> {
  return indexedDBManager.putMany(STORES.MATCHES, matches)
}

export async function getCachedMatches(): Promise<any[]> {
  return indexedDBManager.getAll(STORES.MATCHES)
}

export async function cachePlayers(players: any[]): Promise<boolean> {
  return indexedDBManager.putMany(STORES.PLAYERS, players)
}

export async function getCachedPlayers(): Promise<any[]> {
  return indexedDBManager.getAll(STORES.PLAYERS)
}

export async function getCachedUser(userId: string): Promise<any | null> {
  return indexedDBManager.get(STORES.USERS, userId)
}

export async function cacheUser(user: any): Promise<boolean> {
  return indexedDBManager.put(STORES.USERS, user)
}

// Initialize and clear expired cache on load
export async function initializeOfflineStorage(): Promise<void> {
  try {
    await indexedDBManager.init()
    await indexedDBManager.clearExpiredCache()
  } catch (error) {
    console.error('Failed to initialize offline storage:', error)
  }
}

// Check if IndexedDB is supported
export const isIndexedDBSupported = (): boolean => {
  return typeof indexedDB !== 'undefined'
}