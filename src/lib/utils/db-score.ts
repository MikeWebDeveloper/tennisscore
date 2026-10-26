import type { Score } from '@/stores/matchStore'

/**
 * Parse the score JSON stored in the database into the engine's Score. Handles both the modern
 * array format and the legacy {player1, player2} object format; never throws.
 */
const defaultScore: Score = {
  sets: [],
  games: [0, 0],
  points: [0, 0],
  isTiebreak: false,
  tiebreakPoints: [0, 0],
}

// Utility to parse and convert score from DB format to store format
export function parseDbScore(scoreString: string | undefined): Score {
  if (!scoreString) return defaultScore
  try {
    const dbScore = JSON.parse(scoreString)
    
    // Handle both modern format (arrays) and legacy format (objects with player1/player2)
    let sets: [number, number][] = []
    let games: [number, number] = [0, 0]
    let points: [number, number] = [0, 0]
    let tiebreakPoints: [number, number] = [0, 0]
    
    // Parse sets - handle both formats
    if (dbScore.sets && Array.isArray(dbScore.sets)) {
      sets = dbScore.sets.map((s: unknown) => {
        if (Array.isArray(s)) {
          // Modern format: [6, 4]
          return [s[0] || 0, s[1] || 0] as [number, number]
        } else if (s && typeof s === 'object' && s !== null) {
          // Legacy format: {player1: 6, player2: 4}
          const legacySet = s as { player1?: number; player2?: number; [key: number]: number }
          return [legacySet.player1 || legacySet[0] || 0, legacySet.player2 || legacySet[1] || 0] as [number, number]
        }
        return [0, 0] as [number, number]
      })
    }
    
    // Parse games - handle both formats
    if (dbScore.games) {
      if (Array.isArray(dbScore.games)) {
        if (dbScore.games.length === 2 && typeof dbScore.games[0] === 'number') {
          // Modern simple format: [2, 0]
          games = [dbScore.games[0] || 0, dbScore.games[1] || 0]
        } else if (dbScore.games.length > 0) {
          // Complex format: array of game objects or arrays
          const lastGame = dbScore.games[dbScore.games.length - 1]
          if (Array.isArray(lastGame)) {
            // Format: [[0,0], [1,1]] -> use last element
            games = [lastGame[0] || 0, lastGame[1] || 0]
          } else if (typeof lastGame === 'object') {
            // Format: [{player1: 0, player2: 0}] -> use last element
            games = [lastGame.player1 || 0, lastGame.player2 || 0]
          }
        }
      } else if (typeof dbScore.games === 'object') {
        // Legacy single object format: {player1: 0, player2: 0}
        games = [dbScore.games.player1 || 0, dbScore.games.player2 || 0]
      }
    }
    
    // Parse points - handle both formats
    if (dbScore.points) {
      if (Array.isArray(dbScore.points)) {
        // Modern format: [1, 1]
        points = [dbScore.points[0] || 0, dbScore.points[1] || 0]
      } else if (typeof dbScore.points === 'object') {
        // Legacy format: {player1: "1", player2: "1"}
        points = [
          parseInt(dbScore.points.player1, 10) || 0,
          parseInt(dbScore.points.player2, 10) || 0
        ]
      }
    }
    
    // Parse tiebreak points - handle both formats
    if (dbScore.tiebreakPoints) {
      if (Array.isArray(dbScore.tiebreakPoints)) {
        // Modern format: [0, 0]
        tiebreakPoints = [dbScore.tiebreakPoints[0] || 0, dbScore.tiebreakPoints[1] || 0]
      } else if (typeof dbScore.tiebreakPoints === 'object') {
        // Legacy format: {player1: 0, player2: 0}
        tiebreakPoints = [dbScore.tiebreakPoints.player1 || 0, dbScore.tiebreakPoints.player2 || 0]
      }
    }
    
    const convertedScore: Score = {
      sets,
      games,
      points,
      isTiebreak: dbScore.isTiebreak || false,
      tiebreakPoints,
    }
    
    return convertedScore
  } catch {
    return defaultScore
  }
}
