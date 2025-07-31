'use server'

/**
 * Optimized Appwrite Server Client for Tennis Scoring App
 * Only imports server-side services we actually use
 * Includes retry logic and session management
 */

import type { ServerServices, SessionClient, AppwriteConfig } from './types'
import { getSession } from '../session'

// Lazy imports to reduce server bundle size
let _Client: typeof import('node-appwrite').Client | null = null
let _Account: typeof import('node-appwrite').Account | null = null
let _Databases: typeof import('node-appwrite').Databases | null = null
let _Storage: typeof import('node-appwrite').Storage | null = null
let _Users: typeof import('node-appwrite').Users | null = null

// Configuration
const config: AppwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  project: process.env.NEXT_PUBLIC_APPWRITE_PROJECT!,
  apiKey: process.env.APPWRITE_API_KEY!,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  playersCollectionId: process.env.NEXT_PUBLIC_APPWRITE_PLAYERS_COLLECTION_ID!,
  matchesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID!,
  usersCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
  profilePicturesBucketId: process.env.NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID!
}

/**
 * Create admin client with API key
 */
function createAdminClientInstance(): import('node-appwrite').Client {
  if (!_Client) {
    _Client = require('node-appwrite').Client
  }
  
  if (!_Client) {
    throw new Error('Failed to load Appwrite Client')
  }
  
  return new _Client()
    .setEndpoint(config.endpoint)
    .setProject(config.project)
    .setKey(config.apiKey!)
}

/**
 * Create session client with user token
 */
function createSessionClientInstance(sessionToken: string): import('node-appwrite').Client {
  if (!_Client) {
    _Client = require('node-appwrite').Client
  }
  
  if (!_Client) {
    throw new Error('Failed to load Appwrite Client')
  }
  
  return new _Client()
    .setEndpoint(config.endpoint)
    .setProject(config.project)
    .setSession(sessionToken)
}

/**
 * Retry configuration for different scenarios
 */
export const RETRY_CONFIGS = {
  IMMEDIATE: { maxRetries: 1, baseDelay: 100, maxTimeout: 5000 },
  BACKGROUND: { maxRetries: 3, baseDelay: 1000, maxTimeout: 15000 },
  CRITICAL: { maxRetries: 5, baseDelay: 500, maxTimeout: 30000 }
} as const

export type RetryConfig = typeof RETRY_CONFIGS[keyof typeof RETRY_CONFIGS]

/**
 * Enhanced retry utility with tennis-specific error handling
 */
export async function withRetry<T>(
  operation: () => Promise<T>, 
  config: RetryConfig | keyof typeof RETRY_CONFIGS = 'BACKGROUND'
): Promise<T> {
  const retryConfig = typeof config === 'string' ? RETRY_CONFIGS[config] : config
  const { maxRetries, baseDelay, maxTimeout } = retryConfig
  
  let lastError: Error | null = null
  const startTime = Date.now()
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check timeout
      if (Date.now() - startTime > maxTimeout) {
        throw new Error(`Operation timed out after ${maxTimeout}ms`)
      }
      
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 
          Math.min(5000, maxTimeout - (Date.now() - startTime)))
      })
      
      return await Promise.race([operation(), timeoutPromise])
    } catch (error: unknown) {
      lastError = error as Error
      
      // Enhanced error handling
      if (error && typeof error === 'object') {
        const err = error as { code?: number | string; type?: string; message?: string; cause?: { code?: string } }
        
        // Network errors - retry
        if (err.cause?.code === 'ECONNRESET' || 
            err.cause?.code === 'ETIMEDOUT' || 
            err.cause?.code === 'ENOTFOUND' ||
            err.message?.includes('fetch failed') ||
            err.message?.includes('network') ||
            err.message?.includes('timeout')) {
          // Continue to retry logic
        } 
        // Auth/permission errors - don't retry
        else if (err.code === 401 || err.code === 403 || err.type === 'general_unauthorized_scope') {
          throw error
        } 
        // Validation errors (except rate limits) - don't retry
        else if (err.code === 400 && err.type !== 'general_rate_limit_exceeded') {
          throw error
        }
      }
      
      // Last attempt - throw error
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Check remaining time
      const elapsedTime = Date.now() - startTime
      if (elapsedTime >= maxTimeout) {
        throw new Error(`Operation timed out after ${elapsedTime}ms`)
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(1.5, attempt), 2000)
      const remainingTime = maxTimeout - elapsedTime
      const actualDelay = Math.min(delay, remainingTime - 1000)
      
      if (actualDelay <= 0) {
        throw new Error(`Operation timed out after ${elapsedTime}ms`)
      }
      
      await new Promise(resolve => setTimeout(resolve, actualDelay))
    }
  }
  
  throw lastError
}

/**
 * Create admin client with all services
 */
export async function createAdminClient(): Promise<ServerServices> {
  const client = createAdminClientInstance()

  // Lazy load services only when accessed
  const services = {
    get account() {
      if (!_Account) _Account = require('node-appwrite').Account
      if (!_Account) throw new Error('Failed to load Appwrite Account')
      return new _Account(client)
    },
    get databases() {
      if (!_Databases) _Databases = require('node-appwrite').Databases
      if (!_Databases) throw new Error('Failed to load Appwrite Databases')
      return new _Databases(client)
    },
    get storage() {
      if (!_Storage) _Storage = require('node-appwrite').Storage
      if (!_Storage) throw new Error('Failed to load Appwrite Storage')
      return new _Storage(client)
    },
    get users() {
      if (!_Users) _Users = require('node-appwrite').Users
      if (!_Users) throw new Error('Failed to load Appwrite Users')
      return new _Users(client)
    }
  }

  return services
}

/**
 * Create session-based client for user operations
 */
export async function createSessionClient(): Promise<SessionClient> {
  const sessionData = await getSession()

  if (!sessionData) {
    throw new Error("No session")
  }

  // Get JWT token from cookies
  const { cookies } = await import("next/headers")
  const sessionToken = (await cookies()).get("session")?.value

  if (!sessionToken) {
    throw new Error("No session token")
  }

  const client = createSessionClientInstance(sessionToken)

  const services = {
    get account() {
      if (!_Account) _Account = require('node-appwrite').Account
      if (!_Account) throw new Error('Failed to load Appwrite Account')
      return new _Account(client)
    },
    get databases() {
      if (!_Databases) _Databases = require('node-appwrite').Databases
      if (!_Databases) throw new Error('Failed to load Appwrite Databases')
      return new _Databases(client)
    },
    get storage() {
      if (!_Storage) _Storage = require('node-appwrite').Storage
      if (!_Storage) throw new Error('Failed to load Appwrite Storage')
      return new _Storage(client)
    },
    get users() {
      if (!_Users) _Users = require('node-appwrite').Users
      if (!_Users) throw new Error('Failed to load Appwrite Users')
      return new _Users(client)
    },
    userId: sessionData.userId,
  }

  return services
}

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

// Export config for external access
export { config }