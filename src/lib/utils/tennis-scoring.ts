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

// Enhanced Pressure and Clutch Analysis Functions

export interface PressureAnalysis {
  level: 1 | 2 | 3 | 4 | 5; // 1 = low pressure, 5 = extreme pressure
  factors: string[]; // Array of contributing factors
  description: string;
}

export interface ClutchSituation {
  isClutch: boolean;
  type: 'break_point' | 'set_point' | 'match_point' | 'comeback' | 'tiebreak' | 'deciding_set' | null;
  level: 1 | 2 | 3 | 4 | 5; // Intensity level
  description: string;
  affectedPlayer: 'p1' | 'p2' | null; // Player under pressure
}

export interface MomentumShift {
  hasShifted: boolean;
  direction: 'p1' | 'p2' | null; // Which player gained momentum
  intensity: 1 | 2 | 3 | 4 | 5; // How significant the shift
  description: string;
  triggerPoints: number; // Number of points that triggered the shift
}

export interface ComebackSituation {
  isComeback: boolean;
  type: 'game' | 'set' | 'match' | null;
  player: 'p1' | 'p2' | null;
  deficit: number; // How many points/games/sets behind they were
  description: string;
}

export interface StreakAnalysis {
  currentStreak: {
    player: 'p1' | 'p2' | null;
    length: number;
    type: 'points' | 'games' | 'sets';
  };
  longestPointStreak: {
    player: 'p1' | 'p2';
    length: number;
    startPoint: number;
    endPoint: number;
  };
  recentForm: {
    p1: { wins: number; total: number; percentage: number };
    p2: { wins: number; total: number; percentage: number };
  };
}

/**
 * Calculate pressure level (1-5) based on game situation, set status, and recent momentum
 */
export function getPressureLevel(
  pointLog: PointDetail[],
  currentScore: Score,
  format: MatchFormat
): PressureAnalysis {
  const factors: string[] = [];
  let pressureScore = 1;

  if (pointLog.length === 0) {
    return {
      level: 1,
      factors: ['Match just started'],
      description: 'Low pressure - beginning of match'
    };
  }

  const setsNeededToWin = Math.ceil(format.sets / 2);
  const p1SetsWon = currentScore.sets.filter(set => set[0] > set[1]).length;
  const p2SetsWon = currentScore.sets.filter(set => set[1] > set[0]).length;
  const isDecidingSet = p1SetsWon === setsNeededToWin - 1 && p2SetsWon === setsNeededToWin - 1;

  // Check for match/set point situations
  const matchPointStatus = isMatchPoint(
    currentScore.games[0], 
    currentScore.games[1], 
    currentScore.points[0], 
    currentScore.points[1],
    currentScore.sets,
    format,
    currentScore.isTiebreak
  );

  const setPointStatus = isSetPoint(
    currentScore.games[0], 
    currentScore.games[1], 
    currentScore.points[0], 
    currentScore.points[1],
    format,
    currentScore.isTiebreak,
    currentScore.sets
  );

  // Match point adds maximum pressure
  if (matchPointStatus.isMatchPoint) {
    pressureScore += 4;
    factors.push(`Match point for ${matchPointStatus.player}`);
  }
  // Set point adds significant pressure
  else if (setPointStatus.isSetPoint) {
    pressureScore += 3;
    factors.push(`Set point for ${setPointStatus.player}`);
    
    if (isDecidingSet) {
      pressureScore += 1;
      factors.push('Deciding set');
    }
  }

  // Break point pressure
  const lastPoint = pointLog[pointLog.length - 1];
  if (lastPoint?.isBreakPoint) {
    pressureScore += 2;
    factors.push('Break point situation');
  }

  // Tiebreak pressure
  if (currentScore.isTiebreak) {
    pressureScore += 2;
    factors.push('Tiebreak situation');
    
    const tiebreakTarget = (isDecidingSet && format.finalSetTiebreak === "super") ? 
      (format.finalSetTiebreakAt || 10) : 7;
    
    const p1TB = currentScore.tiebreakPoints?.[0] || 0;
    const p2TB = currentScore.tiebreakPoints?.[1] || 0;
    const maxTBPoints = Math.max(p1TB, p2TB);
    
    if (maxTBPoints >= tiebreakTarget - 2) {
      pressureScore += 1;
      factors.push('Close tiebreak');
    }
  }

  // Close game pressure
  const p1Points = currentScore.points[0];
  const p2Points = currentScore.points[1];
  const isCloseGame = (p1Points >= 2 && p2Points >= 2) || 
                     (p1Points >= 3 || p2Points >= 3);
  
  if (isCloseGame && !currentScore.isTiebreak) {
    pressureScore += 1;
    factors.push('Close game');
  }

  // Momentum considerations
  const recentPoints = pointLog.slice(-6); // Last 6 points
  const recentWinners = recentPoints.map(p => p.winner);
  const p1RecentWins = recentWinners.filter(w => w === 'p1').length;
  const p2RecentWins = recentWinners.filter(w => w === 'p2').length;
  
  if (Math.abs(p1RecentWins - p2RecentWins) >= 4) {
    pressureScore += 1;
    factors.push('Momentum swing');
  }

  // Deciding set adds pressure
  if (isDecidingSet && !factors.includes('Deciding set')) {
    pressureScore += 1;
    factors.push('Deciding set');
  }

  // Close set pressure
  const currentGames = Math.abs(currentScore.games[0] - currentScore.games[1]);
  if (currentGames <= 1 && Math.max(currentScore.games[0], currentScore.games[1]) >= 4) {
    pressureScore += 1;
    factors.push('Close set');
  }

  // Cap at 5
  const finalLevel = Math.min(5, pressureScore) as 1 | 2 | 3 | 4 | 5;

  const descriptions = {
    1: 'Low pressure - routine situation',
    2: 'Moderate pressure - important points',
    3: 'High pressure - crucial moments',
    4: 'Very high pressure - critical situation',
    5: 'Extreme pressure - decisive moments'
  };

  return {
    level: finalLevel,
    factors: factors.length > 0 ? factors : ['Standard play'],
    description: descriptions[finalLevel]
  };
}

