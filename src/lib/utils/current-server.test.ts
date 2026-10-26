import { deriveCurrentServer } from './current-server'

const score = (over: Partial<any> = {}) => ({ sets: [], games: [0, 0], points: [0, 0], isTiebreak: false, tiebreakPoints: [0, 0], ...over }) as any
const log = (first: 'p1' | 'p2') => [{ server: first }]

describe('deriveCurrentServer', () => {
  it('is undefined before the first point or without a score', () => {
    expect(deriveCurrentServer([], score())).toBeUndefined()
    expect(deriveCurrentServer(log('p1'), undefined)).toBeUndefined()
  })

  it('alternates every game, counting games from completed sets too', () => {
    expect(deriveCurrentServer(log('p1'), score({ games: [0, 0] }))).toBe('p1')
    expect(deriveCurrentServer(log('p1'), score({ games: [1, 0] }))).toBe('p2')
    expect(deriveCurrentServer(log('p1'), score({ games: [1, 1] }))).toBe('p1')
    // 6-4 set = 10 games (even) + 1 game in the next set => odd => the other player
    expect(deriveCurrentServer(log('p1'), score({ sets: [[6, 4]], games: [1, 0] }))).toBe('p2')
    expect(deriveCurrentServer(log('p2'), score({ games: [0, 0] }))).toBe('p2')
  })

  it('follows 1-2-2-2 inside a tiebreak starting with the normal server', () => {
    // 6-6: 12 games => p1 (first server) starts the tiebreak
    const seq = [0, 1, 2, 3, 4, 5, 6].map((n) =>
      deriveCurrentServer(log('p1'), score({ games: [6, 6], isTiebreak: true, tiebreakPoints: [n, 0] }))
    )
    expect(seq).toEqual(['p1', 'p2', 'p2', 'p1', 'p1', 'p2', 'p2'])
  })
})
