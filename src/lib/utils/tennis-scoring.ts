// Tennis Scoring Utilities

export interface TennisScore {
  sets: number[][] // [set1[p1,p2], set2[p1,p2], ...]
  games: number[] // [p1Games, p2Games] in current set
  points: number[] // [p1Points, p2Points] in current game
  server?: "p1" | "p2"
  gameNumber?: number
  setNumber?: number
  isTiebreak?: boolean // Is current game a tiebreak?
  tiebreakPoints?: number[] // [p1Points, p2Points] in tiebreak
}

export interface MatchFormat {
  sets: 1 | 3 | 5 // Best of 1, 3, or 5 sets
  noAd: boolean // No-advantage scoring
  tiebreak: boolean // Tiebreak at 6-6
  finalSetTiebreak: boolean // Tiebreak in final set
  finalSetTiebreakAt?: number // Points for final set tiebreak (e.g., 10)
  shortSets?: boolean // First to 4 games (for practice)
}

export interface GameScoreDisplay {
  display: string // "15-30", "Deuce", "40-30", etc.
  isGamePoint: boolean
  isBreakPoint: boolean
  isSetPoint: boolean
  isMatchPoint: boolean
  server: "p1" | "p2"
}

export function convertPointsToGameScore(p1Points: number, p2Points: number, noAd: boolean = false): string {
  // No-Ad scoring (simpler)
  if (noAd) {
    if (p1Points >= 4 && p1Points > p2Points) return "Game P1"
    if (p2Points >= 4 && p2Points > p1Points) return "Game P2"
    
    const pointMap = ["0", "1", "2", "3+"]
    return `${pointMap[Math.min(p1Points, 3)]}-${pointMap[Math.min(p2Points, 3)]}`
  }

  // Standard tennis point conversion
  const pointMap = ["0", "15", "30", "40"]
  
  // Both players less than 3 points
  if (p1Points < 3 && p2Points < 3) {
    return `${pointMap[p1Points]}-${pointMap[p2Points]}`
  }
  
  // Deuce situation (both 3+ points and tied)
  if (p1Points >= 3 && p2Points >= 3) {
    if (p1Points === p2Points) {
      return "Deuce"
    }
    // Advantage situation
    return p1Points > p2Points ? "Ad-40" : "40-Ad"
  }
  
  // One player has 40, other has less than 3
  if (p1Points >= 3 && p2Points < 3) {
    return `40-${pointMap[p2Points]}`
  }
  
  if (p2Points >= 3 && p1Points < 3) {
    return `${pointMap[p1Points]}-40`
  }
  
  // Fallback
  return `${Math.min(p1Points, 3)}-${Math.min(p2Points, 3)}`
}

export function isGameWon(p1Points: number, p2Points: number, noAd: boolean = false): boolean {
  if (noAd) {
    // No-Ad: First to 4 points wins (or first to win after 3-3)
    return (p1Points >= 4 && p1Points > p2Points) || 
           (p2Points >= 4 && p2Points > p1Points)
  }
  
  // Standard: Game is won when a player has 4+ points AND leads by 2+ points
  return (p1Points >= 4 && p1Points - p2Points >= 2) || 
         (p2Points >= 4 && p2Points - p1Points >= 2)
}

export function getGameWinner(p1Points: number, p2Points: number, noAd: boolean = false): "p1" | "p2" | null {
  if (noAd) {
    if (p1Points >= 4 && p1Points > p2Points) return "p1"
    if (p2Points >= 4 && p2Points > p1Points) return "p2"
    return null
  }
  
  if (p1Points >= 4 && p1Points - p2Points >= 2) return "p1"
  if (p2Points >= 4 && p2Points - p1Points >= 2) return "p2"
  return null
}

export function getServer(gameNumber: number): "p1" | "p2" {
  // Player 1 serves first game, then alternate each game
  // In tennis, server alternates each game
  // gameNumber is 1-indexed. totalGames played is gameNumber - 1.
  const totalGames = gameNumber > 0 ? gameNumber - 1 : 0;
  return totalGames % 2 === 0 ? "p1" : "p2"
}

