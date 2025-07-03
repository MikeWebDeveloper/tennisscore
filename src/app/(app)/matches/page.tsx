import { getMatchesByUser } from "@/lib/actions/matches"
import { getPlayersByUser } from "@/lib/actions/players"
import { Match, Player } from "@/lib/types"
import { formatPlayerFromObject } from "@/lib/utils"
import { MatchesPageClient, EnhancedMatch } from "./matches-page-client"

// Helper function to get anonymous player display name
function getAnonymousPlayerName(playerId: string): { firstName: string; lastName: string } {
  if (playerId.includes('player-1') || playerId.includes('player1')) {
    return { firstName: "Player", lastName: "1" }
  } else if (playerId.includes('player-2') || playerId.includes('player2')) {
    return { firstName: "Player", lastName: "2" }
  } else if (playerId.includes('player-3') || playerId.includes('player3')) {
    return { firstName: "Player", lastName: "3" }
  } else if (playerId.includes('player-4') || playerId.includes('player4')) {
    return { firstName: "Player", lastName: "4" }
  } else {
    // Fallback for other anonymous formats
    return { firstName: "Anonymous", lastName: "Player" }
  }
}

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
      ? { ...getAnonymousPlayerName(match.playerOneId), $id: match.playerOneId } as Player
      : playersMap.get(match.playerOneId)
    const playerTwo = match.playerTwoId.startsWith('anonymous-') 
      ? { ...getAnonymousPlayerName(match.playerTwoId), $id: match.playerTwoId } as Player
      : playersMap.get(match.playerTwoId)
    
    // Handle doubles players
    const playerThree = match.playerThreeId 
      ? (match.playerThreeId.startsWith('anonymous-') 
        ? { ...getAnonymousPlayerName(match.playerThreeId), $id: match.playerThreeId } as Player
        : playersMap.get(match.playerThreeId))
      : undefined
    const playerFour = match.playerFourId 
      ? (match.playerFourId.startsWith('anonymous-') 
        ? { ...getAnonymousPlayerName(match.playerFourId), $id: match.playerFourId } as Player
        : playersMap.get(match.playerFourId))
      : undefined

    // Handle winner - for doubles, determine winning team and format both names
    let winnerName = ""
    if (match.winnerId) {
      const isDoubles = match.playerThreeId && match.playerFourId
      
      if (isDoubles) {
        // For doubles, determine which team won based on winnerId
        // Team 1: playerOne & playerThree, Team 2: playerTwo & playerFour
        if (match.winnerId === match.playerOneId || match.winnerId === match.playerThreeId) {
          // Team 1 won
          const player1Name = playerOne ? formatPlayerFromObject(playerOne) : "Unknown Player"
          const player3Name = playerThree ? formatPlayerFromObject(playerThree) : "Unknown Player"
          winnerName = `${player1Name} / ${player3Name}`
        } else if (match.winnerId === match.playerTwoId || match.winnerId === match.playerFourId) {
          // Team 2 won
          const player2Name = playerTwo ? formatPlayerFromObject(playerTwo) : "Unknown Player"
          const player4Name = playerFour ? formatPlayerFromObject(playerFour) : "Unknown Player"
          winnerName = `${player2Name} / ${player4Name}`
        }
      } else {
        // For singles, use the existing logic
        let winner: Player | null = null
        if (match.winnerId.startsWith('anonymous-')) {
          winner = { ...getAnonymousPlayerName(match.winnerId), $id: match.winnerId } as Player
        } else {
          winner = playersMap.get(match.winnerId) || null
        }
        winnerName = winner ? formatPlayerFromObject(winner) : ""
      }
    }

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
      playerOneName: playerOne ? formatPlayerFromObject(playerOne) : "Unknown Player",
      playerTwoName: playerTwo ? formatPlayerFromObject(playerTwo) : "Unknown Player",
      playerThreeName: playerThree ? formatPlayerFromObject(playerThree) : undefined,
      playerFourName: playerFour ? formatPlayerFromObject(playerFour) : undefined,
      winnerName: winnerName,
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