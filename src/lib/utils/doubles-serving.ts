/**
 * Individual server in doubles, derived purely from the point log.
 *
 * Teams: "p1" = players p1 + p3, "p2" = players p2 + p4 (matches the scoreboard naming).
 * A team's partners alternate each time that team begins a service turn:
 *   - a normal game is one turn
 *   - in a tiebreak the first point is a turn, then every two points is a turn
 * The rotation continues across sets (the order may be changed between sets in the rules;
 * that can be added later by passing a different `order`). Recomputing from the log keeps
 * undo, edits and replays consistent.
 */

export type DoublesTeam = 'p1' | 'p2'
export type DoublesPlayer = 'p1' | 'p2' | 'p3' | 'p4'

export const TEAM_PARTNERS: Record<DoublesTeam, readonly [DoublesPlayer, DoublesPlayer]> = {
  p1: ['p1', 'p3'],
  p2: ['p2', 'p4'],
}

export interface DoublesServeOrder {
  /** Which partner of team p1 serves that team's first game. */
  p1: 'p1' | 'p3'
  /** Which partner of team p2 serves that team's first game. */
  p2: 'p2' | 'p4'
}

export const DEFAULT_SERVE_ORDER: DoublesServeOrder = { p1: 'p1', p2: 'p2' }

export interface ServeLogPoint {
  setNumber: number
  gameNumber: number
  /** Serving team for this point. */
  server: DoublesTeam
  isTiebreak?: boolean
}

interface ScoreLike {
  points: readonly [number, number]
  isTiebreak?: boolean
  tiebreakPoints?: readonly [number, number]
}

const playerFor = (team: DoublesTeam, turnOrdinal: number, order: DoublesServeOrder): DoublesPlayer => {
  const partners = TEAM_PARTNERS[team]
  const start = partners.indexOf(order[team] as DoublesPlayer) === 1 ? 1 : 0
  return partners[(start + turnOrdinal) % 2]
}

/** Service-turn key per logged point: one per game, or per tiebreak turn (1 point, then 2 each). */
function turnKeys(log: readonly ServeLogPoint[]): string[] {
  let tbIndex = 0
  let tbSet = -1
  return log.map((point) => {
    if (!point.isTiebreak) {
      tbSet = -1
      return `g:${point.setNumber}:${point.gameNumber}`
    }
    if (tbSet !== point.setNumber) {
      tbSet = point.setNumber
      tbIndex = 0
    }
    const turn = tbIndex === 0 ? 0 : Math.ceil(tbIndex / 2)
    tbIndex++
    return `t:${point.setNumber}:${turn}`
  })
}

/** Individual server for each logged point, in log order. */
export function getDoublesServers(
  log: readonly ServeLogPoint[],
  order: DoublesServeOrder = DEFAULT_SERVE_ORDER
): DoublesPlayer[] {
  const keys = turnKeys(log)
  const turnsByTeam: Record<DoublesTeam, number> = { p1: 0, p2: 0 }
  let current: DoublesPlayer = TEAM_PARTNERS.p1[0]
  return log.map((point, i) => {
    if (i === 0 || keys[i] !== keys[i - 1]) {
      current = playerFor(point.server, turnsByTeam[point.server]++, order)
    }
    return current
  })
}

/** True when the next point begins a new service turn (new game, or tiebreak point 1, 2, 4, 6, ...). */
export function startsNewServeTurn(score: ScoreLike): boolean {
  if (score.isTiebreak) {
    const played = (score.tiebreakPoints?.[0] ?? 0) + (score.tiebreakPoints?.[1] ?? 0)
    return played === 0 || played % 2 === 1
  }
  return score.points[0] + score.points[1] === 0
}

/**
 * Who serves the next point. `currentTeam` is the serving team from the match engine and
 * `newTurn` whether the next point begins a service turn (see `startsNewServeTurn`).
 */
export function getNextDoublesServer(
  log: readonly ServeLogPoint[],
  currentTeam: DoublesTeam,
  newTurn: boolean,
  order: DoublesServeOrder = DEFAULT_SERVE_ORDER
): DoublesPlayer {
  if (!newTurn && log.length > 0) {
    const servers = getDoublesServers(log, order)
    return servers[servers.length - 1]
  }

  // Count this team's completed turns, then take the next partner in the rotation
  const keys = turnKeys(log)
  let turns = 0
  log.forEach((point, i) => {
    if ((i === 0 || keys[i] !== keys[i - 1]) && point.server === currentTeam) turns++
  })
  return playerFor(currentTeam, turns, order)
}
