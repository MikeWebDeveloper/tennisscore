import { formatMatchDuration, summarizeWonShares, remainingForScores, MIN_MATCHES_FOR_SCORES } from './statistics-summary'

const point = (winner: 'p1' | 'p2') => JSON.stringify({ winner, server: 'p1', setNumber: 1, gameNumber: 1 })

describe('formatMatchDuration', () => {
  it('shows seconds for matches shorter than a minute instead of "0.36 min"', () => {
    expect(formatMatchDuration(0.36, 'en')).toBe('22 sec')
    expect(formatMatchDuration(0.36, 'cs')).toBe('22 s')
  })

  it('shows minutes, then hours and minutes, in the page language', () => {
    expect(formatMatchDuration(45.2, 'en')).toBe('45 min')
    expect(formatMatchDuration(65, 'en')).toBe('1 hr 5 min')
    expect(formatMatchDuration(65, 'cs')).toBe('1 h 5 min')
    expect(formatMatchDuration(120, 'cs')).toBe('2 h')
  })

  it('returns an empty string when there is no duration to show', () => {
    expect(formatMatchDuration(0, 'en')).toBe('')
    expect(formatMatchDuration(Number.NaN, 'en')).toBe('')
  })
})

describe('summarizeWonShares', () => {
  it('counts games and sets from set scores, from the main player side', () => {
    // Main player is player two here: won 4-6 and 3-6 from the main player's view => 12 of 19 games, 2 of 2 sets
    const shares = summarizeWonShares([
      { status: 'completed', playerOneId: 'opp', playerTwoId: 'me', score: '{"sets":[[4,6],[3,6]]}', pointLog: [] },
    ], 'me')
    expect(shares.games).toEqual({ won: 12, total: 19 })
    expect(shares.sets).toEqual({ won: 2, total: 2 })
  })

  it('counts doubles partners as the same side', () => {
    const shares = summarizeWonShares([
      { status: 'completed', playerOneId: 'a', playerThreeId: 'me', playerTwoId: 'b', playerFourId: 'c', score: '{"sets":[[6,2]]}', pointLog: [] },
    ], 'me')
    expect(shares.sets).toEqual({ won: 1, total: 1 })
  })

  it('counts points only from matches with a point log, and ignores unfinished matches', () => {
    const shares = summarizeWonShares([
      { status: 'completed', playerOneId: 'me', playerTwoId: 'opp', score: '{"sets":[[6,0]]}', pointLog: [point('p1'), point('p1'), point('p2')] },
      { status: 'in-progress', playerOneId: 'me', playerTwoId: 'opp', score: '{"sets":[[0,6]]}', pointLog: [point('p2')] },
    ], 'me')
    expect(shares.points).toEqual({ won: 2, total: 3 })
    expect(shares.sets).toEqual({ won: 1, total: 1 })
  })
})

describe('remainingForScores', () => {
  it('asks for more completed matches before derived scores are shown', () => {
    expect(remainingForScores(1)).toBe(MIN_MATCHES_FOR_SCORES - 1)
    expect(remainingForScores(MIN_MATCHES_FOR_SCORES)).toBe(0)
    expect(remainingForScores(40)).toBe(0)
  })
})
