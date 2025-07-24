"use server"

import { ID, Query } from "node-appwrite"
import { createAdminClient, withRetry } from "@/lib/appwrite-server"
import { getCurrentUser, isAdmin } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Match, MatchFormat, PointDetail, PointOutcome, ShotType, CourtPosition, Player } from "@/lib/types"
import { getPlayerById } from "./players"

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
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
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
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      matchId
    )

    // Ensure the user owns this match
    if (match.userId !== user.$id) {
      console.error("User does not have permission to view this match")
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
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_MATCHES_COLLECTION_ID!,
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
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_MATCHES_COLLECTION_ID!,
        [
          Query.equal("userId", user.$id),
          Query.orderDesc("$createdAt"),
          Query.limit(1000) // Keep high limit for backward compatibility
        ]
      )
    )

    return response.documents as unknown as Match[]
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

    const response = await withRetry(() =>
      databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_MATCHES_COLLECTION_ID!,
        queries
      )
    )

    // Get total count for pagination info
    const totalResponse = await withRetry(() =>
      databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_MATCHES_COLLECTION_ID!,
        [Query.equal("userId", user.$id)]
      )
    )

    const matches = response.documents as unknown as Match[]
    const total = totalResponse.total
    const hasMore = (offset + limit) < total

    return { matches, total, hasMore }
  } catch (error) {
    console.error("Error fetching paginated matches:", error)
    return { matches: [], total: 0, hasMore: false }
  }
}

export async function getMatchesByPlayer(playerId: string, limit?: number, offset?: number): Promise<Match[]> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return []
    }

    const { databases } = await createAdminClient()

    const queries = [
      Query.equal("userId", user.$id),
      Query.or([
        Query.equal("playerOneId", playerId),
        Query.equal("playerTwoId", playerId)
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

    return response.documents as unknown as Match[]
  } catch (error) {
    console.error("Error fetching player matches:", error)
    return []
  }
}

export async function getMatchesCountByPlayer(playerId: string): Promise<number> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return 0
    }

    const { databases } = await createAdminClient()

    const response = await withRetry(() =>
      databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_MATCHES_COLLECTION_ID!,
        [
          Query.equal("userId", user.$id),
          Query.or([
            Query.equal("playerOneId", playerId),
            Query.equal("playerTwoId", playerId)
          ])
        ]
      )
    )

    return response.total
  } catch (error) {
    console.error("Error fetching player matches count:", error)
    return 0
  }
}

export async function getMatch(matchId: string): Promise<Match> {
  const { databases } = await createAdminClient()
  
  try {
    const match = await withRetry(() =>
      databases.getDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_MATCHES_COLLECTION_ID!,
        matchId
      )
    )
    
    // Convert setDurations from string array to number array
    return {
      ...match,
      setDurations: match.setDurations ? (match.setDurations as unknown as string[]).map(duration => parseInt(duration, 10)) : [],
    } as Match
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
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      matchId
    )

    if (match.userId !== user.$id) {
      throw new Error("Unauthorized to delete this match")
    }

    // Delete the match
    await databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      matchId
    )

    return { success: true }
  } catch (error) {
    console.error("Error deleting match:", error)
    return { error: error instanceof Error ? error.message : "Failed to delete match" }
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
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
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
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
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

// Generate detailed point data for the completed match
export async function generateDetailedPointData(matchId: string = "68494c7fd65b648766ae") {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    const { databases } = await createAdminClient()

    // Generate point-by-point data for 6-4, 6-3 match
    const detailedPoints = generateMatchPoints()
    
    // Serialize points for Appwrite storage
    const serializedPointLog = detailedPoints.map(point => JSON.stringify(point))

    // Update the match with detailed point data
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      matchId,
      {
        pointLog: serializedPointLog
      }
    )

    revalidatePath("/matches")
    revalidatePath(`/matches/${matchId}`)
    return { success: true, pointCount: detailedPoints.length }
  } catch (error) {
    console.error("Error generating detailed point data:", error)
    return { error: error instanceof Error ? error.message : "Failed to generate point data" }
  }
}

