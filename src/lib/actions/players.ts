"use server"

import { ID, Query } from "node-appwrite"
import { createAdminClient } from "@/lib/appwrite-server"
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
    
    const player = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
      ID.unique(),
      {
        ...validatedData,
        profilePictureId,
        userId: user.$id,
      }
    ) as unknown as Player
    
    revalidatePath("/players")
    revalidatePath("/dashboard")
    return { success: true, player }
  } catch (error: unknown) {
    console.error("Error creating player:", error)
    return { error: error instanceof Error ? error.message : "Failed to create player" }
  }
}

export async function getPlayersByUser(): Promise<Player[]> {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Unauthorized")
    
    const { databases } = await createAdminClient()
    
    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
      [Query.equal("userId", user.$id)]
    )
    
    return response.documents as unknown as Player[]
  } catch (error: unknown) {
    console.error("Error fetching players:", error)
    throw new Error("Failed to fetch players")
  }
}

export async function getMainPlayer(): Promise<Player | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null
    
    const { databases } = await createAdminClient()
    
    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
      [Query.equal("userId", user.$id), Query.equal("isMainPlayer", true)]
    )
    
    return response.documents[0] as unknown as Player || null
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
    
    const updateData: any = { ...validatedData }
    if (profilePictureId) {
      updateData.profilePictureId = profilePictureId
    }
    
    const player = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
      playerId,
      updateData
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

export async function deletePlayer(playerId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }
    
    const { databases } = await createAdminClient()
    
    await databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
      playerId
    )
    
    revalidatePath("/players")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: unknown) {
    console.error("Error deleting player:", error)
    return { error: "Failed to delete player" }
  }
} 