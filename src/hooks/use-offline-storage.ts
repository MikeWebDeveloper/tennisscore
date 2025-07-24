"use client"

import { useEffect, useState } from 'react'
import { 
  indexedDBManager, 
  initializeOfflineStorage, 
  isIndexedDBSupported,
  cacheMatches,
  getCachedMatches,
  cachePlayers,
  getCachedPlayers,
  cacheUser,
  getCachedUser
} from '@/lib/utils/indexeddb-storage'
import { Match, Player, User } from '@/lib/types'

interface OfflineStorageState {
  isSupported: boolean
  isInitialized: boolean
  isOnline: boolean
  lastSync: Date | null
}

export function useOfflineStorage() {
  const [state, setState] = useState<OfflineStorageState>({
    isSupported: false,
    isInitialized: false,
    isOnline: true,
    lastSync: null
  })

  useEffect(() => {
    const initStorage = async () => {
      if (!isIndexedDBSupported()) {
        setState(prev => ({ ...prev, isSupported: false }))
        return
      }

      try {
        await initializeOfflineStorage()
        setState(prev => ({ 
          ...prev, 
          isSupported: true, 
          isInitialized: true 
        }))
      } catch (error) {
        console.error('Failed to initialize offline storage:', error)
        setState(prev => ({ ...prev, isSupported: false }))
      }
    }

    initStorage()

    // Monitor online/offline status
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const syncMatches = async (matches: Match[]): Promise<boolean> => {
    if (!state.isInitialized) return false
    
    try {
      const success = await cacheMatches(matches)
      if (success) {
        setState(prev => ({ ...prev, lastSync: new Date() }))
      }
      return success
    } catch (error) {
      console.error('Failed to sync matches:', error)
      return false
    }
  }

  const getOfflineMatches = async (): Promise<Match[]> => {
    if (!state.isInitialized) return []
    
    try {
      return await getCachedMatches()
    } catch (error) {
      console.error('Failed to get offline matches:', error)
      return []
    }
  }

  const getOfflineMatchesByPlayer = async (playerId: string): Promise<Match[]> => {
    if (!state.isInitialized) return []
    
    try {
      return await indexedDBManager.getMatchesByPlayerId(playerId)
    } catch (error) {
      console.error('Failed to get offline matches by player:', error)
      return []
    }
  }

  const syncPlayer = async (player: Player): Promise<boolean> => {
    if (!state.isInitialized) return false
    
    try {
      return await indexedDBManager.put('players', player)
    } catch (error) {
      console.error('Failed to sync player:', error)
      return false
    }
  }

  const getOfflinePlayers = async (): Promise<Player[]> => {
    if (!state.isInitialized) return []
    
    try {
      return await getCachedPlayers()
    } catch (error) {
      console.error('Failed to get offline players:', error)
      return []
    }
  }

  const syncUser = async (user: User): Promise<boolean> => {
    if (!state.isInitialized) return false
    
    try {
      return await cacheUser(user)
    } catch (error) {
      console.error('Failed to sync user:', error)
      return false
    }
  }

  const getOfflineUser = async (userId: string): Promise<User | null> => {
    if (!state.isInitialized) return null
    
    try {
      return await getCachedUser(userId)
    } catch (error) {
      console.error('Failed to get offline user:', error)
      return null
    }
  }

  const setCache = async <T>(key: string, data: T, ttlMinutes?: number): Promise<boolean> => {
    if (!state.isInitialized) return false
    
    try {
      return await indexedDBManager.setCache(key, data, ttlMinutes)
    } catch (error) {
      console.error('Failed to set cache:', error)
      return false
    }
  }

  const getCache = async <T>(key: string): Promise<T | null> => {
    if (!state.isInitialized) return null
    
    try {
      return await indexedDBManager.getCache<T>(key)
    } catch (error) {
      console.error('Failed to get cache:', error)
      return null
    }
  }

  return {
    // State
    isSupported: state.isSupported,
    isInitialized: state.isInitialized,
    isOnline: state.isOnline,
    lastSync: state.lastSync,
    
    // Matches
    syncMatches,
    getOfflineMatches,
    getOfflineMatchesByPlayer,
    
    // Players
    syncPlayer,
    getOfflinePlayers,
    
    // Users
    syncUser,
    getOfflineUser,
    
    // Cache
    setCache,
    getCache
  }
}