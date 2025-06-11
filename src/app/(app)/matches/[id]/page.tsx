import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getMatch } from "@/lib/actions/matches"
import { getPlayersByUser } from "@/lib/actions/players"
import { MatchDetails } from "./_components/match-details"

interface MatchPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function MatchPage({ params }: MatchPageProps) {
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
    const winner = match.winnerId ? playersMap.get(match.winnerId) : undefined

    // Parse the score
    let scoreParsed
    try {
      scoreParsed = JSON.parse(match.score)
    } catch (error) {
      console.error("Failed to parse match score:", error)
      scoreParsed = { sets: [] }
    }

    // Parse pointLog for detailed analysis
    let pointLog = []
    if (match.pointLog && Array.isArray(match.pointLog)) {
      pointLog = match.pointLog.map(point => {
        try {
          return typeof point === 'string' ? JSON.parse(point) : point
        } catch {
          return point
        }
      })
    }

    const enhancedMatch = {
      $id: match.$id,
      playerOneId: match.playerOneId,
      playerTwoId: match.playerTwoId,
      playerOne,
      playerTwo,
      winner,
      matchDate: match.matchDate,
      status: match.status,
      score: match.score,
      scoreParsed,
      pointLog,
      matchFormat: match.matchFormat,
      winnerId: match.winnerId,
      userId: match.userId,
      $collectionId: match.$collectionId,
      $databaseId: match.$databaseId,
      $createdAt: match.$createdAt,
      $updatedAt: match.$updatedAt,
      $permissions: match.$permissions
    }

    return <MatchDetails match={enhancedMatch} />
  } catch (error) {
    console.error("Error loading match:", error)
    redirect("/matches")
  }
} 