/**
 * Batch Operations for Database Queries
 * Optimizes database access by batching multiple operations
 */

import { Query } from "node-appwrite"
import { createAdminClient } from "@/lib/appwrite-server"
import { getCurrentUser } from "@/lib/auth"
import { Player, Match } from "@/lib/types"
import { logger } from "@/lib/utils/logger"
import { cacheManager, CACHE_KEYS, CACHE_DURATIONS } from "./cache-manager"
import { withResult, withRetry, Result, AppwriteErrorHandler } from "./error-handler"

/**
 * Debug function to check environment variables
 */
export function debugEnvironmentVariables() {
  const requiredVars = {
    APPWRITE_DATABASE_ID: process.env.APPWRITE_DATABASE_ID,
    APPWRITE_PLAYERS_COLLECTION_ID: process.env.APPWRITE_PLAYERS_COLLECTION_ID,
    APPWRITE_MATCHES_COLLECTION_ID: process.env.APPWRITE_MATCHES_COLLECTION_ID,
    APPWRITE_API_KEY: process.env.APPWRITE_API_KEY ? 'SET' : 'NOT SET',
    NEXT_PUBLIC_APPWRITE_ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    NEXT_PUBLIC_APPWRITE_PROJECT: process.env.NEXT_PUBLIC_APPWRITE_PROJECT,
    APPWRITE_PROFILE_PICTURES_BUCKET_ID: process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID
  }
  
  logger.debug("Environment variables check:", requiredVars)
  return requiredVars
}

/**
 * Batch fetch players by IDs with caching
 */
