"use server"

import { ID, Query, Permission, Role } from "node-appwrite"
import { createAdminClient, withRetry } from "@/lib/appwrite-server"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Match, MatchFormat, PointDetail, PointOutcome, ShotType, CourtPosition } from "@/lib/types"

export async function createMatch(matchData: {
  playerOneId: string
  playerTwoId: string
  playerThreeId?: string  // For doubles
  playerFourId?: string   // For doubles
  matchFormat: MatchFormat
}): Promise<{ success?: boolean; matchId?: string; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    const { databases } = await createAdminClient()

    const playerOneId = matchData.playerOneId;
    const playerTwoId = matchData.playerTwoId;
    const playerThreeId = matchData.playerThreeId;
    const playerFourId = matchData.playerFourId;
    
    const docToCreate: Record<string, unknown> = {
      matchFormat: JSON.stringify(matchData.matchFormat),
      matchDate: new Date().toISOString(),
      status: "In Progress",
      score: JSON.stringify({
        sets: [],
        games: [0, 0],
        points: [0, 0],
      }),
      pointLog: [],
      events: [],
      userId: user.$id,
    };

    // For anonymous players, create temporary IDs that can be recognized later
    // We'll use a special prefix that indicates these are not real player IDs
    if (playerOneId.startsWith("anonymous-")) {
      // Use the anonymous ID directly - it will be recognized by the UI
      docToCreate.playerOneId = playerOneId;
    } else {
      docToCreate.playerOneId = playerOneId;
    }

    if (playerTwoId.startsWith("anonymous-")) {
      // Use the anonymous ID directly - it will be recognized by the UI
      docToCreate.playerTwoId = playerTwoId;
    } else {
      docToCreate.playerTwoId = playerTwoId;
    }

    // Handle doubles players
    if (playerThreeId) {
      if (playerThreeId.startsWith("anonymous-")) {
        docToCreate.playerThreeId = playerThreeId;
      } else {
        docToCreate.playerThreeId = playerThreeId;
      }
    }

    if (playerFourId) {
      if (playerFourId.startsWith("anonymous-")) {
        docToCreate.playerFourId = playerFourId;
      } else {
        docToCreate.playerFourId = playerFourId;
      }
    }

    // The handleAnonymousPlayer function should be REMOVED.
    // Do NOT create documents for anonymous players.

    const match = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      ID.unique(),
      docToCreate, // Use the new document object
      [Permission.read(Role.any())]
    )

    revalidatePath("/dashboard")
    revalidatePath("/players") // Refresh players list if anonymous players were created
    return { success: true, matchId: match.$id }
  } catch (error) {
    console.error("Error creating match:", error)
    return { error: error instanceof Error ? error.message : "Failed to create match" }
  }
}

export async function updateMatchScore(matchId: string, scoreUpdate: {
  score: object
  pointLog: object[]
  status?: "In Progress" | "Completed"
  winnerId?: string
  startTime?: string
  endTime?: string
  duration?: number
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

    if (scoreUpdate.duration !== undefined) {
      updateData.duration = scoreUpdate.duration
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
        [Query.equal("userId", user.$id)]
      )
    )

    return response.documents as unknown as Match[]
  } catch (error) {
    console.error("Error fetching matches:", error)
    return []
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

    return response.documents as unknown as Match[]
  } catch (error) {
    console.error("Error fetching player matches:", error)
    return []
  }
}

export async function getMatch(matchId: string) {
  const { databases } = await createAdminClient()
  
  try {
    const match = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      matchId
    )
    
    return match
  } catch (error: unknown) {
    console.error("Error fetching match:", error)
    
    // Handle specific Appwrite errors
    if (error && typeof error === 'object') {
      const err = error as { code?: number; type?: string; message?: string }
      
      if (err.code === 404 || err.type === 'document_not_found') {
        throw new Error("Match not found")
      } else if (err.code === 401 || err.type === 'general_unauthorized_scope') {
        throw new Error("Unauthorized access to match")
      } else if (err.message?.includes('fetch failed') || err.message?.includes('network')) {
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
      lastShotPlayer: winner,
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

 