/**
 * Detect clutch scenarios with different types and levels
 */
export function isClutchSituation(
  pointLog: PointDetail[],
  currentScore: Score,
  format: MatchFormat
): ClutchSituation {
  if (pointLog.length === 0) {
    return {
      isClutch: false,
      type: null,
      level: 1,
      description: 'No clutch situation',
      affectedPlayer: null
    };
  }

  const setsNeededToWin = Math.ceil(format.sets / 2);
  const p1SetsWon = currentScore.sets.filter(set => set[0] > set[1]).length;
  const p2SetsWon = currentScore.sets.filter(set => set[1] > set[0]).length;
  const isDecidingSet = p1SetsWon === setsNeededToWin - 1 && p2SetsWon === setsNeededToWin - 1;

  // Check match point
  const matchPointStatus = isMatchPoint(
    currentScore.games[0], 
    currentScore.games[1], 
    currentScore.points[0], 
    currentScore.points[1],
    currentScore.sets,
    format,
    currentScore.isTiebreak
  );

  if (matchPointStatus.isMatchPoint) {
    return {
      isClutch: true,
      type: 'match_point',
      level: 5,
      description: `Match point for ${matchPointStatus.player}`,
      affectedPlayer: matchPointStatus.player === 'p1' ? 'p2' : 'p1'
    };
  }

  // Check set point
  const setPointStatus = isSetPoint(
    currentScore.games[0], 
    currentScore.games[1], 
    currentScore.points[0], 
    currentScore.points[1],
    format,
    currentScore.isTiebreak,
    currentScore.sets
  );

  if (setPointStatus.isSetPoint) {
    const level = isDecidingSet ? 5 : 4;
    return {
      isClutch: true,
      type: 'set_point',
      level: level as 4 | 5,
      description: `Set point for ${setPointStatus.player}${isDecidingSet ? ' (deciding set)' : ''}`,
      affectedPlayer: setPointStatus.player === 'p1' ? 'p2' : 'p1'
    };
  }

  // Check break point
  const lastPoint = pointLog[pointLog.length - 1];
  if (lastPoint?.isBreakPoint) {
    const level = isDecidingSet ? 4 : 3;
    return {
      isClutch: true,
      type: 'break_point',
      level: level as 3 | 4,
      description: `Break point situation${isDecidingSet ? ' (deciding set)' : ''}`,
      affectedPlayer: lastPoint.server
    };
  }

  // Check tiebreak
  if (currentScore.isTiebreak) {
    const level = isDecidingSet ? 4 : 3;
    return {
      isClutch: true,
      type: 'tiebreak',
      level: level as 3 | 4,
      description: `Tiebreak${isDecidingSet ? ' (deciding set)' : ''}`,
      affectedPlayer: null
    };
  }

  // Check deciding set
  if (isDecidingSet) {
    return {
      isClutch: true,
      type: 'deciding_set',
      level: 3,
      description: 'Deciding set',
      affectedPlayer: null
    };
  }

  // Check comeback situation
  const comeback = detectComebackSituation(pointLog, currentScore, format);
  if (comeback.isComeback) {
    return {
      isClutch: true,
      type: 'comeback',
      level: 3,
      description: comeback.description,
      affectedPlayer: comeback.player === 'p1' ? 'p2' : 'p1'
    };
  }

  return {
    isClutch: false,
    type: null,
    level: 1,
    description: 'No clutch situation',
    affectedPlayer: null
  };
}

