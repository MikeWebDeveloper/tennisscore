"use server";

import { Client, Account, Databases, Storage, Users } from "node-appwrite"
import { getSession } from "./session"

// Enhanced client configuration with better timeout handling
function createClientWithRetry() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
    .setKey(process.env.APPWRITE_API_KEY!)

  return client
}

// Create session-based client for user operations
function createSessionClientWithToken(sessionToken: string) {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
    .setSession(sessionToken) // Use session token instead of API key

  return client
}

import { RetryConfig, RETRY_CONFIGS } from "./retry-config"

// Utility function for retrying operations with configurable strategies
export async function withRetry<T>(
  operation: () => Promise<T>, 
  config: RetryConfig | keyof typeof RETRY_CONFIGS = 'BACKGROUND'
): Promise<T> {
  // Handle both config object and config name
  const retryConfig = typeof config === 'string' ? RETRY_CONFIGS[config] : config
  const { maxRetries, baseDelay, maxTimeout } = retryConfig
  
  let lastError: Error | null = null
  const startTime = Date.now()
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check if we've exceeded max timeout
      if (Date.now() - startTime > maxTimeout) {
        throw new Error(`Operation timed out after ${maxTimeout}ms`)
      }
      
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 
          Math.min(5000, maxTimeout - (Date.now() - startTime)))
      })
      
      // Race between operation and timeout
      return await Promise.race([operation(), timeoutPromise])
    } catch (error: unknown) {
      lastError = error as Error
      
      // Enhanced error handling for different types
      if (error && typeof error === 'object') {
        const err = error as { code?: number | string; type?: string; message?: string; cause?: { code?: string } }
        
        // Handle network errors specifically
        if (err.cause?.code === 'ECONNRESET' || 
            err.cause?.code === 'ETIMEDOUT' || 
            err.cause?.code === 'ENOTFOUND' ||
            err.message?.includes('fetch failed') ||
            err.message?.includes('network') ||
            err.message?.includes('timeout')) {
          console.log(`🔄 Network error detected (${err.cause?.code || err.message || 'fetch failed'}), will retry...`)
          // Continue to retry logic
        } else if (err.code === 401 || err.code === 403 || err.type === 'general_unauthorized_scope') {
          // Don't retry on auth/permission errors
          throw error
        } else if (err.code === 400 && err.type !== 'general_rate_limit_exceeded') {
          // Don't retry on validation errors (except rate limits)
          throw error
        }
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        console.error(`❌ Operation failed after ${maxRetries + 1} attempts:`, lastError?.message)
        throw lastError
      }
      
      // Check if we have time for another retry
      const elapsedTime = Date.now() - startTime
      if (elapsedTime >= maxTimeout) {
        console.error(`❌ Operation exceeded timeout of ${maxTimeout}ms`)
        throw new Error(`Operation timed out after ${elapsedTime}ms`)
      }
      
      // Calculate delay with exponential backoff (but limited)
      const delay = Math.min(baseDelay * Math.pow(1.5, attempt), 2000) // Cap at 2 seconds
      const remainingTime = maxTimeout - elapsedTime
      const actualDelay = Math.min(delay, remainingTime - 1000) // Leave 1s for the operation
      
      if (actualDelay <= 0) {
        throw new Error(`Operation timed out after ${elapsedTime}ms`)
      }
      
      console.warn(`⚠️  Attempt ${attempt + 1} failed, retrying in ${Math.round(actualDelay)}ms...`, (error as Error)?.message)
      
      await new Promise(resolve => setTimeout(resolve, actualDelay))
    }
  }
  
  throw lastError
}

export async function createSessionClient() {
  const sessionData = await getSession()

  if (!sessionData) {
    throw new Error("No session")
  }

  // We need the actual JWT token from cookies, not just the session data
  const { cookies } = await import("next/headers")
  const sessionToken = (await cookies()).get("session")?.value

  if (!sessionToken) {
    throw new Error("No session token")
  }

  const client = createSessionClientWithToken(sessionToken)

  return {
    get account() {
      return new Account(client)
    },
    get databases() {
      return new Databases(client)
    },
    get storage() {
      return new Storage(client)
    },
    get users() {
      return new Users(client)
    },
    userId: sessionData.userId,
  }
}

export async function createAdminClient() {
  const client = createClientWithRetry()

  return {
    get account() {
      return new Account(client)
    },
    get databases() {
      return new Databases(client)
    },
    get storage() {
      return new Storage(client)
    },
    get users() {
      return new Users(client)
    },
  }
} 