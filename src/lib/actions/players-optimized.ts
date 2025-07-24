/**
 * Optimized Player Actions with Caching and Batch Operations
 * Provides high-performance database operations with intelligent caching
 */

"use server"

import { ID, Query } from "node-appwrite"
import { createAdminClient, withRetry } from "@/lib/appwrite-server"
import { getCurrentUser } from "@/lib/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { Player } from "@/lib/types"
import { logger } from "@/lib/utils/logger"
import { CACHE_KEYS, CACHE_DURATIONS, CACHE_INVALIDATION, cached } from "@/lib/utils/cache-manager"
import { batchGetPlayers } from "@/lib/utils/batch-operations"

const playerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  yearOfBirth: z.number().min(1900).max(2030).optional(),
  rating: z.string().max(50).optional(),
  club: z.string().max(100).optional(),
  playingHand: z.enum(['right', 'left']).optional(),
  isMainPlayer: z.boolean().optional(),
})

/**
 * Get players by user with caching
 */
export const getPlayersByUserCached = cached(
  async (userId: string): Promise<Player[]> => {
    const { databases } = await createAdminClient()

    try {
      const response = await databases.listDocuments<Player>(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        [
          Query.equal("userId", userId), 
          Query.orderDesc("$createdAt"),
          Query.limit(1000)
        ]
      )

      const playersWithPictures = response.documents.map(player => {
        if (player.profilePictureId) {
          const url = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID}/files/${player.profilePictureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`
          return { ...player, profilePictureUrl: url }
        }
        return player
      })

      return playersWithPictures
    } catch (error) {
      logger.error("Failed to fetch players:", error)
      throw new Error("Failed to fetch players")
    }
  },
  (userId: string) => CACHE_KEYS.PLAYERS_BY_USER(userId),
  CACHE_DURATIONS.PLAYER_DATA
)

/**
 * Get players by user (public interface)
 */
export async function getPlayersByUser(): Promise<Player[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  return getPlayersByUserCached(user.$id)
}

/**
 * Get main player with caching
 */
export const getMainPlayerCached = cached(
  async (userId: string): Promise<Player | null> => {
    const { databases } = await createAdminClient()
    
    try {
      const response = await withRetry(() =>
        databases.listDocuments(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
          [
            Query.equal("userId", userId), 
            Query.equal("isMainPlayer", true),
            Query.limit(1)
          ]
        )
      )
      
      if (response.documents.length > 0) {
        const player = response.documents[0] as unknown as Player
        
        // Add profile picture URL if exists
        if (player.profilePictureId) {
          const url = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID}/files/${player.profilePictureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`
          return { ...player, profilePictureUrl: url }
        }
        
        return player
      }
      
      return null
    } catch (error) {
      logger.error("Error fetching main player:", error)
      return null
    }
  },
  (userId: string) => CACHE_KEYS.MAIN_PLAYER(userId),
  CACHE_DURATIONS.PLAYER_DATA
)

/**
 * Get main player (public interface)
 */
export async function getMainPlayer(): Promise<Player | null> {
  const user = await getCurrentUser()
  if (!user) return null

  return getMainPlayerCached(user.$id)
}

/**
 * Get player by ID with caching
 */
export const getPlayerByIdCached = cached(
  async (playerId: string): Promise<Player | null> => {
    const { databases } = await createAdminClient()
    
    try {
      const response = await withRetry(() =>
        databases.getDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
          playerId
        )
      )
      
      const player = response as unknown as Player
      
      // Add profile picture URL if exists
      if (player.profilePictureId) {
        const url = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID}/files/${player.profilePictureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`
        return { ...player, profilePictureUrl: url }
      }
      
      return player
    } catch (error) {
      logger.error("Error fetching player:", error)
      return null
    }
  },
  (playerId: string) => CACHE_KEYS.PLAYER(playerId),
  CACHE_DURATIONS.PLAYER_DATA
)

/**
 * Get player by ID (public interface)
 */
export async function getPlayerById(playerId: string): Promise<Player | null> {
  const user = await getCurrentUser()
  if (!user) return null

  return getPlayerByIdCached(playerId)
}

/**
 * Batch get players by IDs (optimized)
 */
export async function getPlayersByIds(playerIds: string[]): Promise<Record<string, Player>> {
  const user = await getCurrentUser()
  if (!user) return {}

  return batchGetPlayers(playerIds)
}

/**
 * Create player with cache invalidation
 */
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
      club: (formData.get("club") as string) || undefined,
      playingHand: (formData.get("playingHand") as 'right' | 'left' | null) || undefined,
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
        logger.error("Error uploading profile picture:", error)
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
    
    // Invalidate relevant caches
    CACHE_INVALIDATION.onPlayerUpdate(player.$id, user.$id)
    
    revalidatePath("/players")
    revalidatePath("/dashboard")
    return { success: true, player: player as unknown as Player }
  } catch (error: unknown) {
    logger.error("Error creating player:", error)
    return { error: error instanceof Error ? error.message : "Failed to create player" }
  }
}

/**
 * Update player with cache invalidation
 */
export async function updatePlayer(playerId: string, formData: FormData) {
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
      club: (formData.get("club") as string) || undefined,
      playingHand: (() => {
        const hand = formData.get("playingHand") as string
        return hand && (hand === 'right' || hand === 'left') ? hand : undefined
      })(),
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
        logger.error("Error uploading profile picture:", error)
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
    
    // Invalidate relevant caches
    CACHE_INVALIDATION.onPlayerUpdate(playerId, user.$id)
    
    revalidatePath("/players")
    revalidatePath("/dashboard")
    return { success: true, player }
  } catch (error) {
    logger.error("Error updating player:", error)
    const message = error instanceof Error ? error.message : "Failed to update player"
    return { error: message }
  }
}

/**
 * Delete player with cache invalidation
 */
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
    
    // Invalidate relevant caches
    CACHE_INVALIDATION.onPlayerUpdate(playerId, user.$id)
    
    revalidatePath("/players")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: unknown) {
    logger.error("Error deleting player:", error)
    return { error: error instanceof Error ? error.message : "Failed to delete player" }
  }
}