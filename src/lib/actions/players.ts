"use server"

import { ID, Query } from "node-appwrite"
import { createAdminClient, withRetry } from "@/lib/appwrite-server"
import { getCurrentUser } from "@/lib/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { Player } from "@/lib/types"

const playerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  yearOfBirth: z.number().min(1900).max(2030).optional(),
  rating: z.string().max(50).optional(), // Allow flexible ratings like "H12", "4.5", "UTR 8.2"
  isMainPlayer: z.boolean().optional(),
})

export async function createPlayer(formData: FormData): Promise<{ success?: boolean; player?: Player; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }
    
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      yearOfBirth: formData.get("yearOfBirth") ? parseInt(formData.get("yearOfBirth") as string) : undefined,
      rating: (formData.get("rating") as string) || undefined,
      isMainPlayer: formData.get("isMainPlayer") === "true",
    }
    
    const validatedData = playerSchema.parse(data)
    
    const { databases, storage } = await createAdminClient()
    
    // Handle profile picture upload
    let profilePictureId: string | undefined
    const profilePicture = formData.get("profilePicture") as File
    if (profilePicture && profilePicture.size > 0) {
      try {
        const uploadedFile = await storage.createFile(
          process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID!,
          ID.unique(),
          profilePicture
        )
        profilePictureId = uploadedFile.$id
      } catch (error) {
        console.error("Error uploading profile picture:", error)
      }
    }
    
    // If this is set as main player, unset other main players
    if (validatedData.isMainPlayer) {
      const existingPlayers = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        [Query.equal("userId", user.$id), Query.equal("isMainPlayer", true)]
      )
      
      // Remove main player status from existing players
      for (const existingPlayer of existingPlayers.documents) {
        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
          existingPlayer.$id,
          { isMainPlayer: false }
        )
      }
    }
    
    const player = await withRetry(() => 
      databases.createDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        ID.unique(),
        {
          ...validatedData,
          profilePictureId,
          userId: user.$id,
        }
      )
    )
    
    revalidatePath("/players")
    revalidatePath("/dashboard")
    return { success: true, player: player as unknown as Player }
  } catch (error: unknown) {
    console.error("Error creating player:", error)
    return { error: error instanceof Error ? error.message : "Failed to create player" }
  }
}

export async function getPlayersByUser(): Promise<Player[]> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return []
    }
    
    const { databases } = await createAdminClient()
    
    const response = await withRetry(() =>
      databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        [Query.equal("userId", user.$id)]
      )
    )
    
    return response.documents as unknown as Player[]
  } catch (error: unknown) {
    console.error("Error fetching players:", error)
    // Return empty array instead of throwing to prevent page crashes
    return []
  }
}

export async function getMainPlayer(): Promise<Player | null> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return null
    }
    
    const { databases } = await createAdminClient()
    
    const response = await withRetry(() =>
      databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        [Query.equal("userId", user.$id), Query.equal("isMainPlayer", true)]
      )
    )
    
    if (response.documents.length > 0) {
      return response.documents[0] as unknown as Player
    }
    
    return null
  } catch (error: unknown) {
    console.error("Error fetching main player:", error)
    return null
  }
}

export async function updatePlayer(playerId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")
  
  const data = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    yearOfBirth: formData.get("yearOfBirth") ? parseInt(formData.get("yearOfBirth") as string) : undefined,
    rating: (formData.get("rating") as string) || undefined,
    isMainPlayer: formData.get("isMainPlayer") === "true",
  }
  
  try {
    const validatedData = playerSchema.parse(data)
    
    const { databases, storage } = await createAdminClient()
    
    // Handle profile picture upload
    let profilePictureId: string | undefined
    const profilePicture = formData.get("profilePicture") as File
    if (profilePicture && profilePicture.size > 0) {
      try {
        const uploadedFile = await storage.createFile(
          process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID!,
          ID.unique(),
          profilePicture
        )
        profilePictureId = uploadedFile.$id
      } catch (error) {
        console.error("Error uploading profile picture:", error)
      }
    }
    
    // If this is set as main player, unset other main players
    if (validatedData.isMainPlayer) {
      const existingPlayers = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        [Query.equal("userId", user.$id), Query.equal("isMainPlayer", true)]
      )
      
      // Remove main player status from existing players (except current one)
      for (const existingPlayer of existingPlayers.documents) {
        if (existingPlayer.$id !== playerId) {
          await databases.updateDocument(
            process.env.APPWRITE_DATABASE_ID!,
            process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
            existingPlayer.$id,
            { isMainPlayer: false }
          )
        }
      }
    }
    
    const updateData: Record<string, unknown> = { ...validatedData }
    if (profilePictureId) {
      updateData.profilePictureId = profilePictureId
    }
    
    const player = await withRetry(() =>
      databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        playerId,
        updateData
      )
    )
    
    revalidatePath("/players")
    revalidatePath("/dashboard")
    return { success: true, player }
  } catch (error) {
    console.error("Error updating player:", error)
    const message = error instanceof Error ? error.message : "Failed to update player"
    return { error: message }
  }
}

export async function getPlayersByIds(playerIds: string[]): Promise<Record<string, Player>> {
  try {
    const { databases } = await createAdminClient()
    
    const players: Record<string, Player> = {}
    
    // Fetch all players that match the IDs
    for (const playerId of playerIds) {
      try {
        const player = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
          playerId
        )
        players[playerId] = player as unknown as Player
      } catch (error) {
        console.error(`Error fetching player ${playerId}:`, error)
        // Create a fallback player name
        players[playerId] = {
          $id: playerId,
          firstName: `Player`,
          lastName: playerId.slice(-4),
          userId: '',
          $createdAt: '',
          $updatedAt: '',
          $permissions: [],
          $databaseId: '',
          $collectionId: ''
        } as Player
      }
    }
    
    return players
  } catch (error: unknown) {
    console.error("Error fetching players by IDs:", error)
    return {}
  }
}

export async function deletePlayer(playerId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }
    
    const { databases } = await createAdminClient()
    
    // Verify ownership
    const existingPlayer = await withRetry(() =>
      databases.getDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        playerId
      )
    )

    if (existingPlayer.userId !== user.$id) {
      return { error: "Unauthorized to delete this player" }
    }
    
    await withRetry(() =>
      databases.deleteDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        playerId
      )
    )
    
    revalidatePath("/players")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: unknown) {
    console.error("Error deleting player:", error)
    return { error: error instanceof Error ? error.message : "Failed to delete player" }
  }
} 