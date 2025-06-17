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

    // Fetch player data
    const [playerOne, playerTwo] = await Promise.all([
      databases.getDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        match.playerOneId
      ),
      databases.getDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        match.playerTwoId
      )
    ])

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

    const [playerOne, playerTwo] = await Promise.all([
      databases.getDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        match.playerOneId
      ),
      databases.getDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID!,
        match.playerTwoId
      )
    ])

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