/**
 * Optimized Appwrite SDK Types
 * Only exports the types we actually use to minimize bundle impact
 */

// Re-export only the types we need from Appwrite
import type { Models } from 'node-appwrite'
export type { Models }

// Client-side vs Server-side type discrimination
export interface ClientServices {
  account: import('appwrite').Account
  databases: import('appwrite').Databases  
  storage: import('appwrite').Storage
}

export interface ServerServices {
  account: import('node-appwrite').Account
  databases: import('node-appwrite').Databases
  storage: import('node-appwrite').Storage
  users: import('node-appwrite').Users
}

export interface SessionClient extends ServerServices {
  userId: string
}

// Utility types for our specific use cases
export interface TennisPlayer extends Models.Document {
  name: string
  nationality?: string
  profilePicture?: string
  stats?: any
}

export interface TennisMatch extends Models.Document {
  player1Id: string
  player2Id: string
  score: any
  status: 'live' | 'completed' | 'scheduled'
  createdAt: string
  updatedAt: string
}

// Configuration interface
export interface AppwriteConfig {
  endpoint: string
  project: string
  apiKey?: string
  databaseId: string
  playersCollectionId: string
  matchesCollectionId: string
  usersCollectionId: string
  profilePicturesBucketId: string
}