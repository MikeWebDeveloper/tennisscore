/**
 * Individual server in doubles, derived purely from the point log.
 *
 * Teams: "p1" = players p1 + p3, "p2" = players p2 + p4 (matches the scoreboard naming).
 * A team's partners alternate each time that team begins a service turn:
 *   - a normal game is one turn
 *   - in a tiebreak the first point is a turn, then every two points is a turn
 * The rotation continues across sets. When a logged point records who actually served
 * (`serverPlayer`), that is authoritative and the rotation continues from it, so a scorer can
 * correct the server or change the order between sets. Points without it fall back to the
 * derived rotation (older matches). Recomputing from the log keeps undo and replays consistent.
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
  /** The individual who actually served, when recorded. */
  serverPlayer?: DoublesPlayer
}

interface ScoreLike {
  points: readonly [number, number]
  isTiebreak?: boolean
  tiebreakPoints?: readonly [number, number]
}

const otherPartner = (player: DoublesPlayer, team: DoublesTeam): DoublesPlayer => {
  const [a, b] = TEAM_PARTNERS[team]
  return player === a ? b : a
}

/** Next partner in a team's rotation: the other one than last time, or the configured first server. */
const nextForTeam = (team: DoublesTeam, last: DoublesPlayer | null, order: DoublesServeOrder): DoublesPlayer =>
  last ? otherPartner(last, team) : (order[team] as DoublesPlayer)

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

/** Walks the log and resolves the individual server of every point. */
function resolve(log: readonly ServeLogPoint[], order: DoublesServeOrder) {
  const keys = turnKeys(log)
  const lastByTeam: Record<DoublesTeam, DoublesPlayer | null> = { p1: null, p2: null }
  const servers: DoublesPlayer[] = []
  let current: DoublesPlayer = TEAM_PARTNERS.p1[0]

  log.forEach((point, i) => {
    const newTurn = i === 0 || keys[i] !== keys[i - 1]
    if (point.serverPlayer) {
      current = point.serverPlayer
      if (newTurn) lastByTeam[point.server] = current
    } else if (newTurn) {
      current = nextForTeam(point.server, lastByTeam[point.server], order)
      lastByTeam[point.server] = current
    }
    servers.push(current)
  })
  return { servers, lastByTeam }
}

/** Individual server for each logged point, in log order. */
export function getDoublesServers(
  log: readonly ServeLogPoint[],
  order: DoublesServeOrder = DEFAULT_SERVE_ORDER
): DoublesPlayer[] {
  return resolve(log, order).servers
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
  const { servers, lastByTeam } = resolve(log, order)
  if (!newTurn && servers.length > 0) return servers[servers.length - 1]
  return nextForTeam(currentTeam, lastByTeam[currentTeam], order)
}
