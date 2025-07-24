"use server"

import { ID, Query } from "node-appwrite"
import { createAdminClient, withRetry } from "@/lib/appwrite-server"
import { getCurrentUser } from "@/lib/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { Player } from "@/lib/types"
import { invalidateCacheForUser } from "@/lib/utils/batch-operations"

const playerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  yearOfBirth: z.number().min(1900).max(2030).optional(),
  rating: z.string().max(50).optional(), // Allow flexible ratings like "H12", "4.5", "UTR 8.2"
  club: z.string().max(100).optional(),
  playingHand: z.enum(['right', 'left']).optional(),
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
    
    // Invalidate cache to ensure fresh data on next load
    invalidateCacheForUser(user.$id)
    
    return { success: true, player: player as unknown as Player }
  } catch (error: unknown) {
    console.error("Error creating player:", error)
    return { error: error instanceof Error ? error.message : "Failed to create player" }
  }
}

export async function getPlayersByUser(): Promise<Player[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const { databases } = await createAdminClient()

  try {
    const response = await databases.listDocuments<Player>(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
      [
        Query.equal("userId", user.$id), 
        Query.orderDesc("$createdAt"),
        Query.limit(1000) // Set high limit to get all players
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
    console.error("Failed to fetch players:", error)
    throw new Error("Failed to fetch players")
  }
}

export interface PaginatedPlayersResult {
  players: Player[]
  total: number
  hasMore: boolean
}

export async function getPlayersByUserPaginated(options: {
  limit?: number
  offset?: number
  sortBy?: 'name' | 'recent' | 'mainFirst'
  searchQuery?: string
} = {}): Promise<PaginatedPlayersResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { players: [], total: 0, hasMore: false }
    }

    const { databases } = await createAdminClient()
    const { limit = 20, offset = 0, sortBy = 'mainFirst', searchQuery } = options

    // If there's a search query, handle it differently
    if (searchQuery && searchQuery.trim()) {
      return await searchPlayersWithQuery(user.$id, searchQuery.trim(), limit, offset, sortBy)
    }

    // For mainFirst sorting, always include main player on first page
    if (sortBy === 'mainFirst' && offset === 0) {
      return await getPlayersMainFirst(user.$id, limit)
    }

    // Build base query for regular pagination
    const queries = [Query.equal("userId", user.$id)]
    
    // Add sorting
    switch (sortBy) {
      case 'name':
        queries.push(Query.orderAsc("firstName"))
        break
      case 'recent':
        queries.push(Query.orderDesc("$createdAt"))
        break
      case 'mainFirst':
        // For subsequent pages with mainFirst, exclude main player and adjust offset
        queries.push(Query.orderDesc("$createdAt"))
        break
      default:
        queries.push(Query.orderDesc("$createdAt"))
    }

    // Add pagination
    if (sortBy === 'mainFirst' && offset > 0) {
      // For mainFirst with offset > 0, we need to account for main player being on first page
      queries.push(Query.limit(limit))
      queries.push(Query.offset(offset - 1)) // Adjust offset since main player takes one slot on first page
    } else {
      queries.push(Query.limit(limit))
      queries.push(Query.offset(offset))
    }

    const response = await databases.listDocuments<Player>(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
      queries
    )

    // Get total count for pagination info
    const totalResponse = await withRetry(() =>
      databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        [Query.equal("userId", user.$id)]
      )
    )

    let players = response.documents.map(player => {
      if (player.profilePictureId) {
        const url = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID}/files/${player.profilePictureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`
        return { ...player, profilePictureUrl: url }
      }
      return player
    }) as Player[]

    // For mainFirst subsequent pages, filter out main player if it appears
    if (sortBy === 'mainFirst' && offset > 0) {
      players = players.filter(player => !player.isMainPlayer)
    }

    const total = totalResponse.total
    const hasMore = (offset + limit) < total

    return { players, total, hasMore }
  } catch (error) {
    console.error("Error fetching paginated players:", error)
    return { players: [], total: 0, hasMore: false }
  }
}

// Helper function to get players with main player first on first page
async function getPlayersMainFirst(userId: string, limit: number): Promise<PaginatedPlayersResult> {
  const { databases } = await createAdminClient()
  
  // First, get the main player
  const mainPlayerResponse = await databases.listDocuments<Player>(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
    [Query.equal("userId", userId), Query.equal("isMainPlayer", true), Query.limit(1)]
  )

  // Then get other players (excluding main player)
  const otherPlayersResponse = await databases.listDocuments<Player>(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
    [
      Query.equal("userId", userId), 
      Query.equal("isMainPlayer", false),
      Query.orderDesc("$createdAt"),
      Query.limit(limit - (mainPlayerResponse.documents.length > 0 ? 1 : 0))
    ]
  )

  // Get total count
  const totalResponse = await withRetry(() =>
    databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
      [Query.equal("userId", userId)]
    )
  )

  // Combine players with main player first
  const allPlayers = [...mainPlayerResponse.documents, ...otherPlayersResponse.documents]
  
  const players = allPlayers.map(player => {
    if (player.profilePictureId) {
      const url = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID}/files/${player.profilePictureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`
      return { ...player, profilePictureUrl: url }
    }
    return player
  }) as Player[]

  const total = totalResponse.total
  const hasMore = limit < total

  return { players, total, hasMore }
}

