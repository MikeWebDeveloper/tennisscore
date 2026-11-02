"use server"

import { withNormalizedStatus } from "@/lib/utils/match-status"
import { MATCH_LIST_FIELDS } from "@/lib/utils/match-list-fields"
import { ID, Query } from "node-appwrite"
import { createAdminClient, withRetry } from "@/lib/appwrite-server"
import { getCurrentUser, isAdmin } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Match, MatchFormat, Player } from "@/lib/types"
import { getPlayerById } from "./players"
import { env } from "@/lib/env"


/** Server actions write with the admin key, so each write checks the match belongs to the caller */
async function ownsMatch(databases: Awaited<ReturnType<typeof createAdminClient>>["databases"], matchId: string, userId: string) {
  const match = await withRetry(() => databases.getDocument<Match>(
    env.APPWRITE_DATABASE_ID, env.APPWRITE_MATCHES_COLLECTION_ID, matchId, [Query.select(["userId"])]
  ))
  return match.userId === userId
}

export async function createMatch(matchData: {
  playerOneId: string
  playerTwoId: string
  playerThreeId?: string
  playerFourId?: string
  tournamentName?: string
  matchFormat: MatchFormat & { detailLevel: "points" | "simple" | "shot-type" | "complex" | "detailed" | "custom" }
}) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  const {
    playerOneId,
    playerTwoId,
    playerThreeId,
    playerFourId,
    tournamentName,
    matchFormat,
  } = matchData
  const { detailLevel, ...restOfFormat } = matchFormat

  const isDoubles = !!(playerThreeId && playerFourId)

  const { databases } = await createAdminClient()

  try {
    const newMatch = {
      playerOneId,
      playerTwoId,
      playerThreeId: playerThreeId || null,
      playerFourId: playerFourId || null,
      isDoubles,
      matchDate: new Date().toISOString(),
      status: "In Progress",
      score: "{}", // Will be initialized by the scoring engine
      pointLog: [],
      events: [],
      matchFormat: JSON.stringify(restOfFormat),
      detailLevel,
      tournamentName: tournamentName || null,
      userId: user.$id,
    }

    console.log("Attempting to create match with data:", newMatch)

    const match = await databases.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_MATCHES_COLLECTION_ID,
      ID.unique(),
      newMatch
    )

    return { success: true, matchId: match.$id }
  } catch (error) {
    console.error("Failed to create match:", JSON.stringify(error, null, 2))
    const errorMessage = (error as { message?: string })?.message || "An unexpected error occurred while creating the match."
    return { error: errorMessage }
  }
}

async function getPopulatedPlayer(
  playerId: string | null | undefined
): Promise<Player | null> {
  if (!playerId || playerId.startsWith("anonymous")) return null
  try {
    const player = await getPlayerById(playerId)
    return player
  } catch {
    return null
  }
}

export async function getMatchById(matchId: string): Promise<Match | null> {
  const user = await getCurrentUser()
  if (!user) {
    console.error("Unauthorized attempt to fetch match")
    return null
  }

  const { databases } = await createAdminClient()

  try {
    const match = await databases.getDocument<Match>(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_MATCHES_COLLECTION_ID,
      matchId
    )

    // Ensure the user owns this match
    if (match.userId !== user.$id) {
      console.error("User does not have permission to view this match")
      return null
    }

    // Check if match is soft deleted
    if (match.isDeleted) {
      console.error("Match is deleted")
      return null
    }

    // Populate player data
    const [playerOne, playerTwo, playerThree, playerFour] = await Promise.all([
      getPopulatedPlayer(match.playerOneId),
      getPopulatedPlayer(match.playerTwoId),
      getPopulatedPlayer(match.playerThreeId),
      getPopulatedPlayer(match.playerFourId),
    ])

    return {
      ...match,
      playerOne: playerOne as Player,
      playerTwo: playerTwo as Player,
      playerThree: playerThree || undefined,
      playerFour: playerFour || undefined,
      pointLog: match.pointLog || [],
      setDurations: match.setDurations ? (match.setDurations as unknown as string[]).map(duration => parseInt(duration, 10)) : [],
    }
  } catch (error) {
    console.error(`Failed to fetch match ${matchId}:`, error)
    return null
  }
}

