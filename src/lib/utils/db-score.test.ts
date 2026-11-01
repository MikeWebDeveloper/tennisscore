import { parseDbScore } from './db-score'

const empty = { sets: [], games: [0, 0], points: [0, 0], isTiebreak: false, tiebreakPoints: [0, 0] }

describe('parseDbScore', () => {
  it('parses the modern array format', () => {
    const s = parseDbScore(JSON.stringify({ sets: [[6, 4], [3, 6]], games: [2, 1], points: [1, 3], isTiebreak: false, tiebreakPoints: [0, 0] }))
    expect(s).toEqual({ sets: [[6, 4], [3, 6]], games: [2, 1], points: [1, 3], isTiebreak: false, tiebreakPoints: [0, 0] })
  })

  it('parses the legacy {player1, player2} object format with string points', () => {
    const s = parseDbScore(JSON.stringify({
      sets: [{ player1: 6, player2: 4 }],
      games: [{ player1: 0, player2: 0 }, { player1: 3, player2: 2 }],
      points: { player1: '2', player2: '3' },
      isTiebreak: false,
    }))
    expect(s.sets).toEqual([[6, 4]])
    expect(s.games).toEqual([3, 2])
    expect(s.points).toEqual([2, 3])
  })

  it('parses tiebreak state in both formats', () => {
    expect(parseDbScore(JSON.stringify({ games: [6, 6], isTiebreak: true, tiebreakPoints: [4, 5] }))).toMatchObject({ isTiebreak: true, tiebreakPoints: [4, 5] })
    expect(parseDbScore(JSON.stringify({ isTiebreak: true, tiebreakPoints: { player1: 2, player2: 1 } })).tiebreakPoints).toEqual([2, 1])
  })

  it('never throws: bad or missing input gives an empty score', () => {
    for (const raw of [undefined, '', 'not json', 'null', '42']) expect(parseDbScore(raw as any)).toEqual(empty)
  })
})

describe('serve indicator in the stored score', () => {
  it('reads a second serve and treats anything else as the first', async () => {
    const { serveIndicator } = await import('./db-score')
    expect(serveIndicator('{"points":[1,0],"serve":"second"}')).toBe('second')
    expect(serveIndicator('{"points":[1,0]}')).toBe('first')
    expect(serveIndicator('not json')).toBe('first')
    expect(serveIndicator(undefined)).toBe('first')
  })

  it('sets and clears the serve without touching the rest of the score', async () => {
    const { withServeIndicator, parseDbScore } = await import('./db-score')
    const stored = '{"sets":[[6,4]],"games":[2,1],"points":[1,2]}'
    const second = withServeIndicator(stored, 'second')
    expect(JSON.parse(second)).toEqual({ sets: [[6, 4]], games: [2, 1], points: [1, 2], serve: 'second' })
    expect(withServeIndicator(second, 'second')).toBe(second)
    expect(JSON.parse(withServeIndicator(second, 'first'))).toEqual(JSON.parse(stored))
    // The scoring store never sees it, so a later point cannot write a stale second serve back
    expect(parseDbScore(second)).not.toHaveProperty('serve')
  })
})

describe('openSet: the set a result shows after the finished ones', () => {
  const score = (sets: [number, number][], games: [number, number], extra: object = {}) => ({ sets, games, points: [0, 0] as [number, number], isTiebreak: false, tiebreakPoints: [0, 0] as [number, number], ...extra })

  it('shows the set a retirement cut short, from the games the stored score kept', async () => {
    const { openSet } = await import('./db-score')
    expect(openSet(score([[4, 6]], [2, 1]), true)).toEqual({ games: [2, 1], live: false })
  })

  it('shows nothing extra for a match won in full or ended before the next set began', async () => {
    const { openSet } = await import('./db-score')
    expect(openSet(score([[6, 4], [6, 3]], [0, 0]), true)).toBeNull()
    expect(openSet(score([[6, 4]], [0, 0], { points: [2, 1] }), true)).toBeNull()
    // Old retirements stored only a "1:0" set
    expect(openSet(score([[1, 0]], [0, 0]), true)).toBeNull()
  })

  it('shows the match tiebreak a retirement cut short by its points', async () => {
    const { openSet } = await import('./db-score')
    expect(openSet(score([[6, 4], [3, 6]], [0, 0], { isTiebreak: true, tiebreakPoints: [5, 3] }), true)).toEqual({ games: [5, 3], live: false })
  })

  it('keeps the set in play live while the match goes on', async () => {
    const { openSet } = await import('./db-score')
    expect(openSet(score([[6, 4]], [2, 1]), false)).toEqual({ games: [2, 1], live: true })
    expect(openSet(score([], [0, 0]), false)).toEqual({ games: [0, 0], live: true })
    expect(openSet(score([[6, 4]], [0, 0]), false)).toBeNull()
  })
})
