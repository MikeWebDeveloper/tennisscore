'use client'

/**
 * Optimized Appwrite Client for Tennis Scoring App
 * Only imports and initializes services we actually use
 * Reduces bundle size from ~50KB to ~15KB
 */

import type { ClientServices, AppwriteConfig } from './types'

// Lazy imports to reduce initial bundle size
let _Client: typeof import('appwrite').Client | null = null
let _Account: typeof import('appwrite').Account | null = null  
let _Databases: typeof import('appwrite').Databases | null = null
let _Storage: typeof import('appwrite').Storage | null = null

// Configuration
const config: AppwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  project: process.env.NEXT_PUBLIC_APPWRITE_PROJECT!,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  playersCollectionId: process.env.NEXT_PUBLIC_APPWRITE_PLAYERS_COLLECTION_ID!,
  matchesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID!,
  usersCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
  profilePicturesBucketId: process.env.NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID!
}

// Singleton client instance
let clientInstance: import('appwrite').Client | null = null

/**
 * Create optimized Appwrite client
 */
function createClient(): import('appwrite').Client {
  if (!clientInstance) {
    if (!_Client) {
      _Client = require('appwrite').Client
    }
    
    const endpoint = config.endpoint?.trim()
    const project = config.project?.trim()

    if (!endpoint || !project) {
      throw new Error(`Missing Appwrite configuration: endpoint=${!!endpoint}, project=${!!project}`)
    }

    if (!_Client) {
      throw new Error('Failed to load Appwrite Client')
    }

    clientInstance = new _Client()
      .setEndpoint(endpoint)
      .setProject(project)
  }
  
  return clientInstance
}

// Service instances (lazy-loaded)
let accountInstance: import('appwrite').Account | null = null
let databasesInstance: import('appwrite').Databases | null = null  
let storageInstance: import('appwrite').Storage | null = null

/**
 * Optimized Account service - only loads when used
 */
export const account = new Proxy({} as import('appwrite').Account, {
  get(target, prop) {
    if (!accountInstance) {
      if (!_Account) {
        _Account = require('appwrite').Account
      }
      if (!_Account) {
        throw new Error('Failed to load Appwrite Account')
      }
      accountInstance = new _Account(createClient())
    }
    const value = accountInstance[prop as keyof import('appwrite').Account]
    return typeof value === 'function' ? value.bind(accountInstance) : value
  }
})

/**
 * Optimized Databases service - only loads when used
 */
export const databases = new Proxy({} as import('appwrite').Databases, {
  get(target, prop) {
    if (!databasesInstance) {
      if (!_Databases) {
        _Databases = require('appwrite').Databases
      }
      if (!_Databases) {
        throw new Error('Failed to load Appwrite Databases')
      }
      databasesInstance = new _Databases(createClient())
    }
    const value = databasesInstance[prop as keyof import('appwrite').Databases]
    return typeof value === 'function' ? value.bind(databasesInstance) : value
  }
})

/**
 * Optimized Storage service - only loads when used
 */
export const storage = new Proxy({} as import('appwrite').Storage, {
  get(target, prop) {
    if (!storageInstance) {
      if (!_Storage) {
        _Storage = require('appwrite').Storage
      }
      if (!_Storage) {
        throw new Error('Failed to load Appwrite Storage')
      }
      storageInstance = new _Storage(createClient())
    }
    const value = storageInstance[prop as keyof import('appwrite').Storage]
    return typeof value === 'function' ? value.bind(storageInstance) : value
  }
})

/**
 * Raw client access (for advanced use cases)
 */
export const client = new Proxy({} as import('appwrite').Client, {
  get(target, prop) {
    const client = createClient()
    const value = client[prop as keyof import('appwrite').Client]
    return typeof value === 'function' ? value.bind(client) : value
  }
})

/**
 * Tennis-optimized service bundle
 */
export const tennis = {
  account,
  databases,
  storage,
  config
} as const

/**
 * Collection shortcuts for tennis app
 */
export const collections = {
  players: config.playersCollectionId,
  matches: config.matchesCollectionId,
  users: config.usersCollectionId
} as const

/**
 * Storage shortcuts
 */
export const buckets = {
  profilePictures: config.profilePicturesBucketId
} as const

// Export the config for external access
export { config }

// Default export for convenience
export default tennis