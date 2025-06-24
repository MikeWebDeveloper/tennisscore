import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getMatch } from "@/lib/actions/matches"
import { getPlayersByIds } from "@/lib/actions/players"
import { MatchDetails } from "./_components/match-details"
import { Player } from "@/lib/types"

export default async function MatchPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const resolvedParams = await params
  const match = await getMatch(resolvedParams.id)
  if (!match) {
    redirect("/matches")
  }

  // Check if it's a doubles match
  const isDoubles = match.playerThreeId && match.playerFourId

  // Handle all players (including doubles)
  const playerIds = [match.playerOneId, match.playerTwoId]
  if (isDoubles) {
    playerIds.push(match.playerThreeId!, match.playerFourId!)
  }

  // Filter out anonymous player IDs
  const realPlayerIds = playerIds.filter(id => !id.startsWith('anonymous-'))
  const playersData = realPlayerIds.length > 0 ? await getPlayersByIds(realPlayerIds) : {}

  // Create player objects
  const createPlayer = (id: string, defaultNumber: string): Player => {
    if (id.startsWith('anonymous-')) {
      return { 
        $id: id,
        firstName: "Player", 
        lastName: defaultNumber,
        userId: user.$id,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString()
      } as Player
    }
    return playersData[id] || null
  }

  const player1 = createPlayer(match.playerOneId, "1")
  const player2 = createPlayer(match.playerTwoId, "2")
  const player3 = isDoubles ? createPlayer(match.playerThreeId!, "3") : null
  const player4 = isDoubles ? createPlayer(match.playerFourId!, "4") : null

  // Parse score for display
  const score = JSON.parse(match.score || "{}")

  // Normalize status for component compatibility
  const normalizeStatus = (status: string): "In Progress" | "Completed" => {
    const lowercaseStatus = status.toLowerCase()
    if (lowercaseStatus === 'completed' || lowercaseStatus === 'retired') {
      return "Completed"
    }
    return "In Progress"
  }

  // Determine winner
  let winner = null
  if (match.winnerId) {
    if (match.winnerId === match.playerOneId) {
      winner = player1
    } else if (match.winnerId === match.playerTwoId) {
      winner = player2
    } else if (match.winnerId === match.playerThreeId) {
      winner = player3
    } else if (match.winnerId === match.playerFourId) {
      winner = player4
    }
  }

  // Create match object with proper typing
  const enhancedMatch = {
    $id: match.$id,
    playerOneId: match.playerOneId,
    playerTwoId: match.playerTwoId,
    playerThreeId: match.playerThreeId,
    playerFourId: match.playerFourId,
    matchDate: match.matchDate,
    status: normalizeStatus(match.status),
    score: match.score,
    pointLog: match.pointLog || [],
    matchFormat: match.matchFormat,
    winnerId: match.winnerId,
    startTime: match.startTime,
    endTime: match.endTime,
    setDurations: match.setDurations,
    retirementReason: match.retirementReason,
    userId: match.userId,
    $collectionId: match.$collectionId,
    $databaseId: match.$databaseId,
    $createdAt: match.$createdAt,
    $updatedAt: match.$updatedAt,
    $permissions: match.$permissions,
    playerOne: player1,
    playerTwo: player2,
    playerThree: player3 || undefined,
    playerFour: player4 || undefined,
    winner: winner || undefined,
    scoreParsed: score
  }

  return <MatchDetails match={enhancedMatch} />
} 