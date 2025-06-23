import { getMatchesByUser } from "@/lib/actions/matches"
import { getPlayersByUser } from "@/lib/actions/players"
import { Match, Player } from "@/lib/types"
import { MatchesPageClient, EnhancedMatch } from "./matches-page-client"

export default async function MatchesPage() {
  let matches: Match[] = []
  let players: Player[] = []
  let hasError = false

  try {
    // Try to fetch data with error handling
    const [matchesResult, playersResult] = await Promise.allSettled([
      getMatchesByUser(),
      getPlayersByUser()
    ])

    if (matchesResult.status === 'fulfilled') {
      matches = matchesResult.value
    } else {
      console.error("Failed to fetch matches:", matchesResult.reason)
      hasError = true
    }

    if (playersResult.status === 'fulfilled') {
      players = playersResult.value
    } else {
      console.error("Failed to fetch players:", playersResult.reason)
      hasError = true
    }
  } catch (error) {
    console.error("Error in MatchesPage:", error)
    hasError = true
  }

  const playersMap = new Map(players.map(player => [player.$id, player]))

  const enhancedMatches: EnhancedMatch[] = matches.map(match => {
    // Handle anonymous players by checking ID prefix
    const playerOne = match.playerOneId.startsWith('anonymous-') 
      ? { firstName: "Player", lastName: "1", $id: match.playerOneId } as Player
      : playersMap.get(match.playerOneId)
    const playerTwo = match.playerTwoId.startsWith('anonymous-') 
      ? { firstName: "Player", lastName: "2", $id: match.playerTwoId } as Player
      : playersMap.get(match.playerTwoId)
    
    // Handle doubles players
    const playerThree = match.playerThreeId 
      ? (match.playerThreeId.startsWith('anonymous-') 
        ? { firstName: "Player", lastName: "3", $id: match.playerThreeId } as Player
        : playersMap.get(match.playerThreeId))
      : undefined
    const playerFour = match.playerFourId 
      ? (match.playerFourId.startsWith('anonymous-') 
        ? { firstName: "Player", lastName: "4", $id: match.playerFourId } as Player
        : playersMap.get(match.playerFourId))
      : undefined

    const winner = match.winnerId ? playersMap.get(match.winnerId) : null

    let scoreParsed: { sets: { p1: number; p2: number }[], games?: number[], points?: number[] } | undefined = undefined
    try {
      const parsed = JSON.parse(match.score)
      // The score should already be in the correct format: { sets: [], games: [0, 0], points: [0, 0] }
      if (parsed && typeof parsed === 'object') {
        scoreParsed = {
          sets: Array.isArray(parsed.sets) ? parsed.sets.map((set: number[]) => ({ p1: set[0] || 0, p2: set[1] || 0 })) : [],
          games: Array.isArray(parsed.games) ? parsed.games : [0, 0],
          points: Array.isArray(parsed.points) ? parsed.points : [0, 0]
        }
      }
    } catch (e) {
      console.error("Failed to parse score JSON", e)
      // Provide default values
      scoreParsed = {
        sets: [],
        games: [0, 0],
        points: [0, 0]
      }
    }

    return {
      ...match,
      playerOneName: playerOne ? `${playerOne.firstName} ${playerOne.lastName}` : "Unknown Player",
      playerTwoName: playerTwo ? `${playerTwo.firstName} ${playerTwo.lastName}` : "Unknown Player",
      playerThreeName: playerThree ? `${playerThree.firstName} ${playerThree.lastName}` : undefined,
      playerFourName: playerFour ? `${playerFour.firstName} ${playerFour.lastName}` : undefined,
      winnerName: winner ? `${winner.firstName} ${winner.lastName}` : "",
      scoreParsed: scoreParsed,
      playerOne,
      playerTwo,
      playerThree,
      playerFour
    }
  })

  return (
    <MatchesPageClient matches={enhancedMatches} hasError={hasError} />
  )
} 