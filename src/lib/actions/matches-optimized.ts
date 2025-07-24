/**
 * Optimized Match Actions with Caching and Batch Operations
 * Provides high-performance database operations with intelligent caching
 */

"use server"

import { ID, Query } from "node-appwrite"
import { createAdminClient, withRetry } from "@/lib/appwrite-server"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Match, MatchFormat } from "@/lib/types"
import { logger } from "@/lib/utils/logger"
import { CACHE_INVALIDATION, cached, CACHE_KEYS, CACHE_DURATIONS } from "@/lib/utils/cache-manager"
import { getDashboardData, batchGetPlayers } from "@/lib/utils/batch-operations"
import { cacheMatches, getCachedMatches, isIndexedDBSupported, indexedDBManager } from "@/lib/utils/indexeddb-storage"
import { getMatchByIdCached, getMatchesByUserCached, getMatchesByPlayerCached } from "@/lib/utils/cached-match-functions"

/**
 * Get match by ID (public interface)
 */
export async function getMatchById(matchId: string): Promise<Match | null> {
  const user = await getCurrentUser()
  if (!user) {
    logger.error("Unauthorized attempt to fetch match")
    return null
  }

  return getMatchByIdCached(matchId, user.$id)
}


/**
 * Get matches by user with offline support (public interface)
 */
export async function getMatchesByUser(): Promise<Match[]> {
  const user = await getCurrentUser()
  if (!user) return []

  try {
    const matches = await getMatchesByUserCached(user.$id)
    
    // Cache in IndexedDB for offline access (fire and forget)
    if (isIndexedDBSupported() && matches.length > 0) {
      cacheMatches(matches).catch(error => 
        logger.error('Failed to cache matches in IndexedDB:', error)
      )
    }
    
    return matches
  } catch (error) {
    logger.error('Failed to fetch matches from server, trying offline cache:', error)
    
    // Try to get from offline cache
    if (isIndexedDBSupported()) {
      try {
        const cachedMatches = await getCachedMatches()
        if (cachedMatches.length > 0) {
          logger.info(`Retrieved ${cachedMatches.length} matches from offline cache`)
          return cachedMatches as Match[]
        }
      } catch (cacheError) {
        logger.error('Failed to retrieve matches from offline cache:', cacheError)
      }
    }
    
    return []
  }
}


/**
 * Get matches by player with offline support (public interface)
 */
export async function getMatchesByPlayer(playerId: string, limit?: number, offset?: number): Promise<Match[]> {
  const user = await getCurrentUser()
  if (!user) return []

  // For paginated requests, we'll use the paginated version
  if (limit || offset) {
    return getMatchesByPlayerPaginated(playerId, user.$id, limit, offset)
  }

  try {
    const matches = await getMatchesByPlayerCached(playerId, user.$id)
    
    // Cache in IndexedDB for offline access (fire and forget)
    if (isIndexedDBSupported() && matches.length > 0) {
      cacheMatches(matches).catch(error => 
        logger.error('Failed to cache player matches in IndexedDB:', error)
      )
    }
    
    return matches
  } catch (error) {
    logger.error(`Failed to fetch matches for player ${playerId} from server, trying offline cache:`, error)
    
    // Try to get from offline cache
    if (isIndexedDBSupported()) {
      try {
        const cachedMatches = await indexedDBManager.getMatchesByPlayerId(playerId)
        if (cachedMatches.length > 0) {
          logger.info(`Retrieved ${cachedMatches.length} matches for player ${playerId} from offline cache`)
          return cachedMatches as Match[]
        }
      } catch (cacheError) {
        logger.error('Failed to retrieve player matches from offline cache:', cacheError)
      }
    }
    
    return []
  }
}

/**
 * Get paginated matches by player with caching
 */
const getMatchesByPlayerPaginated = cached(
  async (playerId: string, _userId: string, limit?: number, offset?: number): Promise<Match[]> => {
    const { databases } = await createAdminClient()
    try {
      const queries = [
        Query.equal("userId", _userId),
        Query.or([
          Query.equal("playerOneId", playerId),
          Query.equal("playerTwoId", playerId),
          Query.equal("playerThreeId", playerId),
          Query.equal("playerFourId", playerId)
        ]),
        Query.orderDesc("matchDate")
      ]

      // Add limit if specified
      if (limit && limit > 0) {
        queries.push(Query.limit(limit))
      }
      
      // Add offset if specified
      if (offset && offset > 0) {
        queries.push(Query.offset(offset))
      }

      const response = await withRetry(() =>
        databases.listDocuments(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_MATCHES_COLLECTION_ID!,
          queries
        )
      )
      
      const matches = response.documents as unknown as Match[]

      // Extract all unique player IDs
      const playerIds = new Set<string>()
      matches.forEach(match => {
        if (match.playerOneId) playerIds.add(match.playerOneId)
        if (match.playerTwoId) playerIds.add(match.playerTwoId)
        if (match.playerThreeId) playerIds.add(match.playerThreeId)
        if (match.playerFourId) playerIds.add(match.playerFourId)
      })

      // Batch fetch all players
      const players = await batchGetPlayers(Array.from(playerIds))

      // Populate matches with player data
      return matches.map(match => ({
        ...match,
        playerOne: players[match.playerOneId] || null,
        playerTwo: players[match.playerTwoId] || null,
        playerThree: match.playerThreeId ? players[match.playerThreeId] : undefined,
        playerFour: match.playerFourId ? players[match.playerFourId] : undefined,
        pointLog: match.pointLog || [],
        setDurations: match.setDurations 
          ? (match.setDurations as unknown as string[]).map(duration => parseInt(duration, 10))
          : [],
      }))
    } catch (error) {
      logger.error("Error fetching paginated player matches:", error)
      return []
    }
  },
  (playerId: string, userId: string, limit?: number, offset?: number) => 
    `matches-player-${playerId}-${userId}-${limit || 'all'}-${offset || 0}`,
  CACHE_DURATIONS.MATCH_DATA
)