function generateMatchPoints(): PointDetail[] {
  const points: PointDetail[] = []
  let pointNumber = 1
  let setNumber = 1
  let gameNumber = 1
  
  // Set 1: 6-4 (Michal wins)
  const set1Games = [
    { p1: 1, p2: 0 }, // 1-0
    { p1: 1, p2: 1 }, // 1-1  
    { p1: 2, p2: 1 }, // 2-1
    { p1: 2, p2: 2 }, // 2-2
    { p1: 3, p2: 2 }, // 3-2
    { p1: 3, p2: 3 }, // 3-3
    { p1: 4, p2: 3 }, // 4-3
    { p1: 4, p2: 4 }, // 4-4
    { p1: 5, p2: 4 }, // 5-4
    { p1: 6, p2: 4 }, // 6-4 SET
  ]

  // Set 2: 6-3 (Michal wins)
  const set2Games = [
    { p1: 1, p2: 0 }, // 1-0
    { p1: 1, p2: 1 }, // 1-1
    { p1: 2, p2: 1 }, // 2-1
    { p1: 3, p2: 1 }, // 3-1
    { p1: 3, p2: 2 }, // 3-2
    { p1: 4, p2: 2 }, // 4-2
    { p1: 4, p2: 3 }, // 4-3
    { p1: 5, p2: 3 }, // 5-3
    { p1: 6, p2: 3 }, // 6-3 MATCH
  ]

  const allSets = [set1Games, set2Games]
  
  allSets.forEach((setGames, setIndex) => {
    setNumber = setIndex + 1
    gameNumber = 1
    
    setGames.forEach((gameResult, gameIndex) => {
      const isLastGameOfSet = gameIndex === setGames.length - 1
      const isLastGameOfMatch = setIndex === 1 && isLastGameOfSet
      
      // Generate points for this game
      const gamePoints = generateGamePoints(
        gameResult, 
        pointNumber, 
        setNumber, 
        gameNumber,
        isLastGameOfSet,
        isLastGameOfMatch
      )
      
      points.push(...gamePoints)
      pointNumber += gamePoints.length
      gameNumber++
    })
  })

  return points
}

function generateGamePoints(gameResult: {p1: number, p2: number}, startingPointNumber: number, setNumber: number, gameNumber: number, isLastGameOfSet: boolean, isLastGameOfMatch: boolean): PointDetail[] {
  const points: PointDetail[] = []
  let pointNumber = startingPointNumber
  
  // Determine who wins this game and server
  const gameWinner: "p1" | "p2" = gameResult.p1 > (gameResult.p2 || 0) ? "p1" : "p2"
  const server: "p1" | "p2" = gameNumber % 2 === 1 ? "p1" : "p2" // Alternate serve each game
  
  // Track actual tennis score progression
  const currentScore = { p1: 0, p2: 0 }
  let pointIndex = 0
  
  // Play points until someone wins the game
  while (true) {
    // Get the game score BEFORE this point is played
    const gameScore = getTennisScore(currentScore.p1, currentScore.p2)
    
    const isGameWinningPoint = isGameComplete(currentScore)
    if (isGameWinningPoint) break
    
    // Determine point winner based on realistic probability
    // If this is the last point needed to reach our target, award to gameWinner
    const shouldGameWinnerWin = isNearGameEnd(currentScore, gameWinner)
    const winner: "p1" | "p2" = shouldGameWinnerWin ? gameWinner : 
                                (Math.random() > 0.5 ? "p1" : "p2")
    
    // **REALISTIC SERVE PATTERNS**
    const isFirstServeIn = Math.random() < 0.65 // 65% first serve success rate
    const isDoubleFault = !isFirstServeIn && Math.random() < 0.08 // 8% chance of double fault when first serve misses
    
    let serveType: "first" | "second"
    let serveOutcome: PointOutcome
    let pointOutcome: PointOutcome
    
    if (isFirstServeIn) {
      serveType = "first"
      serveOutcome = generateRealisticPointOutcome(true, winner === server)
      pointOutcome = serveOutcome
    } else if (isDoubleFault) {
      serveType = "second"
      serveOutcome = "double_fault"
      pointOutcome = "double_fault"
    } else {
      serveType = "second"
      serveOutcome = generateRealisticPointOutcome(false, winner === server)
      pointOutcome = serveOutcome
    }
    
    // Award the point AFTER creating the point detail
    currentScore[winner]++
    
    const isLastPoint = isGameComplete(currentScore)
    
    const point: PointDetail = {
      id: `point_${pointNumber}`,
      timestamp: new Date(Date.now() + pointNumber * 30000).toISOString(),
      pointNumber,
      setNumber,
      gameNumber,
      gameScore, // This is the score BEFORE the point
      winner,
      server,
      serveType,
      serveOutcome,
      servePlacement: ["wide", "body", "t"][Math.floor(Math.random() * 3)] as "wide" | "body" | "t",
      serveSpeed: Math.floor(Math.random() * 40) + 160, // 160-200 km/h
      rallyLength: generateRealisticRallyLength(pointOutcome),
      pointOutcome,
      lastShotType: generateRealisticLastShot(pointOutcome),
      lastShotPlayer: pointOutcome === 'unforced_error' || pointOutcome === 'forced_error' || pointOutcome === 'double_fault' 
        ? (winner === 'p1' ? 'p2' : 'p1') // Error: lastShotPlayer made the error and lost
        : winner, // Winner or ace: lastShotPlayer won the point
      isBreakPoint: server !== gameWinner && isLastPoint,
      isSetPoint: isLastGameOfSet && isLastPoint,
      isMatchPoint: isLastGameOfMatch && isLastPoint,
      isGameWinning: isLastPoint,
      isSetWinning: isLastGameOfSet && isLastPoint,
      isMatchWinning: isLastGameOfMatch && isLastPoint,
      notes: isLastPoint ? "Game winning point" : undefined,
      courtPosition: ["deuce", "ad", "baseline", "net"][Math.floor(Math.random() * 4)] as CourtPosition
    }
    
    points.push(point)
    pointNumber++
    pointIndex++
    
    // Safety check to prevent infinite loops
    if (pointIndex > 20) break
  }
  
  return points
}