export async function updateMatchScore(matchId: string, scoreUpdate: {
  score: object
  pointLog: object[]
  status?: "In Progress" | "Completed" | "retired"
  winnerId?: string
  startTime?: string
  endTime?: string
  setDurations?: number[]
  retirementReason?: string
}): Promise<{ success?: boolean; match?: Match; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    const { databases } = await createAdminClient()
    if (!(await ownsMatch(databases, matchId, user.$id))) {
      return { error: "Match unavailable" }
    }

    // Serialize pointLog objects to strings since Appwrite expects string arrays
    const serializedPointLog = scoreUpdate.pointLog.map(point =>
      typeof point === 'string' ? point : JSON.stringify(point)
    )

    console.log("updateMatchScore called with:", {
      matchId,
      pointLogLength: scoreUpdate.pointLog.length,
      serializedPointLogLength: serializedPointLog.length,
      status: scoreUpdate.status,
      winnerId: scoreUpdate.winnerId
    })

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

    if (scoreUpdate.startTime) {
      updateData.startTime = scoreUpdate.startTime
    }

    if (scoreUpdate.endTime) {
      updateData.endTime = scoreUpdate.endTime
    }

    if (scoreUpdate.setDurations) {
      updateData.setDurations = scoreUpdate.setDurations.map(duration => duration.toString())
    }

    if (scoreUpdate.retirementReason) {
      updateData.retirementReason = scoreUpdate.retirementReason
    }

    const match = await withRetry(() =>
      databases.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_MATCHES_COLLECTION_ID,
        matchId,
        updateData
      )
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

    const response = await withRetry(() =>
      databases.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_MATCHES_COLLECTION_ID,
        [
          Query.equal("userId", user.$id),
          Query.orderDesc("$createdAt"),
          Query.limit(1000) // Keep high limit for backward compatibility
        ]
      )
    )

    // Filter out soft deleted matches client-side for backward compatibility
    const matches = response.documents.filter(match => !match.isDeleted)

    return matches as unknown as Match[]
  } catch (error) {
    console.error("Error fetching matches:", error)
    return []
  }
}

export interface PaginatedMatchesResult {
  matches: Match[]
  total: number
  hasMore: boolean
}

export async function getMatchesByUserPaginated(options: {
  limit?: number
  offset?: number
  dateFilter?: 'all' | 'thisMonth' | 'last3Months' | 'thisYear'
} = {}): Promise<PaginatedMatchesResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("Unauthorized")
    }

    const { databases } = await createAdminClient()
    const { limit = 15, offset = 0, dateFilter = 'all' } = options

    // Build query with filters
    const queries = [
      Query.equal("userId", user.$id),
      // Older documents may have a null deletion flag; filter before pagination.
      Query.or([Query.equal("isDeleted", false), Query.isNull("isDeleted")]),
    ]

    // Add date filtering
    if (dateFilter !== 'all') {
      const now = new Date()
      let filterDate: Date

      switch (dateFilter) {
        case 'thisMonth':
          filterDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'last3Months':
          filterDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
          break
        case 'thisYear':
          filterDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          filterDate = new Date(0) // No filter
      }

      if (filterDate.getTime() > 0) {
        queries.push(Query.greaterThanEqual("matchDate", filterDate.toISOString()))
      }
    }

    // Add ordering and pagination
    queries.push(Query.orderDesc("matchDate"))
    queries.push(Query.limit(limit))
    queries.push(Query.offset(offset))

    // Appwrite's total uses the same filters as the page, independently of its limit.
    const response = await withRetry(() => databases.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_MATCHES_COLLECTION_ID,
      [...queries, Query.select(MATCH_LIST_FIELDS)]
    ), 'NAVIGATION')
    const allMatches = response.documents as unknown as Match[]
    const total = response.total
    const hasMore = (offset + limit) < total

    return { matches: allMatches, total, hasMore }
  } catch (error) {
    console.error("Error fetching paginated matches:", error)
    throw error
  }
}

