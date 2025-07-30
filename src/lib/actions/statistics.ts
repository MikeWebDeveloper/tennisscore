"use server"

import { getCurrentUser } from "@/lib/auth"
import { createAdminClient } from "@/lib/appwrite-server"
import { Query } from "node-appwrite"
import { Match, Player } from "@/lib/types"

// Simple in-memory cache for statistics (in production, use Redis)
const statisticsCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCachedStats(key: string) {
  const cached = statisticsCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

function setCachedStats(key: string, data: any) {
  statisticsCache.set(key, { data, timestamp: Date.now() })
}

export async function getMatchesWithStats(playerId: string, options: {
  limit?: number;
  status?: string;
  dateAfter?: string;
} = {}): Promise<Match[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  try {
    const { databases } = await createAdminClient()
    const { limit = 50, status, dateAfter } = options
    
    // Build efficient query with proper indexing
    const queries = [
      Query.or([
        Query.equal("playerOneId", playerId),
        Query.equal("playerTwoId", playerId),
        Query.equal("playerThreeId", playerId),
        Query.equal("playerFourId", playerId)
      ]),
      Query.orderDesc("matchDate"),
      Query.limit(limit) // Use reasonable limit instead of 1000
    ]

    // Add optional filters that work with our indexes
    if (status) {
      queries.push(Query.equal("status", status))
    }
    if (dateAfter) {
      queries.push(Query.greaterThan("matchDate", dateAfter))
    }
    
    // Get matches with efficient query
    const matchesResponse = await databases.listDocuments<Match>(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      queries
    )

    // Get all unique player IDs from matches
    const playerIds = new Set<string>()
    matchesResponse.documents.forEach(match => {
      if (match.playerOneId) playerIds.add(match.playerOneId)
      if (match.playerTwoId) playerIds.add(match.playerTwoId)
      if (match.playerThreeId) playerIds.add(match.playerThreeId)
      if (match.playerFourId) playerIds.add(match.playerFourId)
    })

    // Fetch all players in one query
    const playersMap = new Map<string, Player>()
    if (playerIds.size > 0) {
      const playersResponse = await databases.listDocuments<Player>(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        [Query.equal("$id", Array.from(playerIds))]
      )
      
      playersResponse.documents.forEach(player => {
        playersMap.set(player.$id, player)
      })
    }

    // Map matches with player data
    return matchesResponse.documents.map(match => ({
      ...match,
      playerOne: match.playerOneId ? playersMap.get(match.playerOneId) : undefined,
      playerTwo: match.playerTwoId ? playersMap.get(match.playerTwoId) : undefined,
      playerThree: match.playerThreeId ? playersMap.get(match.playerThreeId) : undefined,
      playerFour: match.playerFourId ? playersMap.get(match.playerFourId) : undefined,
    }))
  } catch (error) {
    console.error("Error fetching matches with stats:", error)
    return []
  }
}

export async function getPlayerComparisons(playerId: string): Promise<{
  opponent: Player
  matches: number
  wins: number
  losses: number
  winRate: number
}[]> {
  // Only fetch completed matches for statistics - much more efficient
  const matches = await getMatchesWithStats(playerId, { 
    status: 'completed',
    limit: 200 // Reasonable limit for opponent statistics
  })
  const completedMatches = matches
  
  const opponentStats = new Map<string, {
    opponent: Player
    matches: number
    wins: number
  }>()

  completedMatches.forEach(match => {
    // Determine opponent ID
    let opponentId: string | undefined
    if (match.playerOneId === playerId && match.playerTwo) {
      opponentId = match.playerTwoId
    } else if (match.playerTwoId === playerId && match.playerOne) {
      opponentId = match.playerOneId
    }
    
    if (!opponentId) return

    const opponent = match.playerOneId === opponentId ? match.playerOne : match.playerTwo
    if (!opponent) return

    if (!opponentStats.has(opponentId)) {
      opponentStats.set(opponentId, {
        opponent,
        matches: 0,
        wins: 0
      })
    }

    const stats = opponentStats.get(opponentId)!
    stats.matches++
    if (match.winnerId === playerId) {
      stats.wins++
    }
  })

  return Array.from(opponentStats.values()).map(stats => ({
    ...stats,
    losses: stats.matches - stats.wins,
    winRate: Math.round((stats.wins / stats.matches) * 100)
  })).sort((a, b) => b.matches - a.matches)
}