/**
 * Analyze momentum changes based on recent point patterns
 */
export function calculateMomentumShift(
  pointLog: PointDetail[],
  lookbackPoints: number = 8
): MomentumShift {
  if (pointLog.length < 4) {
    return {
      hasShifted: false,
      direction: null,
      intensity: 1,
      description: 'Insufficient data for momentum analysis',
      triggerPoints: 0
    };
  }

  const recentPoints = pointLog.slice(-lookbackPoints);
  const midPoint = Math.floor(recentPoints.length / 2);
  
  // Split into two halves for comparison
  const firstHalf = recentPoints.slice(0, midPoint);
  const secondHalf = recentPoints.slice(midPoint);

  // Calculate win rates for each half
  const firstHalfP1Wins = firstHalf.filter(p => p.winner === 'p1').length;
  const firstHalfP1Rate = firstHalfP1Wins / firstHalf.length;
  
  const secondHalfP1Wins = secondHalf.filter(p => p.winner === 'p1').length;
  const secondHalfP1Rate = secondHalfP1Wins / secondHalf.length;

  const momentumChange = secondHalfP1Rate - firstHalfP1Rate;
  const absoluteChange = Math.abs(momentumChange);

  // Determine if there's a significant shift (threshold: 0.4)
  if (absoluteChange < 0.4) {
    return {
      hasShifted: false,
      direction: null,
      intensity: 1,
      description: 'No significant momentum shift',
      triggerPoints: 0
    };
  }

  const direction = momentumChange > 0 ? 'p1' : 'p2';
  let intensity: 1 | 2 | 3 | 4 | 5;
  let description: string;

  if (absoluteChange >= 0.8) {
    intensity = 5;
    description = `Strong momentum shift to ${direction}`;
  } else if (absoluteChange >= 0.6) {
    intensity = 4;
    description = `Clear momentum shift to ${direction}`;
  } else if (absoluteChange >= 0.5) {
    intensity = 3;
    description = `Moderate momentum shift to ${direction}`;
  } else {
    intensity = 2;
    description = `Slight momentum shift to ${direction}`;
  }

  return {
    hasShifted: true,
    direction,
    intensity,
    description,
    triggerPoints: secondHalf.length
  };
}

/**
 * Identify comeback scenarios
 */
export function detectComebackSituation(
  pointLog: PointDetail[],
  currentScore: Score,
  format: MatchFormat
): ComebackSituation {
  if (pointLog.length < 10) {
    return {
      isComeback: false,
      type: null,
      player: null,
      deficit: 0,
      description: 'No comeback situation detected'
    };
  }

  // Check for match-level comeback
  const setsNeededToWin = Math.ceil(format.sets / 2);
  const p1SetsWon = currentScore.sets.filter(set => set[0] > set[1]).length;
  const p2SetsWon = currentScore.sets.filter(set => set[1] > set[0]).length;

  // Check if someone was down in sets and is now level or ahead
  if (format.sets >= 3) {
    const maxSetsWon = Math.max(p1SetsWon, p2SetsWon);
    const minSetsWon = Math.min(p1SetsWon, p2SetsWon);
    
    if (maxSetsWon >= setsNeededToWin - 1 && minSetsWon === maxSetsWon) {
      // Someone came back to level the match
      const comebackPlayer = p1SetsWon === p2SetsWon ? 
        (p1SetsWon > 0 ? 'p2' : 'p1') : // Simplified logic
        (p1SetsWon > p2SetsWon ? 'p1' : 'p2');
      
      return {
        isComeback: true,
        type: 'match',
        player: comebackPlayer,
        deficit: 1,
        description: `${comebackPlayer} came back to level the match`
      };
    }
  }

  // Check for set-level comeback
  const p1Games = currentScore.games[0];
  const p2Games = currentScore.games[1];
  const gamesDiff = Math.abs(p1Games - p2Games);
  
  if (gamesDiff <= 1 && Math.max(p1Games, p2Games) >= 4) {
    // Check recent game history to see if someone was significantly behind
    const recentPoints = pointLog.slice(-20);
    let wasSignificantlyBehind = false;
    let comebackPlayer: 'p1' | 'p2' | null = null;

    // Look for patterns where someone was down multiple games
    if (p1Games === p2Games && p1Games >= 4) {
      // Currently level - check who was behind recently
      const p1RecentWins = recentPoints.filter(p => p.winner === 'p1').length;
      const p2RecentWins = recentPoints.filter(p => p.winner === 'p2').length;
      
      if (Math.abs(p1RecentWins - p2RecentWins) >= 6) {
        wasSignificantlyBehind = true;
        comebackPlayer = p1RecentWins > p2RecentWins ? 'p1' : 'p2';
      }
    }

    if (wasSignificantlyBehind && comebackPlayer) {
      return {
        isComeback: true,
        type: 'set',
        player: comebackPlayer,
        deficit: 2,
        description: `${comebackPlayer} came back from games deficit`
      };
    }
  }

  // Check for game-level comeback
  if (!currentScore.isTiebreak) {
    const p1Points = currentScore.points[0];
    const p2Points = currentScore.points[1];
    
    // Check for comeback from 0-40 or similar
    if ((p1Points >= 3 && p2Points === 0) || (p2Points >= 3 && p1Points === 0)) {
      const comebackPlayer = p1Points > p2Points ? 'p1' : 'p2';
      const deficit = Math.abs(p1Points - p2Points);
      
      if (deficit >= 3) {
        return {
          isComeback: true,
          type: 'game',
          player: comebackPlayer,
          deficit,
          description: `${comebackPlayer} came back from ${deficit}-point deficit`
        };
      }
    }
  }

  return {
    isComeback: false,
    type: null,
    player: null,
    deficit: 0,
    description: 'No comeback situation detected'
  };
}

