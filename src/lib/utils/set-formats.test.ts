import { getSetRules, isSetWon, shouldStartTiebreak, calculateScoreFromPointLog } from './tennis-scoring'
import { normalizeMatchFormat, getSetFormat, SET_FORMATS } from './match-format'
import { getNextDoublesServer, getDoublesServers } from './doubles-serving'
import type { MatchFormat, PointDetail } from '@/stores/matchStore'
import { matchFormatSchema } from '@/lib/schemas/match'

const base: MatchFormat = { sets: 3, noAd: false, tiebreak: true, finalSetTiebreak: 'standard' }
const fast4: MatchFormat = { ...base, noAd: true, ...SET_FORMATS.fast4 }
const pro: MatchFormat = { ...base, sets: 1, ...SET_FORMATS.pro }

type W = 'p1' | 'p2'
const log = (winners: W[]): PointDetail[] =>
  winners.map((winner, i) => ({ id: String(i), pointNumber: i + 1, winner, server: 'p1' }) as unknown as PointDetail)
const rep = (w: W, n: number): W[] => Array<W>(n).fill(w)
const game = (w: W, noAd = false): W[] => rep(w, 4) // love game works for ad and no-ad
/** n alternating games p1,p2,p1,p2... starting with p1, `games` games each */
const alternate = (each: number): W[] => Array.from({ length: each }, () => [...game('p1'), ...game('p2')]).flat()

describe('getSetRules', () => {
  it('defaults to standard sets and keeps the legacy shortSets behaviour', () => {
    expect(getSetRules(base)).toEqual({ games: 6, tiebreakAt: 6 })
    expect(getSetRules({ ...base, shortSets: true })).toEqual({ games: 4, tiebreakAt: 4 })
  })
  it('uses explicit values and defaults the tiebreak to the set length', () => {
    expect(getSetRules(fast4)).toEqual({ games: 4, tiebreakAt: 3 })
    expect(getSetRules({ ...base, gamesPerSet: 8 })).toEqual({ games: 8, tiebreakAt: 8 })
  })
})

describe('Fast4 (first to 4, tiebreak at 3-3)', () => {
  it('wins 4-0, 4-1, 4-2 without a tiebreak', () => {
    for (const lost of [0, 1, 2]) expect(isSetWon(4, lost, fast4)).toBe(true)
  })
  it('4-3 only counts as a set (it is the tiebreak result) and 3-3 starts the tiebreak', () => {
    expect(shouldStartTiebreak(3, 3, fast4)).toBe(true)
    expect(shouldStartTiebreak(4, 4, fast4)).toBe(false)
    expect(isSetWon(3, 3, fast4)).toBe(false)
    expect(isSetWon(4, 3, fast4)).toBe(true)
  })
  it('plays a tiebreak at 3-3 from the point log and records the set 4-3', () => {
    const to33 = [...game('p1'), ...game('p2'), ...game('p1'), ...game('p2'), ...game('p1'), ...game('p2')]
    const atTb = calculateScoreFromPointLog(log(to33), fast4)
    expect(atTb.games).toEqual([3, 3])
    expect(atTb.isTiebreak).toBe(true)
    const done = calculateScoreFromPointLog(log([...to33, ...rep('p2', 7)]), fast4)
    expect(done.sets).toEqual([[3, 4]])
    expect(done.isTiebreak).toBe(false)
  })
  it('wins a set 4-2 with no tiebreak', () => {
    const pts = [...game('p1'), ...game('p2'), ...game('p1'), ...game('p2'), ...game('p1'), ...game('p1')]
    expect(calculateScoreFromPointLog(log(pts), fast4).sets).toEqual([[4, 2]])
  })
  it('a best-of-3 match is over after two Fast4 sets', () => {
    const set40 = Array.from({ length: 4 }, () => game('p1')).flat()
    const s = calculateScoreFromPointLog(log([...set40, ...set40, ...game('p2')]), fast4)
    expect(s.sets).toEqual([[4, 0], [4, 0]])
    expect(s.games).toEqual([0, 0])
  })
})

describe('Pro set (first to 8, tiebreak at 8-8)', () => {
  it('needs two clear games from 8, and a tiebreak at 8-8', () => {
    expect(isSetWon(8, 6, pro)).toBe(true)
    expect(isSetWon(8, 7, pro)).toBe(false)
    expect(isSetWon(9, 7, pro)).toBe(true)
    expect(shouldStartTiebreak(8, 8, pro)).toBe(true)
    expect(shouldStartTiebreak(6, 6, pro)).toBe(false)
    expect(isSetWon(9, 8, pro)).toBe(true) // via tiebreak
  })
  it('does not start a tiebreak at 6-6 and plays one at 8-8', () => {
    expect(calculateScoreFromPointLog(log(alternate(6)), pro).isTiebreak).toBe(false)
    const at88 = calculateScoreFromPointLog(log(alternate(8)), pro)
    expect(at88.games).toEqual([8, 8])
    expect(at88.isTiebreak).toBe(true)
    const done = calculateScoreFromPointLog(log([...alternate(8), ...rep('p1', 7)]), pro)
    expect(done.sets).toEqual([[9, 8]])
  })
  it('a one-set match ends when the pro set is won', () => {
    const pts = [...alternate(5), ...Array.from({ length: 3 }, () => game('p1')).flat(), ...game('p2'), ...game('p1'), ...game('p2')]
    const s = calculateScoreFromPointLog(log(pts), pro)
    // 5-5 -> p1 wins 3 -> 8-5 is already a set (8 games, 3 clear)
    expect(s.sets).toEqual([[8, 5]])
  })
})