export async function getMatchesByPlayer(playerId: string): Promise<Match[]> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return []
    }

    const { databases } = await createAdminClient()

    const response = await withRetry(() =>
      databases.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_MATCHES_COLLECTION_ID,
        [
          Query.equal("userId", user.$id),
          Query.or([
            Query.equal("playerOneId", playerId),
            Query.equal("playerTwoId", playerId),
            Query.equal("playerThreeId", playerId),
            Query.equal("playerFourId", playerId)
          ]),
          Query.orderDesc("matchDate"),
          Query.select(MATCH_LIST_FIELDS), // Dashboard cards never use point logs or events
          Query.limit(1000) // Appwrite returns 25 by default, which silently truncated stats
        ]
      ), 'NAVIGATION'
    )

    // Filter out soft deleted matches client-side for backward compatibility; the dashboard
    // compares 'completed' / 'in-progress', the database stores "Completed" / "In Progress"
    const matches = response.documents.filter(match => !match.isDeleted).map(match => withNormalizedStatus(match as unknown as Match))

    return matches as unknown as Match[]
  } catch (error) {
    console.error("Error fetching player matches:", error)
    throw error
  }
}

export async function getMatch(matchId: string): Promise<Match> {
  const { databases } = await createAdminClient()

  try {
    const match = await withRetry(() =>
      databases.getDocument<Match>(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_MATCHES_COLLECTION_ID,
        matchId
      )
    )

    // Check if match is soft deleted
    if (match.isDeleted) {
      throw new Error("Match not found")
    }

    // Convert setDurations from string array to number array
    return {
      ...match,
      setDurations: match.setDurations ? (match.setDurations as unknown as string[]).map(duration => parseInt(duration, 10)) : [],
    }
  } catch (error: unknown) {
    console.error("Error fetching match:", error)

    // Handle specific Appwrite errors
    if (error && typeof error === 'object') {
      const err = error as { code?: number; type?: string; message?: string }

      if (err.code === 404 || err.type === 'document_not_found') {
        throw new Error("Match not found")
      } else if (err.code === 401 || err.type === 'general_unauthorized_scope') {
        throw new Error("Unauthorized access to match")
      } else if (err.message?.includes('fetch failed') || err.message?.includes('network') || err.message?.includes('ECONNRESET')) {
        throw new Error("Network error - please check your connection")
      }
    }

    // Generic fallback
    throw new Error("Unable to load match")
  }
}

export async function deleteMatch(matchId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const { databases } = await createAdminClient()

  try {
    // First verify the user owns this match
    const match = await databases.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_MATCHES_COLLECTION_ID,
      matchId
    )

    if (match.userId !== user.$id) {
      throw new Error("Unauthorized to delete this match")
    }

    // Soft delete: mark as deleted instead of actually deleting
    await databases.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_MATCHES_COLLECTION_ID,
      matchId,
      {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: user.$id
      }
    )

    revalidatePath("/matches")
    // Return void on success (mutation expects void)
    return
  } catch (error) {
    console.error("Error deleting match:", error)
    // Throw the error so the mutation's onError handler catches it
    throw error instanceof Error ? error : new Error("Failed to delete match")
  }
}

export async function getDeletedMatches(): Promise<Match[]> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return []
    }

    const { databases } = await createAdminClient()

    // Get all user matches first
    const response = await withRetry(() =>
      databases.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_MATCHES_COLLECTION_ID,
        [
          Query.equal("userId", user.$id),
          Query.orderDesc("$createdAt"),
          Query.limit(1000)
        ]
      )
    )

    // Filter for deleted matches within the last 7 days client-side
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const deletedMatches = response.documents.filter(match => {
      if (!match.isDeleted || !match.deletedAt) return false
      const deletedDate = new Date(match.deletedAt)
      return deletedDate >= sevenDaysAgo
    })

    return deletedMatches as unknown as Match[]
  } catch (error) {
    console.error("Error fetching deleted matches:", error)
    return []
  }
}

