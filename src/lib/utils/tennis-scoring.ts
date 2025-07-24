import { MatchFormat, PointDetail, Score } from "@/stores/matchStore"

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
    // In no-ad: returner needs 3 points and to be ahead of or tied with server
    return returnerPoints === 3 && returnerPoints >= serverPoints
  }
  
  // Standard scoring - exact conditions for break point
  // BP when returner is at 40 and server is at 0, 15, or 30
  if (returnerPoints === 3 && serverPoints <= 2) return true // 0-40, 15-40, 30-40
  
  // BP when returner has advantage (AD-40)
  if (returnerPoints >= 4 && serverPoints >= 3 && returnerPoints === serverPoints + 1) return true
  
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

export function isSetPoint(
  p1Games: number, 
  p2Games: number, 
  p1Points: number, 
  p2Points: number,
  format: MatchFormat,
  isTiebreak: boolean = false,
  currentSets: number[][] = []
): { isSetPoint: boolean; player: "p1" | "p2" | null } {
  // Check if this is the final set
  const setsNeededToWin = Math.ceil(format.sets / 2)
  const p1SetsWon = currentSets.filter(set => set[0] > set[1]).length
  const p2SetsWon = currentSets.filter(set => set[1] > set[0]).length
  // Treat first set as match if format.sets === 1
  const isFinalSet = (format.sets === 1) || (p1SetsWon === setsNeededToWin - 1 && p2SetsWon === setsNeededToWin - 1)
  if (isTiebreak) {
    const tiebreakTarget = (isFinalSet && format.finalSetTiebreak === "super") ? (format.finalSetTiebreakAt || 10) : 7
    // Set point in tiebreak - only if player can win with next point
    if (
      p1Points >= tiebreakTarget - 1 &&
      (p1Points + 1) >= tiebreakTarget && (p1Points + 1) - p2Points >= 2
    ) {
      return { isSetPoint: true, player: "p1" }
    }
    if (
      p2Points >= tiebreakTarget - 1 &&
      (p2Points + 1) >= tiebreakTarget && (p2Points + 1) - p1Points >= 2
    ) {
      return { isSetPoint: true, player: "p2" }
    }
    return { isSetPoint: false, player: null }
  }
  // Regular game - check if winning this point would win the game, and if winning the game would win the set
  let gamePointPlayer: "p1" | "p2" | null = null
  if (format.noAd) {
    if (p1Points === 3 && p1Points >= p2Points) gamePointPlayer = "p1"
    else if (p2Points === 3 && p2Points >= p1Points) gamePointPlayer = "p2"
  } else {
    if (p1Points === 3 && p2Points <= 2) gamePointPlayer = "p1"
    else if (p2Points === 3 && p1Points <= 2) gamePointPlayer = "p2"
    else if (p1Points >= 4 && p2Points >= 3 && p1Points === p2Points + 1) gamePointPlayer = "p1"
    else if (p2Points >= 4 && p1Points >= 3 && p2Points === p1Points + 1) gamePointPlayer = "p2"
  }
  if (!gamePointPlayer) return { isSetPoint: false, player: null }

  // Simulate winning the game for the player at game point
  let nextP1Games = p1Games
  let nextP2Games = p2Games
  if (gamePointPlayer === "p1") nextP1Games += 1
  if (gamePointPlayer === "p2") nextP2Games += 1
  // Use isSetWon to check if this would win the set
  if (gamePointPlayer === "p1" && isSetWon(nextP1Games, nextP2Games, format)) {
    return { isSetPoint: true, player: "p1" }
  }
  if (gamePointPlayer === "p2" && isSetWon(nextP2Games, nextP1Games, format)) {
    return { isSetPoint: true, player: "p2" }
  }
  return { isSetPoint: false, player: null }
}

