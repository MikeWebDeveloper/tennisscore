"use server"

import { ID, Query } from "node-appwrite"
import { createAdminClient } from "@/lib/appwrite-server"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Match, MatchFormat, PointDetail, ServeType, PointOutcome, ShotType, CourtPosition } from "@/lib/types"

interface Score {
  sets: number[][]
  games: number[]
  points: number[]
}

export async function createMatch(matchData: {
  playerOneId: string
  playerTwoId: string
  matchFormat: MatchFormat
}): Promise<{ success?: boolean; matchId?: string; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    const { databases } = await createAdminClient()

    const initialScore: Score = {
      sets: [],
      games: [0, 0],
      points: [0, 0],
    }

    const match = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      ID.unique(),
      {
        playerOneId: matchData.playerOneId,
        playerTwoId: matchData.playerTwoId,
        matchFormat: JSON.stringify(matchData.matchFormat),
        matchDate: new Date().toISOString(),
        status: "In Progress",
        score: JSON.stringify(initialScore),
        pointLog: [],
        userId: user.$id,
      }
    )

    revalidatePath("/dashboard")
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

    const match = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      matchId,
      updateData
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

    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      [Query.equal("userId", user.$id)]
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

    const response = await databases.listDocuments(
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
  } catch (error) {
    console.error("Error fetching match:", error)
    throw new Error("Match not found")
  }
}

export async function deleteMatch(matchId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")
  
  try {
    const { databases } = await createAdminClient()
    
    await databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      matchId
    )
    
    revalidatePath("/matches")
    return { success: true }
  } catch (error) {
    console.error("Error deleting match:", error)
    const message = error instanceof Error ? error.message : "Failed to delete match"
    return { error: message }
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
  
  // Generate 4-6 points per game (realistic tennis game length)
  const numPoints = Math.floor(Math.random() * 3) + 4 // 4-6 points
  
  for (let i = 0; i < numPoints; i++) {
    const isLastPoint = i === numPoints - 1
    const winner: "p1" | "p2" = isLastPoint ? gameWinner : (Math.random() > 0.5 ? "p1" : "p2")
    
    const point = {
      id: `point_${pointNumber}`,
      timestamp: new Date(Date.now() + pointNumber * 30000).toISOString(), // 30 seconds between points
      pointNumber,
      setNumber,
      gameNumber,
      gameScore: generateGameScore(i, numPoints),
      winner,
      server,
      serveType: Math.random() > 0.7 ? "second" : "first" as ServeType,
      serveOutcome: generateServeOutcome(),
      servePlacement: ["wide", "body", "t"][Math.floor(Math.random() * 3)] as "wide" | "body" | "t",
      serveSpeed: Math.floor(Math.random() * 40) + 160, // 160-200 km/h
      rallyLength: Math.floor(Math.random() * 8) + 1, // 1-8 shots
      pointOutcome: generatePointOutcome(),
      lastShotType: generateShotType(),
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
  }
  
  return points
}

function generateGameScore(pointIndex: number, totalPoints: number): string {
  // Simplified game score progression
  const scores = ["0-0", "15-0", "30-0", "40-0", "15-15", "30-15", "40-15", "30-30", "40-30", "Deuce", "Ad-In", "Ad-Out"]
  return scores[pointIndex % scores.length] || "0-0"
}

function generateServeOutcome(): PointOutcome {
  const outcomes: PointOutcome[] = ["winner", "unforced_error", "forced_error", "ace", "double_fault"]
  const weights = [0.3, 0.25, 0.2, 0.15, 0.1] // Weighted probability
  const random = Math.random()
  let sum = 0
  
  for (let i = 0; i < outcomes.length; i++) {
    sum += weights[i]
    if (random <= sum) return outcomes[i]
  }
  
  return "winner"
}

function generatePointOutcome(): PointOutcome {
  const outcomes: PointOutcome[] = ["winner", "unforced_error", "forced_error", "ace", "double_fault"]
  const weights = [0.35, 0.3, 0.2, 0.1, 0.05]
  const random = Math.random()
  let sum = 0
  
  for (let i = 0; i < outcomes.length; i++) {
    sum += weights[i]
    if (random <= sum) return outcomes[i]
  }
  
  return "winner"
}

function generateShotType(): ShotType {
  const shots: ShotType[] = ["forehand", "backhand", "volley", "overhead", "serve"]
  const weights = [0.35, 0.3, 0.15, 0.1, 0.1]
  const random = Math.random()
  let sum = 0
  
  for (let i = 0; i < shots.length; i++) {
    sum += weights[i]
    if (random <= sum) return shots[i]
  }
  
  return "forehand"
} 