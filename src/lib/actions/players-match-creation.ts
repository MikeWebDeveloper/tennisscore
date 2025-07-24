"use server"

import { Query } from "node-appwrite"
import { createAdminClient, withRetry } from "@/lib/appwrite-server"
import { getCurrentUser } from "@/lib/auth"
import { Player } from "@/lib/types"

export async function getPlayersForMatchCreation() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("Unauthorized")
    }

    const { databases } = await createAdminClient()
    
    // Get main player
    const mainPlayerResponse = await withRetry(() =>
      databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        [
          Query.equal("userId", user.$id),
          Query.equal("isMainPlayer", true),
          Query.limit(1)
        ]
      )
    )
    
    const mainPlayer = mainPlayerResponse.documents[0] as Player | undefined
    
    // Get recent players (excluding main player)
    const queries = [
      Query.equal("userId", user.$id),
      Query.orderDesc("$updatedAt"),
      Query.limit(20)
    ]
    
    if (mainPlayer) {
      queries.push(Query.notEqual("$id", mainPlayer.$id))
    }
    
    const recentPlayersResponse = await withRetry(() =>
      databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        queries
      )
    )
    
    // Get total count
    const totalCountResponse = await withRetry(() =>
      databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        [
          Query.equal("userId", user.$id),
          Query.limit(1)
        ]
      )
    )
    
    return {
      mainPlayer,
      recentPlayers: recentPlayersResponse.documents as Player[],
      totalCount: totalCountResponse.total
    }
  } catch (error) {
    console.error("Failed to get players for match creation:", error)
    throw error
  }
}

export async function getAllPlayersForMatch() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("Unauthorized")
    }

    const { databases } = await createAdminClient()
    
    // Fetch all players for the user (up to 100)
    const response = await withRetry(() =>
      databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        [
          Query.equal("userId", user.$id),
          Query.orderDesc("$updatedAt"),
          Query.limit(100)
        ]
      )
    )
    
    return response.documents as Player[]
  } catch (error) {
    console.error("Failed to get all players for match:", error)
    throw error
  }
}