export async function restoreMatch(matchId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const { databases } = await createAdminClient()

  try {
    // First verify the user owns this match and it's deleted
    const match = await databases.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_MATCHES_COLLECTION_ID,
      matchId
    )

    if (match.userId !== user.$id) {
      throw new Error("Unauthorized to restore this match")
    }

    if (!match.isDeleted) {
      throw new Error("Match is not deleted")
    }

    // Check if match was deleted within the last 7 days
    if (match.deletedAt) {
      const deletedDate = new Date(match.deletedAt)
      const now = new Date()
      const daysSinceDeleted = (now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24)

      if (daysSinceDeleted > 7) {
        throw new Error("Match was deleted more than 7 days ago and cannot be restored")
      }
    }

    // Restore the match by removing soft delete flags
    await databases.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_MATCHES_COLLECTION_ID,
      matchId,
      {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null
      }
    )

    revalidatePath("/matches")
    return { success: true }
  } catch (error) {
    console.error("Error restoring match:", error)
    throw error instanceof Error ? error : new Error("Failed to restore match")
  }
}

export async function addMatchComment(matchId: string, comment: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    const { databases } = await createAdminClient()

    // Get current match to retrieve existing events
    const match = await databases.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_MATCHES_COLLECTION_ID,
      matchId
    )

    // Verify user owns this match
    if (match.userId !== user.$id) {
      return { error: "Unauthorized to add comment to this match" }
    }

    // Create new comment event
    const newEvent = {
      type: 'comment',
      content: comment,
      timestamp: new Date().toISOString(),
      author: user.email
    }

    // Get existing events and add new one
    const existingEvents = match.events || []
    const updatedEvents = [...existingEvents, JSON.stringify(newEvent)]

    // Update match with new events array
    await databases.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_MATCHES_COLLECTION_ID,
      matchId,
      {
        events: updatedEvents
      }
    )

    revalidatePath(`/live/${matchId}`)
    return { success: true }
  } catch (error) {
    console.error("Error adding match comment:", error)
    return { error: error instanceof Error ? error.message : "Failed to add comment" }
  }
}

