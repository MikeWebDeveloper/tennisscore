/**
 * Cached match functions for internal use
 */

import { ID, Query } from "node-appwrite"
import { createAdminClient, withRetry } from "@/lib/appwrite-server"
import { Match } from "@/lib/types"
import { logger } from "@/lib/utils/logger"
import { CACHE_KEYS, CACHE_DURATIONS, cached } from "@/lib/utils/cache-manager"
import { batchGetPlayers } from "@/lib/utils/batch-operations"

/**
 * Get match by ID with caching and batch player loading
 */
export const getMatchByIdCached = cached(
  async (matchId: string, userId: string): Promise<Match | null> => {
    const { databases } = await createAdminClient()

    try {
      const match = await databases.getDocument<Match>(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_MATCHES_COLLECTION_ID!,
        matchId
      )

      // Ensure the user owns this match
      if (match.userId !== userId) {
        logger.error("User does not have permission to view this match")
        return null
      }

      // Batch fetch all players for this match
      const playerIds = [
        match.playerOneId,
        match.playerTwoId,
        match.playerThreeId,
        match.playerFourId
      ].filter((id): id is string => Boolean(id))

      const players = await batchGetPlayers(playerIds)

      return {
        ...match,
        playerOne: players[match.playerOneId] || null,
        playerTwo: players[match.playerTwoId] || null,
        playerThree: match.playerThreeId ? players[match.playerThreeId] : undefined,
        playerFour: match.playerFourId ? players[match.playerFourId] : undefined,
        pointLog: match.pointLog || [],
        setDurations: match.setDurations 
          ? (match.setDurations as unknown as string[]).map(duration => parseInt(duration, 10))
          : [],
      }
    } catch (error) {
      logger.error(`Failed to fetch match ${matchId}:`, error)
      return null
    }
  },
  (matchId: string) => CACHE_KEYS.MATCH(matchId),
  CACHE_DURATIONS.MATCH_DATA
)

/**
 * Get matches by user with caching
 */
export const getMatchesByUserCached = cached(
  async (userId: string): Promise<Match[]> => {
    const { databases } = await createAdminClient()

    try {
      const response = await withRetry(() =>
        databases.listDocuments(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_MATCHES_COLLECTION_ID!,
          [
            Query.equal("userId", userId),
            Query.orderDesc("$createdAt"),
            Query.limit(1000)
          ]
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
      logger.error("Error fetching matches:", error)
      return []
    }
  },
  (userId: string) => CACHE_KEYS.MATCHES_BY_USER(userId),
  CACHE_DURATIONS.MATCH_DATA
)

/**
 * Get matches by player with caching
 */
export const getMatchesByPlayerCached = cached(
  async (playerId: string, userId: string): Promise<Match[]> => {
    const { databases } = await createAdminClient()

    try {
      const response = await withRetry(() =>
        databases.listDocuments(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_MATCHES_COLLECTION_ID!,
          [
            Query.equal("userId", userId),
            Query.or([
              Query.equal("playerOneId", playerId),
              Query.equal("playerTwoId", playerId),
              Query.equal("playerThreeId", playerId),
              Query.equal("playerFourId", playerId)
            ])
          ]
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
      logger.error("Error fetching player matches:", error)
      return []
    }
  },
  (playerId: string) => CACHE_KEYS.MATCHES_BY_PLAYER(playerId),
  CACHE_DURATIONS.MATCH_DATA
)