// Helper function to check if game is complete
function isGameComplete(score: { p1: number, p2: number }): boolean {
  const { p1, p2 } = score
  
  // Standard game: win by 2, at least 4 points
  if (Math.max(p1, p2) >= 4) {
    return Math.abs(p1 - p2) >= 2
  }
  
  return false
}

// Helper function to determine if we should bias toward game winner
function isNearGameEnd(score: { p1: number, p2: number }, gameWinner: "p1" | "p2"): boolean {
  const winnerScore = score[gameWinner]
  const loserScore = score[gameWinner === "p1" ? "p2" : "p1"]
  
  // If winner is close to winning, bias heavily toward them
  if (winnerScore >= 3) return true
  
  // If it's close, 50/50
  if (Math.abs(winnerScore - loserScore) <= 1) return Math.random() > 0.5
  
  // Otherwise, slight bias toward winner
  return Math.random() > 0.3
}

// Proper tennis scoring function
function getTennisScore(p1Points: number, p2Points: number): string {
  // Tennis scoring: 0, 15, 30, 40, deuce, advantage
  const scoreNames = ["0", "15", "30", "40"]
  
  // Both players under 40 (less than 3 points)
  if (p1Points < 3 && p2Points < 3) {
    return `${scoreNames[p1Points]}-${scoreNames[p2Points]}`
  }
  
  // At least one player has 40 (3+ points)
  if (p1Points >= 3 && p2Points >= 3) {
    // Deuce situation
    if (p1Points === p2Points) {
      return "40-40"
    }
    // Advantage situation
    else if (p1Points > p2Points) {
      return "Ad-40"
    } else {
      return "40-Ad"
    }
  }
  
  // One player has less than 40, other has 40 or more
  const p1Display = p1Points >= 3 ? "40" : scoreNames[p1Points]
  const p2Display = p2Points >= 3 ? "40" : scoreNames[p2Points]
  
  return `${p1Display}-${p2Display}`
}

function generateRealisticPointOutcome(isFirstServe: boolean, serverWins: boolean): PointOutcome {
  if (isFirstServe) {
    // First serve outcomes
    if (Math.random() < 0.08) return "ace" // 8% ace rate on first serves
    if (serverWins) {
      return Math.random() < 0.6 ? "winner" : "forced_error"
    } else {
      return Math.random() < 0.4 ? "unforced_error" : "winner"
    }
  } else {
    // Second serve outcomes (no aces, more conservative)
    if (serverWins) {
      return Math.random() < 0.3 ? "winner" : "forced_error"
    } else {
      return Math.random() < 0.5 ? "unforced_error" : "winner"
    }
  }
}

function generateRealisticRallyLength(pointOutcome: string): number {
  switch (pointOutcome) {
    case "ace":
    case "double_fault":
      return 1
    case "winner":
      return Math.floor(Math.random() * 3) + 1 // 1-3 shots
    case "unforced_error":
      return Math.floor(Math.random() * 5) + 2 // 2-6 shots
    case "forced_error":
      return Math.floor(Math.random() * 6) + 3 // 3-8 shots
    default:
      return Math.floor(Math.random() * 8) + 1 // 1-8 shots
  }
}

function generateRealisticLastShot(pointOutcome: string): ShotType {
  if (pointOutcome === "ace" || pointOutcome === "double_fault") {
    return "serve"
  }
  
  const shots: ShotType[] = ["forehand", "backhand", "volley", "overhead"]
  const weights = [0.45, 0.35, 0.15, 0.05] // Realistic shot distribution
  const random = Math.random()
  let sum = 0
  
  for (let i = 0; i < shots.length; i++) {
    sum += weights[i]
    if (random <= sum) return shots[i]
  }
  
  return "forehand"
}

export async function updateMatchFormat(matchId: string, newFormat: MatchFormat): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    const { databases } = await createAdminClient()

    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
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
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_MATCHES_COLLECTION_ID!,
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
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_MATCHES_COLLECTION_ID!,
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
} = {}): Promise<{ matches: (Match & {
  playerOneName: string
  playerTwoName: string
  playerThreeName?: string
  playerFourName?: string
  createdByEmail?: string
})[], total: number, hasMore: boolean }> {
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
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_MATCHES_COLLECTION_ID!,
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
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_MATCHES_COLLECTION_ID!,
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
      databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        [
          Query.equal("$id", playerIds),
          Query.limit(100) // Batch limit
        ]
      )
    )
    
    const playersMap = new Map<string, Player>()
    response.documents.forEach((player) => {
      const playerData = player as Player
      playersMap.set(player.$id, playerData)
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

 