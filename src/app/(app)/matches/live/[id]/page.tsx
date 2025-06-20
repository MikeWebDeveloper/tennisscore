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
    // Use Promise.allSettled to handle network failures more gracefully
    const [matchResult, playersResult] = await Promise.allSettled([
      getMatch(id),
      getPlayersByUser()
    ])

    // Handle match fetch failure
    if (matchResult.status === 'rejected') {
      console.error("Failed to fetch match:", matchResult.reason)
      redirect("/matches")
      return
    }

    const match = matchResult.value

    // Handle players fetch failure - create fallback players if needed
    let players = []
    if (playersResult.status === 'fulfilled') {
      players = playersResult.value
    } else {
      console.warn("Failed to fetch players, using fallback:", playersResult.reason)
      // Create fallback anonymous players
      players = [
        {
          $id: match.playerOneId,
          firstName: "Player",
          lastName: "1",
          userId: user.$id,
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString()
        },
        {
          $id: match.playerTwoId,
          firstName: "Player", 
          lastName: "2",
          userId: user.$id,
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString()
        }
      ]
    }

    // Handle new anonymous player logic: check for embedded player data first
    const playersMap = new Map(players.map(player => [player.$id, player]))

    let playerOne, playerTwo, playerThree, playerFour
    
    // Check for embedded player data first, then fall back to player lookup
    if (match.playerOneData) {
      playerOne = match.playerOneData
    } else {
      playerOne = playersMap.get(match.playerOneId) || {
        $id: match.playerOneId || "anonymous-1",
        firstName: "Player",
        lastName: "1",
        userId: user.$id,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString()
      }
    }

    if (match.playerTwoData) {
      playerTwo = match.playerTwoData
    } else {
      playerTwo = playersMap.get(match.playerTwoId) || {
        $id: match.playerTwoId || "anonymous-2",
        firstName: "Player",
        lastName: "2", 
        userId: user.$id,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString()
      }
    }

    // Handle doubles players
    if (match.playerThreeId) {
      playerThree = playersMap.get(match.playerThreeId) || {
        $id: match.playerThreeId,
        firstName: "Player",
        lastName: "3",
        userId: user.$id,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString()
      }
    }

    if (match.playerFourId) {
      playerFour = playersMap.get(match.playerFourId) || {
        $id: match.playerFourId,
        firstName: "Player",
        lastName: "4",
        userId: user.$id,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString()
      }
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
      playerThree,
      playerFour,
      matchFormat: match.matchFormat,
      score: match.score,
      pointLog: match.pointLog,
      status: match.status,
      scoreParsed,
      matchFormatParsed: matchFormat
    }

    return <LiveScoringInterface match={enhancedMatch} />
  } catch (error) {
    console.error("Error loading match:", error)
    redirect("/matches")
  }
} 