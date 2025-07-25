"use server"

import { getCurrentUser } from "@/lib/auth"
import { createAdminClient } from "@/lib/appwrite-server"
import { Query } from "node-appwrite"
import { Match, Player } from "@/lib/types"

export async function getMatchesWithStats(playerId: string): Promise<Match[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  try {
    const { databases } = await createAdminClient()
    
    // Get all matches where the player participated
    const matchesResponse = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      [
        Query.or([
          Query.equal("playerOneId", playerId),
          Query.equal("playerTwoId", playerId),
          Query.equal("playerThreeId", playerId),
          Query.equal("playerFourId", playerId)
        ]),
        Query.orderDesc("matchDate"),
        Query.limit(1000) // Get up to 1000 matches for statistics
      ]
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
      const playersResponse = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        [Query.equal("$id", Array.from(playerIds))]
      )
      
      playersResponse.documents.forEach(player => {
        playersMap.set(player.$id, player as Player)
      })
    }

    // Map matches with player data
    return matchesResponse.documents.map(match => ({
      ...match,
      playerOne: match.playerOneId ? playersMap.get(match.playerOneId) : undefined,
      playerTwo: match.playerTwoId ? playersMap.get(match.playerTwoId) : undefined,
      playerThree: match.playerThreeId ? playersMap.get(match.playerThreeId) : undefined,
      playerFour: match.playerFourId ? playersMap.get(match.playerFourId) : undefined,
    })) as Match[]
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
  const matches = await getMatchesWithStats(playerId)
  const completedMatches = matches.filter(m => m.status === 'completed')
  
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