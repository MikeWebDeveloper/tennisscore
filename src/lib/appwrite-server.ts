"use server";

import { Client, Account, Databases, Storage, Users } from "node-appwrite"
import { getSession } from "./session"
import { withResult, withRetry as withRetryResult, Result, AppwriteErrorHandler } from "./utils/error-handler"

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
  baseDelay = 1000,
  context: Record<string, any> = {}
): Promise<T> {
  const result = await withRetryResult(operation, maxRetries, context)
  
  if (result.isError()) {
    const error = result.getError()!
    throw new Error(`${error.message} (${error.type})`)
  }
  
  return result.getValue()!
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