export function getTiebreakServer(
  totalPointsInTiebreak: number, 
  initialServer: 'p1' | 'p2'
): 'p1' | 'p2' {
  // First point is served by the initial server.
  if (totalPointsInTiebreak === 0) {
    return initialServer
  }
  // After the first point, the serve swaps and then alternates every two points.
  // Points: 1 (initial) | 2,3 (other) | 4,5 (initial) | 6,7 (other) ...
  const pointsAfterFirst = totalPointsInTiebreak - 1
  const serverSwaps = Math.floor(pointsAfterFirst / 2)
  
  // If serverSwaps is even, it's the other player. If odd, it's back to the initial player.
  if (serverSwaps % 2 === 0) {
    // This covers points 2,3 and 6,7 etc.
    return initialServer === 'p1' ? 'p2' : 'p1'
  }
  // This covers points 4,5 and 8,9 etc.
  return initialServer
}

export function isBreakPoint(
  serverPoints: number, 
  returnerPoints: number,
  noAd: boolean = false
): boolean {
  // Break point occurs when the returner is one point away from winning the game
  if (noAd) {
    return returnerPoints >= 3 && returnerPoints >= serverPoints
  }
  
  if (returnerPoints >= 3 && serverPoints < 3) return true // 40-0, 40-15, 40-30
  if (returnerPoints >= 3 && serverPoints >= 3 && returnerPoints > serverPoints) return true // Ad-40
  return false
}

export function isGamePoint(p1Points: number, p2Points: number, noAd: boolean = false): boolean {
  // Game point when either player is one point away from winning
  if (noAd) {
    return (p1Points >= 3 && p1Points >= p2Points) || 
           (p2Points >= 3 && p2Points >= p1Points)
  }
  
  return (p1Points >= 3 && p1Points >= p2Points) || 
         (p2Points >= 3 && p2Points >= p1Points)
}

export function isTiebreakWon(p1Points: number, p2Points: number, targetPoints: number = 7): boolean {
  // Tiebreak is won by first to target points (usually 7 or 10) with a 2-point margin
  return (p1Points >= targetPoints && p1Points - p2Points >= 2) ||
         (p2Points >= targetPoints && p2Points - p1Points >= 2)
}

export function getTiebreakWinner(p1Points: number, p2Points: number, targetPoints: number = 7): "p1" | "p2" | null {
  if (p1Points >= targetPoints && p1Points - p2Points >= 2) return "p1"
  if (p2Points >= targetPoints && p2Points - p1Points >= 2) return "p2"
  return null
}

export function isSetWon(p1Games: number, p2Games: number, format: MatchFormat): boolean {
  const targetGames = format.shortSets ? 4 : 6
  if (p1Games >= targetGames && p1Games - p2Games >= 2) return true
  if (p2Games >= targetGames && p2Games - p1Games >= 2) return true
  if (format.tiebreak) {
    const tiebreakAt = format.shortSets ? 4 : 6
    if ((p1Games === tiebreakAt + 1 && p2Games === tiebreakAt) ||
        (p2Games === tiebreakAt + 1 && p1Games === tiebreakAt)) return true
  }
  if (format.finalSetTiebreak) {
    const tiebreakAt = format.shortSets ? 4 : 6
    if ((p1Games === tiebreakAt + 1 && p2Games === tiebreakAt) ||
        (p2Games === tiebreakAt + 1 && p1Games === tiebreakAt)) return true
  }
  return false
}

export function getSetWinner(p1Games: number, p2Games: number, format: MatchFormat, currentSets: number[][]): "p1" | "p2" | null {
  const targetGames = format.shortSets ? 4 : 6
  
  if (p1Games >= targetGames && p1Games - p2Games >= 2) return "p1"
  if (p2Games >= targetGames && p2Games - p1Games >= 2) return "p2"
  
  // Check if this is the final set
  const setsNeededToWin = Math.ceil(format.sets / 2)
  const p1SetsWon = currentSets.filter(set => set[0] > set[1]).length
  const p2SetsWon = currentSets.filter(set => set[1] > set[0]).length
  const isFinalSet = (p1SetsWon === setsNeededToWin - 1 && p2SetsWon === setsNeededToWin - 1)
  
  // Tiebreak scenario
  if (format.tiebreak && !isFinalSet) {
    const tiebreakAt = format.shortSets ? 4 : 6
    if (p1Games === tiebreakAt + 1 && p2Games === tiebreakAt) return "p1"
    if (p2Games === tiebreakAt + 1 && p1Games === tiebreakAt) return "p2"
  }

  // Final set tiebreak
  if (isFinalSet && format.finalSetTiebreak) {
    const tiebreakAt = format.shortSets ? 4 : 6
    if (p1Games === tiebreakAt + 1 && p2Games === tiebreakAt) return "p1"
    if (p2Games === tiebreakAt + 1 && p1Games === tiebreakAt) return "p2"
  }
  
  return null
}

