import { doublesServeStats } from './doubles-serve-stats'

type Team = 'p1' | 'p2'
type Player = 'p1' | 'p2' | 'p3' | 'p4'
const point = (game: number, server: Team, serverPlayer: Player | undefined, winner: Team, extra: object = {}) =>
  ({ setNumber: 1, gameNumber: game, server, serverPlayer, winner, serveType: 'first', ...extra })

// Order: p1, p2, p3, p4. p1 holds to love, p2 is broken, p3 holds after an ace and a double fault, p4 holds
const points = [
  ...Array.from({ length: 4 }, () => point(1, 'p1', 'p1', 'p1')),
  ...Array.from({ length: 4 }, () => point(2, 'p2', 'p2', 'p1')),
  point(3, 'p1', 'p3', 'p1', { pointOutcome: 'ace' }), point(3, 'p1', 'p3', 'p2', { pointOutcome: 'double_fault', serveType: 'second' }),
  point(3, 'p1', 'p3', 'p1'), point(3, 'p1', 'p3', 'p1'), point(3, 'p1', 'p3', 'p1'),
  ...Array.from({ length: 4 }, () => point(4, 'p2', 'p4', 'p2')),
]

it('credits each service game and serve point to the partner who served it', () => {
  const rows = doublesServeStats(points as never, true)
  expect(rows.map(r => r.player)).toEqual(['p1', 'p3', 'p2', 'p4'])
  expect(rows.find(r => r.player === 'p1')).toMatchObject({ serviceGames: 1, held: 1, pointsServed: 4, pointsWon: 4 })
  expect(rows.find(r => r.player === 'p2')).toMatchObject({ serviceGames: 1, held: 0, pointsServed: 4, pointsWon: 0 })
  expect(rows.find(r => r.player === 'p3')).toMatchObject({ serviceGames: 1, held: 1, pointsServed: 5, pointsWon: 4, aces: 1, doubleFaults: 1, secondServes: 1 })
})

it('leaves out aces and double faults when the level does not record how points end', () => {
  const p3 = doublesServeStats(points as never, false).find(r => r.player === 'p3')!
  expect(p3.aces).toBeUndefined()
  expect(p3.doubleFaults).toBeUndefined()
})

it('returns nothing for matches scored before the server was recorded', () => {
  expect(doublesServeStats(points.map(p => ({ ...p, serverPlayer: undefined })) as never, true)).toEqual([])
})

it('does not count the game still being played as a service game', () => {
  const ongoing = [...points, point(5, 'p1', 'p1', 'p2'), point(5, 'p1', 'p1', 'p1')]
  expect(doublesServeStats(ongoing as never, true).find(r => r.player === 'p1')).toMatchObject({ serviceGames: 1, held: 1, pointsServed: 6 })
  // Its game point won it: now it counts
  const won = [...ongoing, point(5, 'p1', 'p1', 'p1'), point(5, 'p1', 'p1', 'p1', { isGameWinning: true })]
  expect(doublesServeStats(won as never, true).find(r => r.player === 'p1')).toMatchObject({ serviceGames: 2, held: 2 })
})