/**
 * Create match with cache invalidation
 */
export async function createMatch(matchData: {
  playerOneId: string
  playerTwoId: string
  playerThreeId?: string
  playerFourId?: string
  tournamentName?: string
  matchFormat: MatchFormat & { detailLevel: "points" | "simple" | "complex" | "detailed" }
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
      score: "{}",
      pointLog: [],
      events: [],
      matchFormat: JSON.stringify(restOfFormat),
      detailLevel,
      tournamentName: tournamentName || null,
      userId: user.$id,
    }

    logger.debug("Attempting to create match with data:", newMatch)

    const match = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      ID.unique(),
      newMatch
    )

    // Invalidate relevant caches
    const playerIds = [playerOneId, playerTwoId, playerThreeId, playerFourId].filter((id): id is string => Boolean(id))
    CACHE_INVALIDATION.onMatchCreate(user.$id, playerIds)

    return { success: true, matchId: match.$id }
  } catch (error) {
    logger.error("Failed to create match:", JSON.stringify(error, null, 2))
    const errorMessage = (error as { message?: string })?.message || "An unexpected error occurred while creating the match."
    return { error: errorMessage }
  }
}

/**
 * Update match score with cache invalidation
 */
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

    // Get the match to extract player IDs for cache invalidation
    const existingMatch = await databases.getDocument<Match>(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      matchId
    )

    // Serialize pointLog objects to strings since Appwrite expects string arrays
    const serializedPointLog = scoreUpdate.pointLog.map(point => 
      typeof point === 'string' ? point : JSON.stringify(point)
    )

    logger.debug("updateMatchScore called with:", {
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
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_MATCHES_COLLECTION_ID!,
        matchId,
        updateData
      )
    )

    // Invalidate relevant caches
    const playerIds = [
      existingMatch.playerOneId,
      existingMatch.playerTwoId,
      existingMatch.playerThreeId,
      existingMatch.playerFourId
    ].filter((id): id is string => Boolean(id))
    
    CACHE_INVALIDATION.onMatchUpdate(matchId, user.$id, playerIds)

    revalidatePath("/matches")
    revalidatePath(`/live/${matchId}`)
    return { success: true, match: match as unknown as Match }
  } catch (error) {
    logger.error("Error updating match score:", error)
    return { error: error instanceof Error ? error.message : "Failed to update match score" }
  }
}

/**
 * Delete match with cache invalidation
 */
export async function deleteMatch(matchId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const { databases } = await createAdminClient()

  try {
    // First verify the user owns this match and get player IDs
    const match = await databases.getDocument<Match>(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      matchId
    )

    if (match.userId !== user.$id) {
      throw new Error("Unauthorized to delete this match")
    }

    const playerIds = [
      match.playerOneId,
      match.playerTwoId,
      match.playerThreeId,
      match.playerFourId
    ].filter((id): id is string => Boolean(id))

    await withRetry(() =>
      databases.deleteDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_MATCHES_COLLECTION_ID!,
        matchId
      )
    )

    // Invalidate relevant caches
    CACHE_INVALIDATION.onMatchDelete(matchId, user.$id, playerIds)

    revalidatePath("/matches")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    logger.error("Failed to delete match:", error)
    throw error
  }
}

/**
 * Get optimized dashboard data
 */
export async function getDashboardDataOptimized() {
  const user = await getCurrentUser()
  if (!user) return {
    matches: [],
    players: [],
    mainPlayer: null,
    totalMatches: 0,
    recentMatches: []
  }

  return getDashboardData(user.$id)
}

/**
 * Paginated matches with optimization
 */
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
      return { matches: [], total: 0, hasMore: false }
    }

    const { databases } = await createAdminClient()
    const { limit = 15, offset = 0, dateFilter = 'all' } = options

    // Build query with filters
    const queries = [Query.equal("userId", user.$id)]
    
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

    const [response, totalResponse] = await Promise.all([
      withRetry(() =>
        databases.listDocuments(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_MATCHES_COLLECTION_ID!,
          queries
        )
      ),
      withRetry(() =>
        databases.listDocuments(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_MATCHES_COLLECTION_ID!,
          [Query.equal("userId", user.$id)]
        )
      )
    ])

    const matches = response.documents as unknown as Match[]

    // Extract all unique player IDs
    const playerIds = new Set<string>()
    matches.forEach(match => {
      if (match.playerOneId) playerIds.add(match.playerOneId)
      if (match.playerTwoId) playerIds.add(match.playerTwoId)
      if (match.playerThreeId) playerIds.add(match.playerThreeId)
      if (match.playerFourId) playerIds.add(match.playerFourId)
    })

    // Batch fetch all players
    const players = await batchGetPlayers(Array.from(playerIds))

    // Populate matches with player data
    const populatedMatches = matches.map(match => ({
      ...match,
      playerOne: players[match.playerOneId] || null,
      playerTwo: players[match.playerTwoId] || null,
      playerThree: match.playerThreeId ? players[match.playerThreeId] : undefined,
      playerFour: match.playerFourId ? players[match.playerFourId] : undefined,
      pointLog: match.pointLog || [],
      setDurations: match.setDurations 
        ? (match.setDurations as unknown as string[]).map(duration => parseInt(duration, 10))
        : [],
    }))

    const total = totalResponse.total
    const hasMore = (offset + limit) < total

    return { matches: populatedMatches, total, hasMore }
  } catch (error) {
    logger.error("Error fetching paginated matches:", error)
    return { matches: [], total: 0, hasMore: false }
  }
}