"use server"

import { ID, Query } from "node-appwrite"
import { createAdminClient } from "@/lib/appwrite-server"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Match, MatchFormat } from "@/lib/types"

interface Score {
  sets: number[][]
  games: number[]
  points: number[]
}

export async function createMatch(matchData: {
  playerOneId: string
  playerTwoId: string
  matchFormat: MatchFormat
}): Promise<{ success?: boolean; matchId?: string; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    const { databases } = await createAdminClient()

    const initialScore: Score = {
      sets: [],
      games: [0, 0],
      points: [0, 0],
    }

    const match = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      ID.unique(),
      {
        playerOneId: matchData.playerOneId,
        playerTwoId: matchData.playerTwoId,
        matchFormat: JSON.stringify(matchData.matchFormat),
        matchDate: new Date().toISOString(),
        status: "In Progress",
        score: JSON.stringify(initialScore),
        pointLog: [],
        userId: user.$id,
      }
    )

    revalidatePath("/dashboard")
    return { success: true, matchId: match.$id }
  } catch (error) {
    console.error("Error creating match:", error)
    return { error: error instanceof Error ? error.message : "Failed to create match" }
  }
}

export async function updateMatchScore(matchId: string, scoreUpdate: {
  score: object
  pointLog: object[]
  status?: "In Progress" | "Completed"
  winnerId?: string
}): Promise<{ success?: boolean; match?: Match; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    const { databases } = await createAdminClient()

    // Serialize pointLog objects to strings since Appwrite expects string arrays
    const serializedPointLog = scoreUpdate.pointLog.map(point => 
      typeof point === 'string' ? point : JSON.stringify(point)
    )

    const updateData: Record<string, unknown> = {
      score: JSON.stringify(scoreUpdate.score),
      pointLog: serializedPointLog,
    }
    
    if (scoreUpdate.status) {
      updateData.status = scoreUpdate.status
    }
    
    if (scoreUpdate.winnerId) {
      updateData.winnerId = scoreUpdate.winnerId
    }

    const match = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      matchId,
      updateData
    )

    revalidatePath("/matches")
    revalidatePath(`/live/${matchId}`)
    return { success: true, match: match as unknown as Match }
  } catch (error) {
    console.error("Error updating match score:", error)
    return { error: error instanceof Error ? error.message : "Failed to update match score" }
  }
}

export async function getMatchesByUser(): Promise<Match[]> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return []
    }

    const { databases } = await createAdminClient()

    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      [Query.equal("userId", user.$id)]
    )

    return response.documents as unknown as Match[]
  } catch (error) {
    console.error("Error fetching matches:", error)
    return []
  }
}

export async function getMatchesByPlayer(playerId: string): Promise<Match[]> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return []
    }

    const { databases } = await createAdminClient()

    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      [
        Query.equal("userId", user.$id),
        Query.or([
          Query.equal("playerOneId", playerId),
          Query.equal("playerTwoId", playerId)
        ])
      ]
    )

    return response.documents as unknown as Match[]
  } catch (error) {
    console.error("Error fetching player matches:", error)
    return []
  }
}

export async function getMatch(matchId: string) {
  const { databases } = await createAdminClient()
  
  try {
    const match = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      matchId
    )
    
    return match
  } catch (error) {
    console.error("Error fetching match:", error)
    throw new Error("Match not found")
  }
}

export async function deleteMatch(matchId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")
  
  try {
    const { databases } = await createAdminClient()
    
    await databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      matchId
    )
    
    revalidatePath("/matches")
    return { success: true }
  } catch (error) {
    console.error("Error deleting match:", error)
    const message = error instanceof Error ? error.message : "Failed to delete match"
    return { error: message }
  }
} 