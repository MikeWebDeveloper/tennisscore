type Team = 'p1' | 'p2'
type DoublesPlayer = 'p1' | 'p2' | 'p3' | 'p4'

interface ServePoint {
  winner: Team
  server: Team
  serverPlayer?: DoublesPlayer
  setNumber?: number
  gameNumber?: number
  serveType?: string
  pointOutcome?: string
  isTiebreak?: boolean
  isGameWinning?: boolean
}

export interface DoublesServeRow {
  player: DoublesPlayer
  serviceGames: number
  held: number
  pointsServed: number
  pointsWon: number
  secondServes: number
  /** Only at levels that record how points end */
  aces?: number
  doubleFaults?: number
}

const ORDER: DoublesPlayer[] = ['p1', 'p3', 'p2', 'p4']

/**
 * Doubles serve statistics per player, from points that recorded who served (saved since 26 Oct 2026).
 * A service game is credited to whoever served it and counts as held when the serving team won its last point;
 * the game still being played counts only once its game point is won. Tiebreak points count as serve points
 * but not as service games.
 */
export function doublesServeStats(points: ReadonlyArray<ServePoint>, recordsOutcome: boolean): DoublesServeRow[] {
  const rows = new Map<DoublesPlayer, DoublesServeRow>()
  const lastOfGame = new Map<string, ServePoint>()
  for (const point of points) {
    if (!point.serverPlayer) continue
    const row = rows.get(point.serverPlayer) ?? {
      player: point.serverPlayer, serviceGames: 0, held: 0, pointsServed: 0, pointsWon: 0, secondServes: 0,
      ...(recordsOutcome ? { aces: 0, doubleFaults: 0 } : {}),
    }
    row.pointsServed += 1
    if (point.winner === point.server) row.pointsWon += 1
    if (point.serveType === 'second') row.secondServes += 1
    if (recordsOutcome && point.pointOutcome === 'ace') row.aces! += 1
    if (recordsOutcome && point.pointOutcome === 'double_fault') row.doubleFaults! += 1
    rows.set(point.serverPlayer, row)
    if (!point.isTiebreak) lastOfGame.set(`${point.setNumber}-${point.gameNumber}`, point)
  }
  const games = [...lastOfGame.entries()]
  for (const [index, [, last]] of games.entries()) {
    if (index === games.length - 1 && !last.isGameWinning) continue
    const row = rows.get(last.serverPlayer!)!
    row.serviceGames += 1
    if (last.winner === last.server) row.held += 1
  }
  return ORDER.filter((player) => rows.has(player)).map((player) => rows.get(player)!)
}
