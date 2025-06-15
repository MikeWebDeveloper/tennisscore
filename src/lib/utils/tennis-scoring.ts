// Tennis Scoring Utilities

export interface TennisScore {
  sets: number[][] // [set1[p1,p2], set2[p1,p2], ...]
  games: number[] // [p1Games, p2Games] in current set
  points: number[] // [p1Points, p2Points] in current game
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
  const totalGames = gameNumber - 1 // Convert to 0-indexed
  return totalGames % 2 === 0 ? "p1" : "p2"
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

export function reconstructGameProgression(gamePoints: { winner: "p1" | "p2" }[], noAd: boolean = false): string[] {
  // Reconstruct the score progression through a game
  const progression: string[] = []
  let p1Points = 0
  let p2Points = 0
  
  // Add initial score
  progression.push("0-0")
  
  for (const point of gamePoints) {
    // Award point to winner
    if (point.winner === "p1") {
      p1Points++
    } else {
      p2Points++
    }
    
    // Convert to tennis score and add to progression
    const scoreDisplay = convertPointsToGameScore(p1Points, p2Points, noAd)
    progression.push(scoreDisplay)
    
    // Stop if game is won
    if (isGameWon(p1Points, p2Points, noAd)) {
      break
    }
  }
  
  return progression
}

export function getGameScoreAfterWin(
  gameNumber: number,
  winner: "p1" | "p2",
  currentGames: number[]
): string {
  // Return the game score after someone wins a game
  const newP1Games = winner === "p1" ? currentGames[0] + 1 : currentGames[0]
  const newP2Games = winner === "p2" ? currentGames[1] + 1 : currentGames[1]
  
  return `${newP1Games}-${newP2Games}`
}

export function isSetWon(p1Games: number, p2Games: number, format: MatchFormat, currentSets: number[][]): boolean {
  const targetGames = format.shortSets ? 4 : 6
  
  // Standard set: first to target games, must win by 2
  if (p1Games >= targetGames && p1Games - p2Games >= 2) return true
  if (p2Games >= targetGames && p2Games - p1Games >= 2) return true
  
  // Tiebreak scenario
  if (format.tiebreak) {
    const tiebreakAt = format.shortSets ? 4 : 6
    if ((p1Games === tiebreakAt + 1 && p2Games === tiebreakAt) || 
        (p2Games === tiebreakAt + 1 && p1Games === tiebreakAt)) return true
  }
  
  // Final set tiebreak (different rule for final set only)
  // Check if this is potentially the final set based on current sets already won
  const setsWonCount = currentSets.filter(set => set[0] > set[1]).length + currentSets.filter(set => set[1] > set[0]).length
  if (format.finalSetTiebreak && setsWonCount === format.sets - 1) { 
    if (format.finalSetTiebreakAt) { // Check if tiebreak is to a specific number (e.g., 10 points)
      return (p1Games === format.finalSetTiebreakAt && p1Games - p2Games >= 2) ||
             (p2Games === format.finalSetTiebreakAt && p2Games - p1Games >= 2)
    } else { // Standard tiebreak rules (to 7 by 2)
      return (p1Games >= 7 && p1Games - p2Games >= 2) ||
             (p2Games >= 7 && p2Games - p1Games >= 2)
    }
  }
  
  return false
}

export function getSetWinner(p1Games: number, p2Games: number, format: MatchFormat, currentSets: number[][]): "p1" | "p2" | null {
  const targetGames = format.shortSets ? 4 : 6
  
  if (p1Games >= targetGames && p1Games - p2Games >= 2) return "p1"
  if (p2Games >= targetGames && p2Games - p1Games >= 2) return "p2"
  
  // Tiebreak scenario
  if (format.tiebreak) {
    const tiebreakAt = format.shortSets ? 4 : 6
    if (p1Games === tiebreakAt + 1 && p2Games === tiebreakAt) return "p1"
    if (p2Games === tiebreakAt + 1 && p1Games === tiebreakAt) return "p2"
  }

  // Final set tiebreak (different rule for final set only)
  const setsWonCount = currentSets.filter(set => set[0] > set[1]).length + currentSets.filter(set => set[1] > set[0]).length
  if (format.finalSetTiebreak && setsWonCount === format.sets - 1) { 
    if (format.finalSetTiebreakAt) {
      if (p1Games === format.finalSetTiebreakAt && p1Games - p2Games >= 2) return "p1"
      if (p2Games === format.finalSetTiebreakAt && p2Games - p1Games >= 2) return "p2"
    } else {
      if (p1Games >= 7 && p1Games - p2Games >= 2) return "p1"
      if (p2Games >= 7 && p2Games - p1Games >= 2) return "p2"
    }
  }
  
  return null
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