export function isMatchWon(currentSets: number[][], format: MatchFormat): { won: boolean; winner: "p1" | "p2" | null } {
  const setsNeededToWin = Math.ceil(format.sets / 2)
  const p1SetsWon = currentSets.filter(set => set[0] > set[1]).length
  const p2SetsWon = currentSets.filter(set => set[1] > set[0]).length
  
  if (p1SetsWon >= setsNeededToWin) return { won: true, winner: "p1" }
  if (p2SetsWon >= setsNeededToWin) return { won: true, winner: "p2" }
  
  return { won: false, winner: null }
}

export function shouldStartTiebreak(p1Games: number, p2Games: number, format: MatchFormat): boolean {
  const targetGames = format.shortSets ? 4 : 6
  if (format.tiebreak && p1Games === targetGames && p2Games === targetGames) {
    return true
  }
  if (format.finalSetTiebreak && p1Games === targetGames && p2Games === targetGames) {
    return true
  }
  return false
}

export function formatFinalScore(sets: number[][]): string {
  // Format final match score like "6-4, 6-3" or "6-4, 3-6, 6-2"
  return sets.map(set => `${set[0]}-${set[1]}`).join(", ")
}

export function reconstructMatchScore(pointLog: { winner: "p1" | "p2"; setNumber: number; gameNumber: number }[]): {
  sets: number[][]
  finalScore: string
} {
  // Reconstruct the entire match score from point log
  const sets: number[][] = []
  const gamesCounts: Record<number, { p1: number; p2: number }> = {}
  
  // Group points by set and game, then count game winners
  pointLog.forEach(point => {
    if (!gamesCounts[point.setNumber]) {
      gamesCounts[point.setNumber] = { p1: 0, p2: 0 }
    }
  })
  
  // Find the last point of each game to determine game winners
  const gameWinners: Record<string, "p1" | "p2"> = {}
  pointLog.forEach(point => {
    const gameKey = `${point.setNumber}-${point.gameNumber}`
    gameWinners[gameKey] = point.winner // Last point in the array for this game wins it
  })
  
  // Count games won per set
  Object.entries(gameWinners).forEach(([gameKey, winner]) => {
    const [setNum] = gameKey.split('-').map(Number)
    if (!gamesCounts[setNum]) {
      gamesCounts[setNum] = { p1: 0, p2: 0 }
    }
    gamesCounts[setNum][winner]++
  })
  
  // Convert to sets array
  Object.keys(gamesCounts).sort((a, b) => Number(a) - Number(b)).forEach(setNum => {
    const setCount = gamesCounts[Number(setNum)]
    sets.push([setCount.p1, setCount.p2])
  })
  
  return {
    sets,
    finalScore: formatFinalScore(sets)
  }
}

// Tennis score mapping (simple version for UI consistency)
const TENNIS_SCORES = ["0", "15", "30", "40"]

export function getTennisScore(p1Points: number, p2Points: number): string {
  // Handle deuce and advantage situations
  if (p1Points >= 3 && p2Points >= 3) {
    if (p1Points === p2Points) return "40-40" // Deuce
    if (p1Points > p2Points) return "AD-40" // Advantage P1
    return "40-AD" // Advantage P2
  }
  
  // Regular scoring
  const p1Score = TENNIS_SCORES[Math.min(p1Points, 3)] || "40"
  const p2Score = TENNIS_SCORES[Math.min(p2Points, 3)] || "40"
  return `${p1Score}-${p2Score}`
} 