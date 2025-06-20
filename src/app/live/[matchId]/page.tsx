import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/appwrite-server"
import { Player, MatchFormat, Score } from "@/lib/types"
import { PublicLiveMatch } from "./_components/public-live-match"

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
    let playerOne, playerTwo
    
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

    // Parse the match data
    const matchData = {
      $id: match.$id,
      playerOne: playerOne as unknown as Player,
      playerTwo: playerTwo as unknown as Player,
      scoreParsed: JSON.parse(match.score) as Score,
      matchFormatParsed: JSON.parse(match.matchFormat) as MatchFormat,
      status: match.status as "In Progress" | "Completed",
      pointLog: match.pointLog || [],
      winnerId: match.winnerId,
      matchDate: match.matchDate
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
    let playerOne, playerTwo
    
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

    return {
      title: `${playerOne.firstName} ${playerOne.lastName} vs ${playerTwo.firstName} ${playerTwo.lastName} - Live Match`,
      description: `Follow the live tennis match between ${playerOne.firstName} ${playerOne.lastName} and ${playerTwo.firstName} ${playerTwo.lastName}`,
    }
  } catch {
    return {
      title: "Live Tennis Match",
      description: "Follow this live tennis match",
    }
  }
} 