// Helper function to search players with server-side filtering
async function searchPlayersWithQuery(
  userId: string, 
  searchQuery: string, 
  limit: number, 
  offset: number, 
  sortBy: string
): Promise<PaginatedPlayersResult> {
  const { databases } = await createAdminClient()
  
  // Get all players for the user (we need to do client-side filtering for diacritic search)
  const allPlayersResponse = await databases.listDocuments<Player>(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
    [Query.equal("userId", userId), Query.limit(1000)]
  )

  // Apply client-side search filtering with diacritic normalization
  const normalizedSearch = searchQuery
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

  const filteredPlayers = allPlayersResponse.documents.filter(player => {
    const playerName = `${player.firstName} ${player.lastName}`
    const normalizedPlayerName = playerName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
    
    const normalizedFirstName = player.firstName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
    
    const normalizedLastName = player.lastName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
    
    const normalizedRating = player.rating ? player.rating
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase() : ""

    return normalizedPlayerName.includes(normalizedSearch) ||
           normalizedFirstName.includes(normalizedSearch) ||
           normalizedLastName.includes(normalizedSearch) ||
           normalizedRating.includes(normalizedSearch)
  })

  // Apply sorting
  let sortedPlayers = [...filteredPlayers]
  switch (sortBy) {
    case 'name':
      sortedPlayers.sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
        return nameA.localeCompare(nameB)
      })
      break
    case 'mainFirst':
      // Put main player first, then sort by creation date
      const mainPlayer = sortedPlayers.find(p => p.isMainPlayer)
      const others = sortedPlayers.filter(p => !p.isMainPlayer)
        .sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
      sortedPlayers = mainPlayer ? [mainPlayer, ...others] : others
      break
    case 'recent':
    default:
      sortedPlayers.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
      break
  }

  // Apply pagination to filtered and sorted results
  const paginatedPlayers = sortedPlayers.slice(offset, offset + limit)

  const players = paginatedPlayers.map(player => {
    if (player.profilePictureId) {
      const url = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID}/files/${player.profilePictureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`
      return { ...player, profilePictureUrl: url }
    }
    return player
  }) as Player[]

  const total = filteredPlayers.length
  const hasMore = (offset + limit) < total

  return { players, total, hasMore }
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
        [
          Query.equal("userId", user.$id), 
          Query.equal("isMainPlayer", true),
          Query.limit(1) // We only need one main player
        ]
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
    
    // Invalidate cache to ensure fresh data on next load
    invalidateCacheForUser(user.$id)
    
    return { success: true, player }
  } catch (error) {
    console.error("Error updating player:", error)
    const message = error instanceof Error ? error.message : "Failed to update player"
    return { error: message }
  }
}

export async function getPlayersByIds(playerIds: string[]): Promise<Record<string, Player>> {
  try {
    if (!playerIds || playerIds.length === 0) {
      return {}
    }

    const { databases } = await createAdminClient()
    const players: Record<string, Player> = {}
    
    // Filter out invalid IDs (anonymous players, empty strings, etc.)
    const validPlayerIds = playerIds.filter(id => 
      id && 
      typeof id === 'string' && 
      id.trim() !== '' && 
      !id.startsWith('anonymous-') &&
      id.length > 10 // Appwrite IDs are typically longer
    )
    
    // Fetch all players that match the valid IDs  
    for (const playerId of validPlayerIds) {
      try {
        const player = await withRetry(() =>
          databases.getDocument(
            process.env.APPWRITE_DATABASE_ID!,
            process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
            playerId
          )
        )
        players[playerId] = player as unknown as Player
      } catch (error) {
        console.error(`Error fetching player ${playerId}:`, error)
        // Don't create fallback entries - let formatPlayerFromObject handle null properly
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

export async function updatePlayerProfilePicture(
  playerId: string,
  fileId: string
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const { databases } = await createAdminClient()

  try {
    const player = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
      playerId,
      {
        profilePictureId: fileId,
      }
    )
    return { success: true, player }
  } catch (error) {
    console.error("Failed to update player profile picture:", error)
    return { error: "Failed to update profile picture." }
  }
}

export async function getPlayerById(playerId: string): Promise<Player | null> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return null
    }
    
    const { databases } = await createAdminClient()
    
    const response = await withRetry(() =>
      databases.getDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        playerId
      )
    )
    
    return response as unknown as Player
  } catch (error: unknown) {
    console.error("Error fetching player:", error)
    return null
  }
}

export async function removePlayerProfilePicture(playerId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const { databases, storage } = await createAdminClient()

  try {
    // First, find the document to get the fileId
    const player = await databases.getDocument<Player>(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
      playerId
    )

    const fileId = player.profilePictureId
    let deleteResult = null

    // If a fileId exists, delete the file from storage
    if (fileId) {
      deleteResult = await storage.deleteFile(
        process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID!,
        fileId
      )
    }

    // Then, update the document to remove the reference
    const updatedPlayer = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
      playerId,
      {
        profilePictureId: null,
      }
    )

    return { success: true, player: updatedPlayer, deleteResult }
  } catch (error) {
    console.error("Failed to remove player profile picture:", error)
    return { error: "Failed to remove profile picture." }
  }
} 