describe('standard sets are unchanged', () => {
  it('still tiebreaks at 6-6 and wins at 6-4', () => {
    expect(shouldStartTiebreak(6, 6, base)).toBe(true)
    expect(isSetWon(6, 4, base)).toBe(true)
    expect(isSetWon(6, 5, base)).toBe(false)
  })
})

describe('normalizeMatchFormat', () => {
  it('keeps set-length fields from a stored JSON string', () => {
    const f = normalizeMatchFormat(JSON.stringify({ sets: 3, noAd: true, gamesPerSet: 4, tiebreakAt: 3, finalSetTiebreak: 'super', finalSetTiebreakAt: 10, detailLevel: 'simple' }))
    expect(f).toMatchObject({ sets: 3, noAd: true, gamesPerSet: 4, tiebreakAt: 3, finalSetTiebreak: 'super', detailLevel: 'simple' })
  })
  it('falls back to safe defaults for broken or missing input', () => {
    for (const raw of ['not json', null, undefined, 42, '{}']) {
      const f = normalizeMatchFormat(raw as any)
      expect(f).toMatchObject({ sets: 3, noAd: false, tiebreak: true, finalSetTiebreak: 'standard', finalSetTiebreakAt: 10 })
      expect(f.gamesPerSet).toBeUndefined()
    }
  })
  it('ignores nonsense set lengths and unknown set counts', () => {
    const f = normalizeMatchFormat({ sets: 7, gamesPerSet: 0, tiebreakAt: 99 })
    expect(f.sets).toBe(3)
    expect(f.gamesPerSet).toBeUndefined()
    expect(f.tiebreakAt).toBeUndefined()
  })
  it('detects the preset from games and tiebreak point', () => {
    expect(getSetFormat({})).toBe('standard')
    expect(getSetFormat({ gamesPerSet: 6, tiebreakAt: 6 })).toBe('standard')
    expect(getSetFormat({ gamesPerSet: 4, tiebreakAt: 3 })).toBe('fast4')
    expect(getSetFormat({ gamesPerSet: 8 })).toBe('pro')
    expect(getSetFormat({ gamesPerSet: 5, tiebreakAt: 5 })).toBe('standard')
  })
})

describe('server schema keeps set length', () => {
  it.each([
    ['fast4', 4, 3],
    ['pro', 8, 8],
    ['standard', 6, 6],
  ] as const)('%s survives validation and a JSON round trip into the engine', (key, games, tiebreakAt) => {
    const parsed = matchFormatSchema.parse({ sets: 3, noAd: key === 'fast4', finalSetTiebreak: 'standard', detailLevel: 'simple', ...SET_FORMATS[key] })
    expect(parsed.gamesPerSet).toBe(games)
    expect(parsed.tiebreakAt).toBe(tiebreakAt)
    const stored = JSON.stringify(parsed)
    expect(getSetRules(normalizeMatchFormat(stored))).toEqual({ games, tiebreakAt })
  })
})

describe('doubles serve order in the stored format', () => {
  const order = { p1: 'p3', p2: 'p4' }

  it('survives the schema and a JSON round trip, and is ignored when invalid', () => {
    const parsed = matchFormatSchema.parse({ sets: 3, noAd: false, doublesServeOrder: order, ...SET_FORMATS.standard })
    expect(normalizeMatchFormat(JSON.stringify(parsed)).doublesServeOrder).toEqual(order)
    expect(normalizeMatchFormat({ doublesServeOrder: { p1: 'p2', p2: 'p4' } }).doublesServeOrder).toBeUndefined()
    expect(normalizeMatchFormat({ doublesServeOrder: 'x' }).doublesServeOrder).toBeUndefined()
    expect(matchFormatSchema.safeParse({ sets: 3, noAd: false, doublesServeOrder: { p1: 'p2', p2: 'p4' } }).success).toBe(false)
    expect(normalizeMatchFormat({}).doublesServeOrder).toBeUndefined()
  })

  it('decides who serves the very first points of each pair, then rotates', () => {
    const fmt = normalizeMatchFormat({ doublesServeOrder: order })
    expect(getNextDoublesServer([], 'p1', true, fmt.doublesServeOrder)).toBe('p3')
    const g = (set: number, game: number, server: W) => rep(server, 4).map(() => ({ setNumber: set, gameNumber: game, server }))
    const servers = getDoublesServers([...g(1, 1, 'p1'), ...g(1, 2, 'p2'), ...g(1, 3, 'p1'), ...g(1, 4, 'p2')], fmt.doublesServeOrder)
    expect([0, 4, 8, 12].map((i) => servers[i])).toEqual(['p3', 'p4', 'p1', 'p2'])
  })
})
