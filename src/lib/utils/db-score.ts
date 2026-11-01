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
          const legacySet = s as { player1?: number; player2?: number; p1?: number; p2?: number; [key: number]: number }
          return [legacySet.player1 ?? legacySet.p1 ?? legacySet[0] ?? 0, legacySet.player2 ?? legacySet.p2 ?? legacySet[1] ?? 0] as [number, number]
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

export type ServeIndicator = 'first' | 'second'

/**
 * Which serve the server is on, as the scorer last set it (kept in the stored score JSON so
 * spectators see it). Kept out of parseDbScore on purpose: the scoring store must never carry it,
 * or the next point would write a stale "second serve" back.
 */
export function serveIndicator(scoreString: string | undefined): ServeIndicator {
  try {
    return JSON.parse(scoreString || '{}')?.serve === 'second' ? 'second' : 'first'
  } catch {
    return 'first'
  }
}

/** The stored score JSON with the serve set; unchanged text when it already says so (or is not JSON) */
export function withServeIndicator(scoreString: string | undefined, serve: ServeIndicator): string {
  try {
    const score = JSON.parse(scoreString || '{}')
    if (!score || typeof score !== 'object' || Array.isArray(score)) return scoreString ?? ''
    if (serveIndicator(scoreString) === serve) return scoreString ?? ''
    if (serve === 'second') score.serve = 'second'
    else delete score.serve
    return JSON.stringify(score)
  } catch {
    return scoreString ?? ''
  }
}

/** The set a result shows after the finished ones; `live` while it is still being played */
export interface OpenSet {
  games: [number, number]
  live: boolean
}

/**
 * The set still open in a stored score: the set in play while the match goes on, or the set an early
 * end (retirement, injury) cut short, so a result reads "4:6 2:1" and not just "4:6". The retirement
 * keeps that set's games in the stored score; a match won in full resets them to 0:0. A match
 * tiebreak shows its points, as finished ones do.
 */
export function openSet(score: Pick<Score, 'sets' | 'games'> & Partial<Pick<Score, 'isTiebreak' | 'tiebreakPoints'>>, completed: boolean): OpenSet | null {
  const [a, b] = score.games
  const started = a > 0 || b > 0
  if (!completed) return started || score.sets.length === 0 ? { games: [a, b], live: true } : null
  if (started) return { games: [a, b], live: false }
  const tb = score.tiebreakPoints
  if (score.isTiebreak && tb && (tb[0] > 0 || tb[1] > 0)) return { games: [tb[0], tb[1]], live: false }
  return null
}
