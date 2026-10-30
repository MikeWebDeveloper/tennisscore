import { buildMatchInsights, percent, type InsightPoint, type Side } from './match-insights'

const START = Date.parse('2026-10-25T08:00:00Z')

/**
 * Builds a point log game by game. Each game is the server plus who won each point in order:
 * "s" = server, "r" = receiver. Points are 30 s apart unless a gap is given.
 */
function log(games: Array<{ set: number; game: number; server: Side; seq: string; tiebreak?: boolean; extra?: Partial<InsightPoint>[] }>, gapSec = 30) {
  const points: InsightPoint[] = []
  for (const g of games) {
    const receiver: Side = g.server === 'p1' ? 'p2' : 'p1'
    g.seq.split('').forEach((c, i) => {
      points.push({
        winner: c === 's' ? g.server : receiver,
        server: g.server,
        serveType: 'first',
        pointOutcome: 'winner',
        setNumber: g.set,
        gameNumber: g.game,
        isTiebreak: g.tiebreak,
        timestamp: new Date(START + points.length * gapSec * 1000).toISOString(),
        ...(g.extra?.[i] ?? {}),
      })
    })
  }
  return points
}

const STANDARD = { sets: 3, gamesPerSet: 6, tiebreakAt: 6, finalSetTiebreak: 'super' as const, noAd: false }

/** A 6:0 set where p1 serves the odd games: every game won by p1 to love */
function bagelSet(set: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const server: Side = i % 2 === 0 ? 'p1' : 'p2'
    return { set, game: i + 1, server, seq: server === 'p1' ? 'ssss' : 'rrrr' }
  })
}

