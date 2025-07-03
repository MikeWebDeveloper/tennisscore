import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/appwrite-server"
import { Player, MatchFormat, Score } from "@/lib/types"
import { PublicLiveMatch } from "./_components/public-live-match"
import { formatPlayerFromObject } from "@/lib/utils"

// Force dynamic rendering and no caching for live matches
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{
    matchId: string
  }>
}

export default async function PublicLiveMatchPage({ params }: PageProps) {
  const { matchId } = await params
  const { databases } = await createAdminClient()

  try {
    // Fetch match data
    const match = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      matchId
    )

    // Handle new anonymous player logic: check for embedded player data first
    let playerOne, playerTwo, playerThree, playerFour
    
    if (match.playerOneData) {
      playerOne = match.playerOneData
    } else if (match.playerOneId && !match.playerOneId.startsWith('anonymous-')) {
      playerOne = await databases.getDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        match.playerOneId
      )
    } else {
      // Fallback for missing data or anonymous players
      playerOne = { 
        firstName: "Player", 
        lastName: "1",
        $id: match.playerOneId || "anonymous-1"
      }
    }
    
    if (match.playerTwoData) {
      playerTwo = match.playerTwoData
    } else if (match.playerTwoId && !match.playerTwoId.startsWith('anonymous-')) {
      playerTwo = await databases.getDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        match.playerTwoId
      )
    } else {
      // Fallback for missing data or anonymous players
      playerTwo = { 
        firstName: "Player", 
        lastName: "2",
        $id: match.playerTwoId || "anonymous-2"
      }
    }

    // Fetch doubles players if they exist
    if (match.playerThreeId) {
      if (match.playerThreeData) {
        playerThree = match.playerThreeData
      } else if (!match.playerThreeId.startsWith('anonymous-')) {
        playerThree = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
          match.playerThreeId
        )
      } else {
        playerThree = { 
          firstName: "Player", 
          lastName: "3",
          $id: match.playerThreeId
        }
      }
    }

    if (match.playerFourId) {
      if (match.playerFourData) {
        playerFour = match.playerFourData
      } else if (!match.playerFourId.startsWith('anonymous-')) {
        playerFour = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
          match.playerFourId
        )
      } else {
        playerFour = { 
          firstName: "Player", 
          lastName: "4",
          $id: match.playerFourId
        }
      }
    }

    // Parse the match data
    const matchData = {
      $id: match.$id,
      playerOne: playerOne as unknown as Player,
      playerTwo: playerTwo as unknown as Player,
      playerThree: playerThree as unknown as Player,
      playerFour: playerFour as unknown as Player,
      score: match.score,
      scoreParsed: JSON.parse(match.score) as Score,
      matchFormatParsed: JSON.parse(match.matchFormat) as MatchFormat,
      detailLevel: match.detailLevel || "simple", // Include detailLevel from database
      status: match.status as "In Progress" | "Completed",
      pointLog: match.pointLog || [],
      winnerId: match.winnerId,
      matchDate: match.matchDate,
      startTime: match.startTime || null,
      endTime: match.endTime || null,
      setDurations: match.setDurations || [],
      tournamentName: match.tournamentName || undefined,
      tournamentDescription: match.tournamentDescription || undefined,
    }

    return <PublicLiveMatch match={matchData} />
  } catch (error) {
    console.error("Error fetching match:", error)
    notFound()
  }
}

export async function generateMetadata({ params }: PageProps) {
  try {
    const { matchId } = await params
    const { databases } = await createAdminClient()
    
    const match = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      matchId
    )

    // Handle new anonymous player logic for metadata
    let playerOne, playerTwo, playerThree, playerFour
    
    if (match.playerOneData) {
      playerOne = match.playerOneData
    } else if (match.playerOneId && !match.playerOneId.startsWith('anonymous-')) {
      playerOne = await databases.getDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        match.playerOneId
      )
    } else {
      playerOne = { firstName: "Player", lastName: "1" }
    }
    
    if (match.playerTwoData) {
      playerTwo = match.playerTwoData
    } else if (match.playerTwoId && !match.playerTwoId.startsWith('anonymous-')) {
      playerTwo = await databases.getDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        match.playerTwoId
      )
    } else {
      playerTwo = { firstName: "Player", lastName: "2" }
    }

    // Fetch doubles players if they exist
    if (match.playerThreeId) {
      if (match.playerThreeData) {
        playerThree = match.playerThreeData
      } else if (!match.playerThreeId.startsWith('anonymous-')) {
        playerThree = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
          match.playerThreeId
        )
      } else {
        playerThree = { firstName: "Player", lastName: "3" }
      }
    }

    if (match.playerFourId) {
      if (match.playerFourData) {
        playerFour = match.playerFourData
      } else if (!match.playerFourId.startsWith('anonymous-')) {
        playerFour = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
          match.playerFourId
        )
      } else {
        playerFour = { firstName: "Player", lastName: "4" }
      }
    }

    const isDoubles = !!(playerThree && playerFour)
    const playerNames = {
      p1: isDoubles 
        ? `${formatPlayerFromObject(playerOne)} / ${formatPlayerFromObject(playerThree!)}`
        : formatPlayerFromObject(playerOne),
      p2: isDoubles 
        ? `${formatPlayerFromObject(playerTwo)} / ${formatPlayerFromObject(playerFour!)}`
        : formatPlayerFromObject(playerTwo),
    }



    return {
      title: `${playerNames.p1} vs ${playerNames.p2} - Live Match`,
      description: `Follow the live tennis match between ${playerNames.p1} and ${playerNames.p2}`,
      other: {
        'cache-control': 'no-cache, no-store, must-revalidate',
        'pragma': 'no-cache',
        'expires': '0'
      }
    }
  } catch {
    return {
      title: "Live Tennis Match",
      description: "Follow this live tennis match",
      other: {
        'cache-control': 'no-cache, no-store, must-revalidate',
        'pragma': 'no-cache',
        'expires': '0'
      }
    }
  }
} 