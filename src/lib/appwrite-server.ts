"use server";

import { Client, Account, Databases, Storage, Users } from "node-appwrite"
import { getSession } from "./session"

// Enhanced client configuration with better timeout handling
function createClientWithRetry() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
    .setKey(process.env.APPWRITE_API_KEY!)

  // Set reasonable timeouts
  client.headers = {
    ...client.headers,
    'X-Appwrite-Request-Timeout': '30', // 30 second timeout
  }

  return client
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
    userId: sessionData.userId, // Include user context
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