describe('buildMatchInsights', () => {
  it('counts holds, breaks and break points per player', () => {
    const insights = buildMatchInsights(log([
      { set: 1, game: 1, server: 'p1', seq: 'ssss' },
      // p2 serves: 15:40, saves one break point, then loses the second
      { set: 1, game: 2, server: 'p2', seq: 'srrrsr' },
    ]), { format: STANDARD })

    expect(insights.games.map((g) => [g.winner, g.isBreak])).toEqual([['p1', false], ['p1', true]])
    expect(insights.totals.p1).toMatchObject({ serviceGames: 1, serviceGamesHeld: 1, breaks: 1, breakPointChances: 2, breakPointsWon: 1 })
    expect(insights.totals.p2).toMatchObject({ serviceGames: 1, serviceGamesHeld: 0, breakPointsFaced: 2, breakPointsSaved: 1 })
    expect(insights.breakMarks).toEqual([{ at: 10, side: 'p1' }])
  })

  it('names a hold from 0:40 with every break point saved', () => {
    // 0:40, 40:40, advantage receiver, deuce, advantage server, game
    const insights = buildMatchInsights(log([{ set: 1, game: 1, server: 'p1', seq: 'rrrsssrsss' }]), { format: STANDARD })
    const [game] = insights.games

    expect(game).toMatchObject({ winner: 'p1', comebackFrom: '0:40', breakPointsFaced: 4, breakPointsSaved: 4, deuce: true })
    expect(insights.moments).toContainEqual(expect.objectContaining({ kind: 'comeback', role: 'hold', from: '0:40', savedBreakPoints: 4 }))
  })

  it('treats the no-ad deciding point as a break point and a deuce', () => {
    const insights = buildMatchInsights(log([{ set: 1, game: 1, server: 'p1', seq: 'sssrrrr' }]), { format: { ...STANDARD, noAd: true } })
    const [game] = insights.games

    expect(game).toMatchObject({ winner: 'p2', isBreak: true, deuce: true, breakPointsFaced: 1, breakPointsSaved: 0 })
  })

  it('gives a 6:6 tiebreak to the set without counting it as a service game', () => {
    const games = []
    for (let i = 1; i <= 12; i++) games.push({ set: 1, game: i, server: (i % 2 ? 'p1' : 'p2') as Side, seq: 'ssss' })
    games.push({ set: 1, game: 13, server: 'p1' as Side, seq: 'srrssrssss', tiebreak: true }) // 7:3 for p1
    const insights = buildMatchInsights(log(games), { format: STANDARD })
    const [set] = insights.sets

    expect(set).toMatchObject({ games: [7, 6], winner: 'p1', superTiebreak: false })
    expect(set.tiebreakPoints?.[0]).toBeGreaterThanOrEqual(7)
    expect(insights.totals.p1.serviceGames + insights.totals.p2.serviceGames).toBe(12)
    expect(insights.totals.p1.tiebreaksWon).toBe(1)
    expect(insights.moments).toContainEqual(expect.objectContaining({ kind: 'tiebreak', side: 'p1', set: 1 }))
  })

  it('plays a deciding super tiebreak to ten and finishes the match', () => {
    const p2Set = bagelSet(2).map((g) => ({ ...g, seq: g.seq.replace(/s/g, 'x').replace(/r/g, 's').replace(/x/g, 'r') }))
    // 10:8 for p1 in the match tiebreak
    const tb = { set: 3, game: 1, server: 'p1' as Side, seq: 'srsrsrsrsrsrsrsrss', tiebreak: true }
    const insights = buildMatchInsights(log([...bagelSet(1), ...p2Set, tb]), { format: STANDARD })
    const decider = insights.sets[2]

    expect(insights.sets.map((s) => s.winner)).toEqual(['p1', 'p2', 'p1'])
    expect(decider).toMatchObject({ superTiebreak: true, tiebreakPoints: [10, 8] })
    expect(insights.complete).toBe(true)
    expect(insights.setsWon).toEqual([2, 1])
    expect(insights.headline[0]).toEqual({ kind: 'decidedInTiebreak', superTiebreak: true })
  })

  it('leaves a game in progress open and leads by games while the match goes on', () => {
    const insights = buildMatchInsights(log([
      { set: 1, game: 1, server: 'p1', seq: 'ssss' },
      { set: 1, game: 2, server: 'p2', seq: 'rr' },
    ]), { format: STANDARD })

    expect(insights.games[1].winner).toBeNull()
    expect(insights.sets[0]).toMatchObject({ games: [1, 0], winner: null })
    expect(insights.complete).toBe(false)
    expect(insights.leader).toBe('p1')
    expect(insights.currentRun).toEqual({ side: 'p1', length: 6 })
  })

  it('splits serve points into first and second serve and credits outcomes to the right player', () => {
    const insights = buildMatchInsights(log([{
      set: 1, game: 1, server: 'p1', seq: 'srsrss',
      extra: [
        { pointOutcome: 'ace' },
        { serveType: 'second', pointOutcome: 'double_fault' },
        { serveType: 'second', pointOutcome: 'winner' },
        { pointOutcome: 'unforced_error' },
        { pointOutcome: 'forced_error' },
        { pointOutcome: 'winner' },
      ],
    }]), { format: STANDARD })
    const { p1, p2 } = insights.totals

    // Errors count against the player who lost the point: p1's unforced error, p2's forced error
    expect(p1).toMatchObject({ servePoints: 6, firstServes: 4, firstServePointsWon: 3, secondServes: 2, secondServePointsWon: 1, aces: 1, doubleFaults: 1, winners: 2, unforcedErrors: 1 })
    expect(p2).toMatchObject({ returnPoints: 6, returnPointsWon: 2, unforcedErrors: 0, forcedErrors: 1 })
  })

  it('draws the lead line and marks where sets end', () => {
    const insights = buildMatchInsights(log([...bagelSet(1), ...bagelSet(2)]), { format: STANDARD })

    expect(insights.worm).toHaveLength(49)
    expect(insights.worm[48]).toBe(48)
    expect(insights.setEnds).toEqual([24, 48])
    expect(insights.headline.map((f) => f.kind)).toEqual(['noServeLost', 'gameRun'])
    expect(insights.moments.filter((m) => m.kind === 'bagel')).toHaveLength(2)
  })

  it('keeps totals per set apart', () => {
    const insights = buildMatchInsights(log([...bagelSet(1), { set: 2, game: 1, server: 'p1', seq: 'rrrr' }]), { format: STANDARD })

    expect(insights.totalsBySet[1].p1.points).toBe(24)
    expect(insights.totalsBySet[2].p2).toMatchObject({ points: 4, breaks: 1 })
  })

  it('finds the typical gap between points and ignores long pauses', () => {
    const points = log([{ set: 1, game: 1, server: 'p1', seq: 'ssss' }, { set: 1, game: 2, server: 'p2', seq: 'ssss' }], 40)
    // A rain break of an hour before the last point
    points[7].timestamp = new Date(Date.parse(points[6].timestamp!) + 3600_000).toISOString()
    const insights = buildMatchInsights(points, { format: STANDARD })

    expect(insights.medianSecondsBetweenPoints).toBe(40)
    expect(insights.games[0].durationSec).toBe(120)
  })

  it('flags points-level matches as having no serve detail', () => {
    expect(buildMatchInsights(log([{ set: 1, game: 1, server: 'p1', seq: 'ssss' }]), { detailLevel: 'points' }).hasServeDetail).toBe(false)
    expect(buildMatchInsights([], {}).hasPoints).toBe(false)
  })
})

describe('percent', () => {
  it('rounds to whole numbers and has nothing to show without a base', () => {
    expect(percent(22, 31)).toBe(71)
    expect(percent(1, 0)).toBeNull()
  })
})