export async function batchGetPlayers(playerIds: string[]): Promise<Record<string, Player>> {
  const result = await withResult(async () => {
    if (!playerIds || playerIds.length === 0) {
      return {}
    }

    // Filter out invalid IDs
    const validPlayerIds = playerIds.filter(id => 
      id && 
      typeof id === 'string' && 
      id.trim() !== '' && 
      !id.startsWith('anonymous-') &&
      id.length > 10
    )

    if (validPlayerIds.length === 0) {
      return {}
    }

    const players: Record<string, Player> = {}
    const uncachedIds: string[] = []

    // Check cache first
    for (const playerId of validPlayerIds) {
      const cachedPlayer = cacheManager.get<Player>(CACHE_KEYS.PLAYER(playerId))
      if (cachedPlayer) {
        players[playerId] = cachedPlayer
      } else {
        uncachedIds.push(playerId)
      }
    }

    // Fetch uncached players
    if (uncachedIds.length > 0) {
      const { databases } = await createAdminClient()
      
      // Batch fetch players in chunks of 25 (Appwrite Query.or limit)
      const chunkSize = 25
      const chunks = []
      
      for (let i = 0; i < uncachedIds.length; i += chunkSize) {
        chunks.push(uncachedIds.slice(i, i + chunkSize))
      }

      const fetchPromises = chunks.map(async (chunk) => {
        const chunkResult = await withResult(async () => {
          const response = await databases.listDocuments<Player>(
            process.env.APPWRITE_DATABASE_ID!,
            process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
            chunk.length === 1 
              ? [Query.equal('$id', chunk[0])]
              : [Query.equal('$id', chunk)]
          )
          return response.documents
        }, { operation: 'fetch_player_chunk', chunkSize: chunk.length })

        if (chunkResult.isError()) {
          logger.error(`Error fetching player chunk:`, chunkResult.getError())
          return []
        }

        return chunkResult.getValue() || []
      })

      const fetchedPlayerArrays = await Promise.all(fetchPromises)
      const fetchedPlayers = fetchedPlayerArrays.flat()

      // Add profile picture URLs and cache players
      for (const player of fetchedPlayers) {
        const playerWithPicture = {
          ...player,
          profilePictureUrl: player.profilePictureId && process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID && process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID !== 'profile-pictures-bucket-id'
            ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID}/files/${player.profilePictureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`
            : undefined
        } as Player

        players[player.$id] = playerWithPicture
        cacheManager.set(CACHE_KEYS.PLAYER(player.$id), playerWithPicture, CACHE_DURATIONS.PLAYER_DATA)
      }
    }

    // Cache the batch result
    const batchKey = CACHE_KEYS.BATCH_PLAYERS(validPlayerIds)
    cacheManager.set(batchKey, players, CACHE_DURATIONS.PLAYER_DATA)

    return players
  }, { operation: 'batch_get_players', playerCount: playerIds.length })

  if (result.isError()) {
    logger.error("Error in batch player fetch:", result.getError())
    return {}
  }

  return result.getValue() || {}
}

/**
 * Batch fetch matches with populated player data
 */
export async function batchGetMatchesWithPlayers(matchIds: string[]): Promise<Match[]> {
  const result = await withResult(async () => {
    if (!matchIds || matchIds.length === 0) {
      return []
    }

    const user = await getCurrentUser()
    if (!user) {
      return []
    }

    const { databases } = await createAdminClient()
    
    // Batch fetch matches
    const matches: Match[] = []
    const chunkSize = 25
    
    for (let i = 0; i < matchIds.length; i += chunkSize) {
      const chunk = matchIds.slice(i, i + chunkSize)
      
      const chunkResult = await withResult(async () => {
        const response = await databases.listDocuments<Match>(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_MATCHES_COLLECTION_ID!,
          [
            Query.equal('$id', chunk),
            Query.equal('userId', user.$id)
          ]
        )
        return response.documents
      }, { operation: 'fetch_match_chunk', chunkSize: chunk.length })

      if (chunkResult.isError()) {
        logger.error(`Error fetching match chunk:`, chunkResult.getError())
        continue
      }

      matches.push(...(chunkResult.getValue() || []))
    }

    // Extract all player IDs from matches
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

    return populatedMatches
  }, { operation: 'batch_get_matches_with_players', matchCount: matchIds.length })

  if (result.isError()) {
    logger.error("Error in batch matches fetch:", result.getError())
    return []
  }

  return result.getValue() || []
}

/**
 * Get comprehensive dashboard data with caching
 */
export async function getDashboardData(userId: string) {
  const cacheKey = CACHE_KEYS.DASHBOARD_STATS(userId)
  const cached = cacheManager.get<{
    matches: Match[]
    players: Player[]
    mainPlayer: Player | null
    totalMatches: number
    recentMatches: Match[]
  }>(cacheKey)

  if (cached) {
    return cached
  }

  const result = await withResult(async () => {
    const { databases } = await createAdminClient()

    // Validate environment variables
    if (!process.env.APPWRITE_DATABASE_ID || !process.env.APPWRITE_MATCHES_COLLECTION_ID || !process.env.APPWRITE_PLAYERS_COLLECTION_ID) {
      throw new Error('Missing required Appwrite environment variables')
    }

    // Fetch recent matches and all players in parallel
    const [matchesResult, playersResult] = await Promise.all([
      withResult(async () => {
        const response = await databases.listDocuments<Match>(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_MATCHES_COLLECTION_ID!,
          [
            Query.equal('userId', userId),
            Query.orderDesc('matchDate'),
            Query.limit(50) // Get recent matches for dashboard
          ]
        )
        return response
      }, { operation: 'fetch_dashboard_matches', userId }),
      withResult(async () => {
        const response = await databases.listDocuments<Player>(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
          [
            Query.equal('userId', userId),
            Query.orderDesc('$createdAt'),
            Query.limit(100) // Increase limit to get all players
          ]
        )
        return response
      }, { operation: 'fetch_dashboard_players', userId })
    ])

    if (matchesResult.isError()) {
      throw new Error(`Failed to fetch matches: ${matchesResult.getError()?.message}`)
    }

    if (playersResult.isError()) {
      throw new Error(`Failed to fetch players: ${playersResult.getError()?.message}`)
    }

    const matchesResponse = matchesResult.getValue()!
    const playersResponse = playersResult.getValue()!

    const matches = matchesResponse.documents
    const players = playersResponse.documents.map(player => ({
      ...player,
      profilePictureUrl: player.profilePictureId && process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID && process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID !== 'profile-pictures-bucket-id'
        ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID}/files/${player.profilePictureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`
        : undefined
    })) as Player[]

    // Handle cases where isMainPlayer might be undefined or false
    const mainPlayer = players.find(p => p.isMainPlayer === true) || null

    // Extract unique player IDs from matches
    const playerIds = new Set<string>()
    matches.forEach(match => {
      if (match.playerOneId) playerIds.add(match.playerOneId)
      if (match.playerTwoId) playerIds.add(match.playerTwoId)
      if (match.playerThreeId) playerIds.add(match.playerThreeId)
      if (match.playerFourId) playerIds.add(match.playerFourId)
    })

    // Create player lookup map
    const playerLookup: Record<string, Player> = {}
    players.forEach(player => {
      playerLookup[player.$id] = player
    })

    // Populate matches with player data
    const populatedMatches = matches.map(match => ({
      ...match,
      playerOne: playerLookup[match.playerOneId] || null,
      playerTwo: playerLookup[match.playerTwoId] || null,
      playerThree: match.playerThreeId ? playerLookup[match.playerThreeId] : undefined,
      playerFour: match.playerFourId ? playerLookup[match.playerFourId] : undefined,
      pointLog: match.pointLog || [],
      setDurations: match.setDurations 
        ? (match.setDurations as unknown as string[]).map(duration => parseInt(duration, 10))
        : [],
    }))

    const result = {
      matches: populatedMatches,
      players,
      mainPlayer,
      totalMatches: matchesResponse.total,
      recentMatches: populatedMatches.slice(0, 10)
    }

    // Cache the result
    cacheManager.set(cacheKey, result, CACHE_DURATIONS.DASHBOARD_STATS)

    return result
  }, { operation: 'get_dashboard_data', userId })

  if (result.isError()) {
    const error = result.getError()!
    logger.error("Error fetching dashboard data:", {
      type: error.type,
      message: error.message,
      code: error.code,
      context: error.context,
      timestamp: error.timestamp,
      userId: error.userId
    })
    
    return {
      matches: [],
      players: [],
      mainPlayer: null,
      totalMatches: 0,
      recentMatches: []
    }
  }

  return result.getValue()!
}

