// Opponent Analysis Utilities
// Analyzes match history to generate nemesis and bunny statistics

import { OpponentRecord } from "@/components/features/nemesis-bunny-stats"

export interface MatchData {
  $id: string
  playerOne: { $id: string; firstName: string; lastName: string; profilePicture?: string }
  playerTwo: { $id: string; firstName: string; lastName: string; profilePicture?: string }
  playerThree?: { $id: string; firstName: string; lastName: string; profilePicture?: string }
  playerFour?: { $id: string; firstName: string; lastName: string; profilePicture?: string }
  winner?: string
  status: string
  finalScore?: string
  endTime?: string
  createdAt: string
}

export function analyzeOpponentRecords(
  playerId: string,
  matches: MatchData[]
): OpponentRecord[] {
  // Group matches by opponent
  const opponentMap = new Map<string, {
    opponentId: string
    opponentName: string
    opponentAvatar?: string
    matches: Array<{
      matchId: string
      date: string
      won: boolean
      score: string
    }>
  }>()

  matches.forEach(match => {
    // Skip incomplete matches or matches without proper player data
    if (match.status !== 'Completed' || !match.winner || !match.playerOne || !match.playerTwo) return

    // Determine opponent(s) and if player won
    const opponents: Array<{ id: string; name: string; avatar?: string }> = []
    let playerWon = false

    // Handle singles matches
    if (match.playerOne?.$id === playerId) {
      if (match.playerTwo?.$id) {
        opponents.push({
          id: match.playerTwo.$id,
          name: `${match.playerTwo.firstName || ''} ${match.playerTwo.lastName || ''}`.trim(),
          avatar: match.playerTwo.profilePicture
        })
        playerWon = match.winner === 'player1'
      }
    } else if (match.playerTwo?.$id === playerId) {
      if (match.playerOne?.$id) {
        opponents.push({
          id: match.playerOne.$id,
          name: `${match.playerOne.firstName || ''} ${match.playerOne.lastName || ''}`.trim(),
          avatar: match.playerOne.profilePicture
        })
        playerWon = match.winner === 'player2'
      }
    }
    // Handle doubles matches
    else if (match.playerThree && match.playerFour) {
      if (match.playerThree?.$id === playerId) {
        if (match.playerOne?.$id && match.playerTwo?.$id) {
          opponents.push(
            {
              id: match.playerOne.$id,
              name: `${match.playerOne.firstName || ''} ${match.playerOne.lastName || ''}`.trim(),
              avatar: match.playerOne.profilePicture
            },
            {
              id: match.playerTwo.$id,
              name: `${match.playerTwo.firstName || ''} ${match.playerTwo.lastName || ''}`.trim(),
              avatar: match.playerTwo.profilePicture
            }
          )
          playerWon = match.winner === 'team2'
        }
      } else if (match.playerFour?.$id === playerId) {
        if (match.playerOne?.$id && match.playerTwo?.$id) {
          opponents.push(
            {
              id: match.playerOne.$id,
              name: `${match.playerOne.firstName || ''} ${match.playerOne.lastName || ''}`.trim(),
              avatar: match.playerOne.profilePicture
            },
            {
              id: match.playerTwo.$id,
              name: `${match.playerTwo.firstName || ''} ${match.playerTwo.lastName || ''}`.trim(),
              avatar: match.playerTwo.profilePicture
            }
          )
          playerWon = match.winner === 'team2'
        }
      }
    }

    // Add match to each opponent's record
    opponents.forEach(opponent => {
      if (!opponentMap.has(opponent.id)) {
        opponentMap.set(opponent.id, {
          opponentId: opponent.id,
          opponentName: opponent.name,
          opponentAvatar: opponent.avatar,
          matches: []
        })
      }

      const opponentData = opponentMap.get(opponent.id)!
      opponentData.matches.push({
        matchId: match.$id,
        date: match.endTime || match.createdAt,
        won: playerWon,
        score: match.finalScore || 'Score not recorded'
      })
    })
  })

  // Convert to OpponentRecord format and calculate statistics
  const opponentRecords: OpponentRecord[] = []

  opponentMap.forEach(opponentData => {
    const wins = opponentData.matches.filter(m => m.won).length
    const losses = opponentData.matches.length - wins
    const winRate = opponentData.matches.length > 0 ? wins / opponentData.matches.length : 0

    // Sort matches by date (most recent first)
    const sortedMatches = opponentData.matches.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    const lastPlayedMatch = sortedMatches[0]
    const lastPlayed = lastPlayedMatch 
      ? formatRelativeDate(lastPlayedMatch.date)
      : undefined

    opponentRecords.push({
      opponentId: opponentData.opponentId,
      opponentName: opponentData.opponentName,
      opponentAvatar: opponentData.opponentAvatar,
      matches: opponentData.matches.length,
      wins,
      losses,
      winRate,
      lastPlayed,
      matchHistory: sortedMatches
    })
  })

  // Sort by total matches played (most matches first)
  return opponentRecords.sort((a, b) => b.matches - a.matches)
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}

export function getOpponentInsights(records: OpponentRecord[]) {
  const totalOpponents = records.length
  const totalMatches = records.reduce((sum, record) => sum + record.matches, 0)
  const overallWins = records.reduce((sum, record) => sum + record.wins, 0)
  const overallWinRate = totalMatches > 0 ? overallWins / totalMatches : 0

  // Find most played opponent
  const mostPlayedOpponent = records.length > 0 
    ? records.reduce((prev, current) => prev.matches > current.matches ? prev : current)
    : null

  // Find best win rate (minimum 3 matches)
  const qualifiedRecords = records.filter(r => r.matches >= 3)
  const bestWinRateOpponent = qualifiedRecords.length > 0
    ? qualifiedRecords.reduce((prev, current) => prev.winRate > current.winRate ? prev : current)
    : null

  // Find worst win rate (minimum 3 matches)
  const worstWinRateOpponent = qualifiedRecords.length > 0
    ? qualifiedRecords.reduce((prev, current) => prev.winRate < current.winRate ? prev : current)
    : null

  return {
    totalOpponents,
    totalMatches,
    overallWinRate,
    mostPlayedOpponent,
    bestWinRateOpponent,
    worstWinRateOpponent
  }
} 