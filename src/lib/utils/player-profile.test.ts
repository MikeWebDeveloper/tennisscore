import { headToHead, playerProgress } from './player-profile'

type Side = 'p1' | 'p2'
// A game of four points to `winner`, served by `server`
const game = (set: number, n: number, server: Side, winner: Side) =>
  Array.from({ length: 4 }, () => JSON.stringify({ winner, server, setNumber: set, gameNumber: n }))

const fmt = JSON.stringify({ sets: 3, noAd: false, gamesPerSet: 6, tiebreakAt: 6, finalSetTiebreak: 'standard' })

describe('headToHead: the record of the main player against this player', () => {
  const matches = [
    { $id: 'a', matchDate: '2026-01-10', status: 'completed', playerOneId: 'me', playerTwoId: 'eva', winnerId: 'me' },
    { $id: 'b', matchDate: '2026-03-01', status: 'completed', playerOneId: 'eva', playerTwoId: 'me', winnerId: 'eva' },
    { $id: 'c', matchDate: '2026-04-01', status: 'completed', playerOneId: 'me', playerTwoId: 'eva', winnerId: 'me' },
    // Partners in doubles: not a meeting
    { $id: 'd', matchDate: '2026-05-01', status: 'completed', playerOneId: 'me', playerThreeId: 'eva', playerTwoId: 'x', playerFourId: 'y', winnerId: 'me' },
    // Still being played: listed, not counted
    { $id: 'e', matchDate: '2026-06-01', status: 'in-progress', playerOneId: 'me', playerTwoId: 'eva' },
  ]
  it('counts decided meetings and lists every meeting, newest first', () => {
    const record = headToHead(matches as never, 'eva', 'me')
    expect(record).toMatchObject({ wins: 2, losses: 1 })
    expect(record.matches.map(m => m.$id)).toEqual(['e', 'c', 'b', 'a'])
  })
})

describe('playerProgress: month by month, from what simple scoring records', () => {
  // Eva (p2) holds both her service games and breaks once: 3 games to 1 in January
  const january = { $id: 'j', matchDate: '2026-01-10T10:00:00Z', status: 'completed', matchFormat: fmt, playerOneId: 'x', playerTwoId: 'eva', winnerId: 'eva',
    pointLog: [...game(1, 1, 'p1', 'p2'), ...game(1, 2, 'p2', 'p2'), ...game(1, 3, 'p1', 'p1'), ...game(1, 4, 'p2', 'p2')] }
  // Eva (p1) loses both service games in March
  const march = { $id: 'm', matchDate: '2026-03-05T10:00:00Z', status: 'completed', matchFormat: fmt, playerOneId: 'eva', playerTwoId: 'y', winnerId: 'y',
    pointLog: [...game(1, 1, 'p1', 'p2'), ...game(1, 2, 'p2', 'p2'), ...game(1, 3, 'p1', 'p2')] }

  it('adds up service games held, breaks and points won, newest month first, with the counts behind each share', () => {
    const rows = playerProgress([january, march] as never, 'eva')
    expect(rows.map(r => r.month)).toEqual(['2026-03', '2026-01'])
    expect(rows[1]).toMatchObject({ matches: 1, wins: 1, losses: 0, serviceGames: 2, serviceGamesHeld: 2, returnGames: 2, breaks: 1, pointsWon: 12, pointsPlayed: 16 })
    expect(rows[0]).toMatchObject({ matches: 1, wins: 0, losses: 1, serviceGames: 2, serviceGamesHeld: 0, returnGames: 1, breaks: 0, pointsWon: 0, pointsPlayed: 12 })
  })

  it('skips matches without points', () => {
    expect(playerProgress([{ ...march, pointLog: [] }] as never, 'eva')).toEqual([])
  })
})
