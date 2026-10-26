import { getTiebreakServer } from './tennis-scoring'
import type { Score } from '@/stores/matchStore'

/**
 * Which side serves the next point, derived from the point log and score:
 * the first point's server alternates each game, and a tiebreak follows the 1-2-2-2 pattern.
 */
export function deriveCurrentServer(
  pointLog: ReadonlyArray<{ server: 'p1' | 'p2' }>,
  score: Score | undefined
): 'p1' | 'p2' | undefined {
  if (pointLog.length === 0 || !score) return undefined

  const totalGames =
    score.sets.reduce((sum, set) => sum + (set[0] || 0) + (set[1] || 0), 0) +
    (score.games[0] || 0) +
    (score.games[1] || 0)
  const firstServer = pointLog[0]?.server || 'p1'
  const otherServer = firstServer === 'p1' ? 'p2' : 'p1'
  const gameServer = totalGames % 2 === 0 ? firstServer : otherServer

  if (score.isTiebreak) {
    const totalTiebreakPoints = (score.tiebreakPoints?.[0] || 0) + (score.tiebreakPoints?.[1] || 0)
    // The tiebreak starts with the player who would normally serve this game
    return getTiebreakServer(totalTiebreakPoints, gameServer)
  }
  return gameServer
}
