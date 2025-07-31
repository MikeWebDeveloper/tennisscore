'use client'

// Lightweight Appwrite client wrapper
// Only imports what we actually use, reducing bundle size

import { Account, Databases, Storage, Client } from 'appwrite'

// Lazy initialize clients only when needed
let _client: Client | null = null
let _account: Account | null = null
let _databases: Databases | null = null
let _storage: Storage | null = null

const initClient = () => {
  if (!_client) {
    _client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  }
  return _client
}

export const getAccount = () => {
  if (!_account) {
    _account = new Account(initClient())
  }
  return _account
}

export const getDatabases = () => {
  if (!_databases) {
    _databases = new Databases(initClient())
  }
  return _databases
}

export const getStorage = () => {
  if (!_storage) {
    _storage = new Storage(initClient())
  }
  return _storage
}

// Export convenience methods that match the original API
export const appwriteClient = {
  get account() { return getAccount() },
  get databases() { return getDatabases() },
  get storage() { return getStorage() },
  get client() { return initClient() }
}

// For backward compatibility
export const account = appwriteClient.account
export const databases = appwriteClient.databases
export const storage = appwriteClient.storage
export const client = appwriteClient.client