export async function updateMatchFormat(matchId: string, newFormat: MatchFormat): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    const { databases } = await createAdminClient()
    if (!(await ownsMatch(databases, matchId, user.$id))) {
      return { success: false, error: "Match unavailable" }
    }

    await databases.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_MATCHES_COLLECTION_ID,
      matchId,
      { matchFormat: JSON.stringify(newFormat) }
    )

    revalidatePath(`/matches/live/${matchId}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating match format:", error)
    return { success: false, error: "Failed to update match format." }
  }
}

// Admin function to get all matches for privileged user
export async function getAllMatches(options: {
  limit?: number
  offset?: number
  search?: string
} = {}): Promise<{ matches: Match[], total: number, hasMore: boolean }> {
  try {
    const user = await getCurrentUser()

    // Check if user has admin access
    if (!user || !isAdmin(user.email)) {
      return { matches: [], total: 0, hasMore: false }
    }

    const { databases } = await createAdminClient()
    const { limit = 20, offset = 0, search = "" } = options

    // Build query
    const queries: string[] = []

    // Add search functionality if provided
    if (search.trim()) {
      // For search, we'll need to get all matches first and filter client-side
      // as Appwrite doesn't support complex text search across multiple fields
      queries.push(Query.orderDesc("$createdAt"))
      queries.push(Query.limit(1000).toString()) // Get more for search
    } else {
      // Regular pagination
      queries.push(Query.orderDesc("$createdAt"))
      queries.push(Query.limit(limit).toString())
      queries.push(Query.offset(offset).toString())
    }

    const response = await withRetry(() =>
      databases.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_MATCHES_COLLECTION_ID,
        queries
      )
    )

    let matches = response.documents as unknown as Match[]

    // If search term provided, filter matches
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      matches = matches.filter(match => {
        // Search in tournament name
        if (match.tournamentName?.toLowerCase().includes(searchLower)) return true

        // We'll need to populate players to search in player names
        // For now, just search in tournament and user data
        return false
      })

      // Apply pagination after filtering
      const total = matches.length
      matches = matches.slice(offset, offset + limit)
      return {
        matches,
        total,
        hasMore: (offset + limit) < total
      }
    }

    // Get total count for pagination
    const totalResponse = await withRetry(() =>
      databases.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_MATCHES_COLLECTION_ID,
        [Query.orderDesc("$createdAt")]
      )
    )

    const total = totalResponse.total
    const hasMore = (offset + limit) < total

    return { matches, total, hasMore }
  } catch (error) {
    console.error("Error fetching all matches:", error)
    return { matches: [], total: 0, hasMore: false }
  }
}

// Utility function to normalize text for diacritic-insensitive search
function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose characters with diacritics
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritic marks
    .trim()
}

// Enhanced version with player data populated - optimized for search across ALL matches
export async function getAllMatchesWithPlayers(options: {
  limit?: number
  offset?: number
  search?: string
} = {}): Promise<{
  matches: (Match & {
    playerOneName: string
    playerTwoName: string
    playerThreeName?: string
    playerFourName?: string
    createdByEmail?: string
  })[], total: number, hasMore: boolean
}> {
  try {
    const user = await getCurrentUser()

    // Check if user has admin access
    if (!user || !isAdmin(user.email)) {
      return { matches: [], total: 0, hasMore: false }
    }

    const { databases } = await createAdminClient()
    const { limit = 20, offset = 0, search = "" } = options
    const isSearching = search.trim().length > 0

    // When searching, we need to load more matches to search across ALL matches
    // When not searching, use efficient pagination
    const queries = [Query.orderDesc("$createdAt")]

    if (isSearching) {
      // Load more matches for comprehensive search
      // Adjust this number based on your database size and performance requirements
      // 1000 is a reasonable balance between search coverage and performance
      queries.push(Query.limit(1000))
    } else {
      // Normal pagination when not searching
      queries.push(Query.limit(limit))
      queries.push(Query.offset(offset))
    }

    const response = await withRetry(() =>
      databases.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_MATCHES_COLLECTION_ID,
        queries
      )
    )

    const matches = response.documents as unknown as Match[]

    // Get unique player IDs and user IDs to batch fetch
    const playerIds = new Set<string>()
    const userIds = new Set<string>()

    matches.forEach(match => {
      if (match.playerOneId && !match.playerOneId.startsWith('anonymous')) playerIds.add(match.playerOneId)
      if (match.playerTwoId && !match.playerTwoId.startsWith('anonymous')) playerIds.add(match.playerTwoId)
      if (match.playerThreeId && !match.playerThreeId.startsWith('anonymous')) playerIds.add(match.playerThreeId)
      if (match.playerFourId && !match.playerFourId.startsWith('anonymous')) playerIds.add(match.playerFourId)
      if (match.userId) userIds.add(match.userId)
    })

    // Batch fetch players and users
    const [playersMap, usersMap] = await Promise.all([
      batchGetPlayers(Array.from(playerIds)),
      batchGetUsers(Array.from(userIds))
    ])

    // Enhance matches with populated data
    const enhancedMatches = matches.map(match => {
      const playerOne = playersMap.get(match.playerOneId)
      const playerTwo = playersMap.get(match.playerTwoId)
      const playerThree = playersMap.get(match.playerThreeId || '')
      const playerFour = playersMap.get(match.playerFourId || '')
      const creator = usersMap.get(match.userId)

      // Helper function to get player display name
      const getPlayerName = (player: Player | undefined): string => {
        if (!player) return "Unknown Player"
        return `${player.firstName} ${player.lastName}`.trim()
      }

      return {
        ...match,
        playerOneName: getPlayerName(playerOne),
        playerTwoName: getPlayerName(playerTwo),
        playerThreeName: playerThree ? getPlayerName(playerThree) : undefined,
        playerFourName: playerFour ? getPlayerName(playerFour) : undefined,
        createdByEmail: creator,
        playerOne: playerOne || undefined,
        playerTwo: playerTwo || undefined,
        playerThree: playerThree || undefined,
        playerFour: playerFour || undefined,
      }
    })

    // Apply search filter with diacritic-insensitive matching
    let filteredMatches = enhancedMatches
    if (isSearching) {
      const normalizedSearch = normalizeForSearch(search)
      filteredMatches = enhancedMatches.filter(match => {
        // Helper function to safely normalize and check text
        const matchesText = (text: string | undefined): boolean => {
          if (!text) return false
          return normalizeForSearch(text).includes(normalizedSearch)
        }

        return (
          matchesText(match.playerOneName) ||
          matchesText(match.playerTwoName) ||
          matchesText(match.playerThreeName) ||
          matchesText(match.playerFourName) ||
          matchesText(match.tournamentName) ||
          matchesText(match.createdByEmail)
        )
      })

      // For search results, apply pagination to filtered results
      const total = filteredMatches.length
      const paginatedMatches = filteredMatches.slice(offset, offset + limit)
      const hasMore = (offset + limit) < total

      return {
        matches: paginatedMatches,
        total,
        hasMore
      }
    } else {
      // For non-search results, get total count for pagination info
      const totalResponse = await withRetry(() =>
        databases.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_MATCHES_COLLECTION_ID,
          [Query.orderDesc("$createdAt")]
        )
      )

      const total = totalResponse.total
      const hasMore = (offset + limit) < total

      return {
        matches: enhancedMatches,
        total,
        hasMore
      }
    }
  } catch (error) {
    console.error("Error fetching all matches with players:", error)
    return { matches: [], total: 0, hasMore: false }
  }
}

// Batch fetch players to reduce API calls
async function batchGetPlayers(playerIds: string[]): Promise<Map<string, Player>> {
  if (playerIds.length === 0) return new Map()

  try {
    const { databases } = await createAdminClient()

    const response = await withRetry(() =>
      databases.listDocuments<Player>(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PLAYERS_COLLECTION_ID,
        [
          Query.equal("$id", playerIds),
          Query.limit(100) // Batch limit
        ]
      )
    )

    const playersMap = new Map<string, Player>()
    response.documents.forEach((player) => {
      playersMap.set(player.$id, player)
    })

    return playersMap
  } catch (error) {
    console.error("Error batch fetching players:", error)
    return new Map()
  }
}

// Batch fetch user emails using Appwrite Users API
async function batchGetUsers(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map()

  try {
    const { users } = await createAdminClient()
    const usersMap = new Map<string, string>()

    // Appwrite Users API doesn't support batch queries, so we need to fetch individually
    // But we can do it in parallel to optimize performance
    const userPromises = userIds.map(async (userId) => {
      try {
        const user = await withRetry(() => users.get(userId))
        return { id: userId, email: user.email }
      } catch (error) {
        console.warn(`Could not fetch user ${userId}:`, error)
        return { id: userId, email: 'Unknown User' }
      }
    })

    const userResults = await Promise.all(userPromises)
    userResults.forEach(({ id, email }) => {
      usersMap.set(id, email)
    })

    return usersMap
  } catch (error) {
    console.error("Error batch fetching users:", error)
    return new Map()
  }
}

// Legacy function - replaced by batchGetUsers for better performance
// async function getCreatorEmail(userId: string): Promise<string | undefined> {
//   try {
//     const { databases } = await createAdminClient()
//     const user = await databases.getDocument(
//       process.env.APPWRITE_DATABASE_ID!,
//       process.env.APPWRITE_USERS_COLLECTION_ID!,
//       userId
//     )
//     return user.email
//   } catch {
//     return undefined
//   }
// }

