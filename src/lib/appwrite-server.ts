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

// Utility function for retrying operations (exported for use in actions)
export async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
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
            err.message?.includes('network')) {
          console.log(`🔄 Network error detected (${err.cause?.code || 'fetch failed'}), will retry...`)
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
      
      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      console.warn(`⚠️  Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`, (error as Error)?.message)
      
      await new Promise(resolve => setTimeout(resolve, delay))
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