/**
 * Batch update cache invalidation
 */
export function invalidateCacheForUser(userId: string) {
  cacheManager.delete(CACHE_KEYS.DASHBOARD_STATS(userId))
  cacheManager.delete(CACHE_KEYS.MATCHES_BY_USER(userId))
  cacheManager.delete(CACHE_KEYS.PLAYERS_BY_USER(userId))
  cacheManager.delete(CACHE_KEYS.MAIN_PLAYER(userId))
  cacheManager.clearPattern(`batch-players:*`)
}

/**
 * Lightweight dashboard data fetching - optimized for initial page load
 */
export async function getDashboardDataLite(userId: string) {
  const cacheKey = `${CACHE_KEYS.DASHBOARD_STATS(userId)}:lite`
  const cached = cacheManager.get<{
    mainPlayer: Player | null
    players: Player[]
    totalMatches: number
  }>(cacheKey)

  if (cached) {
    return cached
  }

  const result = await withResult(async () => {
    const { databases } = await createAdminClient()

    // Validate environment variables
    if (!process.env.APPWRITE_DATABASE_ID || !process.env.APPWRITE_PLAYERS_COLLECTION_ID || !process.env.APPWRITE_MATCHES_COLLECTION_ID) {
      throw new Error('Missing required Appwrite environment variables')
    }

    // Only fetch players and match count, not the actual matches
    const playersResult = await withResult(async () => {
      const response = await databases.listDocuments<Player>(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(100)
        ]
      )
      return response
    }, { operation: 'fetch_lite_players', userId })

    if (playersResult.isError()) {
      throw new Error(`Failed to fetch players: ${playersResult.getError()?.message}`)
    }

    const playersResponse = playersResult.getValue()!
    const players = playersResponse.documents.map(player => ({
      ...player,
      profilePictureUrl: player.profilePictureId && process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID && process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID !== 'profile-pictures-bucket-id'
        ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID}/files/${player.profilePictureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`
        : undefined
    })) as Player[]

    const mainPlayer = players.find(p => p.isMainPlayer === true) || null
    
    // Get total match count without fetching matches
    let totalMatches = 0
    if (mainPlayer) {
      const countResult = await withResult(async () => {
        const response = await databases.listDocuments(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_MATCHES_COLLECTION_ID!,
          [
            Query.equal('userId', userId),
            Query.limit(1) // Just to get the total
          ]
        )
        return response
      }, { operation: 'fetch_match_count', userId })

      if (countResult.isError()) {
        logger.warn(`Failed to fetch match count: ${countResult.getError()?.message}`)
        totalMatches = 0
      } else {
        totalMatches = countResult.getValue()!.total
      }
    }

    const result = {
      mainPlayer,
      players,
      totalMatches
    }

    // Cache with shorter duration for lite data
    cacheManager.set(cacheKey, result, CACHE_DURATIONS.PLAYER_DATA / 2)

    return result
  }, { operation: 'get_dashboard_data_lite', userId })

  if (result.isError()) {
    const error = result.getError()!
    logger.error("Error fetching lite dashboard data:", {
      type: error.type,
      message: error.message,
      code: error.code,
      context: error.context,
      timestamp: error.timestamp,
      userId: error.userId
    })
    
    return {
      mainPlayer: null,
      players: [],
      totalMatches: 0
    }
  }

  return result.getValue()!
}

/**
 * Preload critical data for user session
 */
export async function preloadUserData(userId: string) {
  try {
    // Preload dashboard data
    await getDashboardData(userId)
    
    // Preload players
    const players = await batchGetPlayers([])
    
    logger.debug(`Preloaded data for user ${userId}:`, {
      playersCount: Object.keys(players).length
    })
  } catch (error) {
    logger.error("Error preloading user data:", error)
  }
}