export function isMatchPoint(
  p1Games: number, 
  p2Games: number, 
  p1Points: number, 
  p2Points: number,
  currentSets: number[][],
  format: MatchFormat,
  isTiebreak: boolean = false
): { isMatchPoint: boolean; player: "p1" | "p2" | null } {
  // Treat first set as match if format.sets === 1
  const setsNeededToWin = Math.ceil(format.sets / 2)
  const p1SetsWon = currentSets.filter(set => set[0] > set[1]).length
  const p2SetsWon = currentSets.filter(set => set[1] > set[0]).length
  const p1OneSetAway = (format.sets === 1) || p1SetsWon === setsNeededToWin - 1
  const p2OneSetAway = (format.sets === 1) || p2SetsWon === setsNeededToWin - 1
  if (!p1OneSetAway && !p2OneSetAway) {
    return { isMatchPoint: false, player: null }
  }
  // Check if current situation is also a set point
  const setPointStatus = isSetPoint(p1Games, p2Games, p1Points, p2Points, format, isTiebreak, currentSets)
  if (setPointStatus.isSetPoint) {
    if (setPointStatus.player === "p1" && p1OneSetAway) {
      return { isMatchPoint: true, player: "p1" }
    }
    if (setPointStatus.player === "p2" && p2OneSetAway) {
      return { isMatchPoint: true, player: "p2" }
    }
  }
  return { isMatchPoint: false, player: null }
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
  if (format.finalSetTiebreak === "standard" || format.finalSetTiebreak === "super") {
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
  if (isFinalSet && (format.finalSetTiebreak === "standard" || format.finalSetTiebreak === "super")) {
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
  if ((format.finalSetTiebreak === "standard" || format.finalSetTiebreak === "super") && p1Games === targetGames && p2Games === targetGames) {
    return true
  }
  return false
}

export function shouldBeInSuperTiebreak(currentSets: number[][], format: MatchFormat): boolean {
  if (format.finalSetTiebreak !== "super") return false
  
  const setsToWin = Math.ceil(format.sets / 2)
  const p1SetsWon = currentSets.filter(s => s[0] > s[1]).length
  const p2SetsWon = currentSets.filter(s => s[1] > s[0]).length
  
  // Check if we're in the deciding set (both players have won setsToWin - 1 sets)
  return p1SetsWon === setsToWin - 1 && p2SetsWon === setsToWin - 1
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

/**
 * Calculates the entire match score based on a log of points.
 * This serves as the single source of truth for the score state.
 * @param log The array of PointDetail objects.
 * @param format The format of the match.
 * @returns The calculated Score object.
 */
export const calculateScoreFromPointLog = (log: PointDetail[], format: MatchFormat): Score => {
  const newScore: Score = {
    sets: [],
    games: [0, 0],
    points: [0, 0],
    isTiebreak: false,
    tiebreakPoints: [0, 0],
  };

  const setsToWin = Math.ceil(format.sets / 2);

  for (const point of log) {
    const p1SetsWon = newScore.sets.filter(s => s[0] > s[1]).length;
    const p2SetsWon = newScore.sets.filter(s => s[1] > s[0]).length;

    if (p1SetsWon >= setsToWin || p2SetsWon >= setsToWin) {
      break; 
    }
    
    // Check if we should be in a super tiebreak (deciding set with super tiebreak format)
    const isDecidingSet = p1SetsWon === setsToWin - 1 && p2SetsWon === setsToWin - 1;
    const shouldStartSuperTiebreak = isDecidingSet && format.finalSetTiebreak === "super" && newScore.games[0] === 0 && newScore.games[1] === 0 && !newScore.isTiebreak;
    
    if (shouldStartSuperTiebreak) {
      newScore.isTiebreak = true;
      newScore.tiebreakPoints = [0, 0];
      newScore.initialTiebreakServer = point.server;
    }
    
    const winnerIdx = point.winner === 'p1' ? 0 : 1;

    if (newScore.isTiebreak) {
      newScore.tiebreakPoints![winnerIdx]++;
      const tiebreakTarget = (isDecidingSet && format.finalSetTiebreak === "super") ? (format.finalSetTiebreakAt || 10) : 7;

      if (isTiebreakWon(newScore.tiebreakPoints![0], newScore.tiebreakPoints![1], tiebreakTarget)) {
        // In super tiebreak, winning the tiebreak wins the set directly
        if (isDecidingSet && format.finalSetTiebreak === "super") {
          newScore.sets.push([newScore.tiebreakPoints![0], newScore.tiebreakPoints![1]]);
        } else {
          newScore.games[winnerIdx]++;
          newScore.sets.push([...newScore.games]);
        }
        newScore.games = [0, 0];
        newScore.isTiebreak = false;
        newScore.tiebreakPoints = [0, 0];
      }
    } else {
      newScore.points[winnerIdx]++;
      if (isGameWon(newScore.points[0], newScore.points[1], format.noAd)) {
        newScore.games[winnerIdx]++;
        newScore.points = [0, 0];

        if (shouldStartTiebreak(newScore.games[0], newScore.games[1], format) && (!isDecidingSet || format.finalSetTiebreak === "standard")) {
            newScore.isTiebreak = true;
            newScore.initialTiebreakServer = point.server === 'p1' ? (newScore.games[0] + newScore.games[1]) % 2 !== 0 ? 'p1' : 'p2' : (newScore.games[0] + newScore.games[1]) % 2 !== 0 ? 'p2' : 'p1';
        } else if (isSetWon(newScore.games[0], newScore.games[1], format)) {
            newScore.sets.push([...newScore.games]);
            newScore.games = [0, 0];
        }
      }
    }
  }
  return newScore;
}; 