"use server";

import { Client, Account, Databases, Storage, Users } from "node-appwrite"
import { getSession } from "./session"

// Enhanced client configuration with better timeout handling
function createClientWithRetry() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
    .setKey(process.env.APPWRITE_API_KEY!)

  // Set more aggressive timeouts and connection settings for stability
  client.headers = {
    ...client.headers,
    'X-Appwrite-Request-Timeout': '45', // 45 second timeout
    'Connection': 'keep-alive',
    'Keep-Alive': 'timeout=30, max=100'
  }

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
      
      // Don't retry on certain types of errors
      if (error && typeof error === 'object') {
        const err = error as { code?: number; type?: string; message?: string }
        
        // Don't retry on auth/permission errors
        if (err.code === 401 || err.code === 403 || err.type === 'general_unauthorized_scope') {
          throw error
        }
        
        // Don't retry on validation errors (except rate limits)
        if (err.code === 400 && err.type !== 'general_rate_limit_exceeded') {
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