/**
 * Track point streaks and analyze recent form
 */
export function calculateCurrentStreak(
  pointLog: PointDetail[],
  analysisWindow: number = 20
): StreakAnalysis {
  if (pointLog.length === 0) {
    return {
      currentStreak: { player: null, length: 0, type: 'points' },
      longestPointStreak: { player: 'p1', length: 0, startPoint: 0, endPoint: 0 },
      recentForm: {
        p1: { wins: 0, total: 0, percentage: 0 },
        p2: { wins: 0, total: 0, percentage: 0 }
      }
    };
  }

  // Calculate current point streak
  let currentStreakLength = 1;
  const currentStreakPlayer = pointLog[pointLog.length - 1].winner;
  
  for (let i = pointLog.length - 2; i >= 0; i--) {
    if (pointLog[i].winner === currentStreakPlayer) {
      currentStreakLength++;
    } else {
      break;
    }
  }

  // Find longest point streak in the match
  let longestStreak = { player: 'p1' as 'p1' | 'p2', length: 0, startPoint: 0, endPoint: 0 };
  let currentLength = 1;
  let streakStart = 0;

  for (let i = 1; i < pointLog.length; i++) {
    if (pointLog[i].winner === pointLog[i - 1].winner) {
      currentLength++;
    } else {
      if (currentLength > longestStreak.length) {
        longestStreak = {
          player: pointLog[i - 1].winner,
          length: currentLength,
          startPoint: streakStart + 1, // 1-indexed
          endPoint: i
        };
      }
      currentLength = 1;
      streakStart = i;
    }
  }

  // Check final streak
  if (currentLength > longestStreak.length) {
    longestStreak = {
      player: pointLog[pointLog.length - 1].winner,
      length: currentLength,
      startPoint: streakStart + 1,
      endPoint: pointLog.length
    };
  }

  // Calculate recent form
  const recentPoints = pointLog.slice(-Math.min(analysisWindow, pointLog.length));
  const p1RecentWins = recentPoints.filter(p => p.winner === 'p1').length;
  const p2RecentWins = recentPoints.filter(p => p.winner === 'p2').length;
  const totalRecent = recentPoints.length;

  return {
    currentStreak: {
      player: currentStreakLength > 1 ? currentStreakPlayer : null,
      length: currentStreakLength,
      type: 'points'
    },
    longestPointStreak: longestStreak,
    recentForm: {
      p1: {
        wins: p1RecentWins,
        total: totalRecent,
        percentage: totalRecent > 0 ? Math.round((p1RecentWins / totalRecent) * 100) : 0
      },
      p2: {
        wins: p2RecentWins,
        total: totalRecent,
        percentage: totalRecent > 0 ? Math.round((p2RecentWins / totalRecent) * 100) : 0
      }
    }
  };
} 