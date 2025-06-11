import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getMatch } from "@/lib/actions/matches"
import { getPlayersByUser } from "@/lib/actions/players"
import { LiveScoringInterface } from "./_components/live-scoring-interface"

interface LiveScoringPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function LiveScoringPage({ params }: LiveScoringPageProps) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const { id } = await params

  try {
    const [match, players] = await Promise.all([
      getMatch(id),
      getPlayersByUser()
    ])

    // Create a players lookup map
    const playersMap = new Map(players.map(player => [player.$id, player]))

    const playerOne = playersMap.get(match.playerOneId)
    const playerTwo = playersMap.get(match.playerTwoId)

    if (!playerOne || !playerTwo) {
      throw new Error("Players not found")
    }

    // Parse the score
    let scoreParsed
    try {
      scoreParsed = JSON.parse(match.score)
    } catch (error) {
      console.error("Failed to parse match score:", error)
      scoreParsed = { sets: [], games: [0, 0], points: [0, 0] }
    }

    // Parse match format
    let matchFormat
    try {
      matchFormat = JSON.parse(match.matchFormat)
    } catch (error) {
      console.error("Failed to parse match format:", error)
      matchFormat = { sets: 3, noAd: false }
    }

    const enhancedMatch = {
      $id: match.$id,
      playerOne,
      playerTwo,
      scoreParsed,
      matchFormatParsed: matchFormat,
      status: match.status
    }

    return <LiveScoringInterface match={enhancedMatch} user={user} />
  } catch (error) {
    console.error("Error loading match:", error)
    redirect("/matches")
  }
} 