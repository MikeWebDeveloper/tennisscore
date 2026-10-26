import {
  convertPointsToGameScore,
  isGameWon,
  getGameWinner,
  getServer,
  getTiebreakServer,
  isTiebreakWon,
  isSetWon,
  isMatchWon,
  shouldStartTiebreak,
  shouldBeInSuperTiebreak,
  calculateScoreFromPointLog,
} from './tennis-scoring'
import type { MatchFormat, PointDetail } from '@/stores/matchStore'

const bestOf3: MatchFormat = { sets: 3, noAd: false, tiebreak: true, finalSetTiebreak: 'standard' }
const noAd: MatchFormat = { ...bestOf3, noAd: true }
const superTb: MatchFormat = { ...bestOf3, finalSetTiebreak: 'super', finalSetTiebreakAt: 10 }
const advantageFinal: MatchFormat = { ...bestOf3, finalSetTiebreak: 'none' }
const bestOf5: MatchFormat = { ...bestOf3, sets: 5 }
const oneSet: MatchFormat = { ...bestOf3, sets: 1 }

type W = 'p1' | 'p2'

/** Build a point log from a list of winners. Server is irrelevant to the score state. */
const log = (winners: W[]): PointDetail[] =>
  winners.map((winner, i) => ({ id: String(i), pointNumber: i + 1, winner, server: 'p1' }) as unknown as PointDetail)

const rep = (w: W, n: number): W[] => Array<W>(n).fill(w)
/** A love game for the given player. */
const game = (w: W): W[] => rep(w, 4)
/** A whole set 6-0 for the given player. */
const set60 = (w: W): W[] => Array.from({ length: 6 }, () => game(w)).flat()
/** Alternate games to reach 6-6 (p1 holds, p2 holds). */
const to66 = (): W[] => Array.from({ length: 6 }, () => [...game('p1'), ...game('p2')]).flat()

describe('convertPointsToGameScore', () => {
  it('maps standard scoring', () => {
    expect(convertPointsToGameScore(0, 0)).toBe('0-0')
    expect(convertPointsToGameScore(1, 0)).toBe('15-0')
    expect(convertPointsToGameScore(2, 3)).toBe('30-40')
    expect(convertPointsToGameScore(3, 3)).toBe('Deuce')
    expect(convertPointsToGameScore(5, 5)).toBe('Deuce')
    expect(convertPointsToGameScore(4, 3)).toBe('Ad-40')
    expect(convertPointsToGameScore(3, 4)).toBe('40-Ad')
  })
  it('maps no-ad scoring (3+ means sudden death)', () => {
    expect(convertPointsToGameScore(3, 3, true)).toBe('3+-3+')
  })
})

describe('game and tiebreak winners', () => {
  it('requires a two-point margin in standard games', () => {
    expect(isGameWon(4, 0)).toBe(true)
    expect(isGameWon(4, 3)).toBe(false)
    expect(isGameWon(5, 3)).toBe(true)
    expect(isGameWon(6, 6)).toBe(false)
    expect(getGameWinner(7, 5)).toBe('p1')
    expect(getGameWinner(3, 5)).toBe('p2')
    expect(getGameWinner(3, 3)).toBeNull()
  })
  it('wins no-ad games on the first point after 3-3', () => {
    expect(isGameWon(4, 3, true)).toBe(true)
    expect(isGameWon(3, 4, true)).toBe(true)
    expect(isGameWon(3, 3, true)).toBe(false)
  })
  it('requires target and a two-point margin in tiebreaks', () => {
    expect(isTiebreakWon(7, 5)).toBe(true)
    expect(isTiebreakWon(7, 6)).toBe(false)
    expect(isTiebreakWon(8, 6)).toBe(true)
    expect(isTiebreakWon(10, 9, 10)).toBe(false)
    expect(isTiebreakWon(10, 8, 10)).toBe(true)
    expect(isTiebreakWon(6, 0)).toBe(false)
  })
})

describe('serving order', () => {
  it('alternates by game', () => {
    expect([1, 2, 3, 4].map(getServer)).toEqual(['p1', 'p2', 'p1', 'p2'])
  })
  it('alternates every two points in a tiebreak after the first', () => {
    const seq = Array.from({ length: 8 }, (_, i) => getTiebreakServer(i, 'p1'))
    expect(seq).toEqual(['p1', 'p2', 'p2', 'p1', 'p1', 'p2', 'p2', 'p1'])
  })
})

describe('sets and matches', () => {
  it('detects won sets', () => {
    expect(isSetWon(6, 4, bestOf3)).toBe(true)
    expect(isSetWon(6, 5, bestOf3)).toBe(false)
    expect(isSetWon(7, 5, bestOf3)).toBe(true)
    expect(isSetWon(7, 6, bestOf3)).toBe(true) // won via tiebreak
    expect(isSetWon(6, 6, bestOf3)).toBe(false)
  })
  it('supports short sets (first to 4)', () => {
    const short = { ...bestOf3, shortSets: true }
    expect(isSetWon(4, 2, short)).toBe(true)
    expect(isSetWon(4, 3, short)).toBe(false)
    expect(isSetWon(5, 4, short)).toBe(true)
    expect(shouldStartTiebreak(4, 4, short)).toBe(true)
  })
  it('starts a tiebreak at 6-6 only when enabled', () => {
    expect(shouldStartTiebreak(6, 6, bestOf3)).toBe(true)
    expect(shouldStartTiebreak(5, 5, bestOf3)).toBe(false)
    expect(shouldStartTiebreak(6, 6, { ...bestOf3, tiebreak: false, finalSetTiebreak: 'none' })).toBe(false)
  })
  it('detects match winners for 1, 3 and 5 sets', () => {
    expect(isMatchWon([[6, 4]], oneSet)).toEqual({ won: true, winner: 'p1' })
    expect(isMatchWon([[6, 4], [3, 6]], bestOf3)).toEqual({ won: false, winner: null })
    expect(isMatchWon([[6, 4], [3, 6], [2, 6]], bestOf3)).toEqual({ won: true, winner: 'p2' })
    expect(isMatchWon([[6, 0], [6, 0]], bestOf5)).toEqual({ won: false, winner: null })
    expect(isMatchWon([[6, 0], [6, 0], [6, 0]], bestOf5)).toEqual({ won: true, winner: 'p1' })
  })
  it('knows when the deciding set is a super tiebreak', () => {
    expect(shouldBeInSuperTiebreak([[6, 4], [4, 6]], superTb)).toBe(true)
    expect(shouldBeInSuperTiebreak([[6, 4]], superTb)).toBe(false)
    expect(shouldBeInSuperTiebreak([[6, 4], [4, 6]], bestOf3)).toBe(false)
  })
})

describe('calculateScoreFromPointLog (source of truth)', () => {
  it('starts at zero', () => {
    const s = calculateScoreFromPointLog([], bestOf3)
    expect(s.sets).toEqual([])
    expect(s.games).toEqual([0, 0])
    expect(s.points).toEqual([0, 0])
    expect(s.isTiebreak).toBe(false)
  })

  it('tracks points, deuce and games', () => {
    expect(calculateScoreFromPointLog(log(['p1', 'p1', 'p2']), bestOf3).points).toEqual([2, 1])
    // deuce then advantage then game: 3-3, 4-3, 5-3
    const deuce = [...rep('p1', 3), ...rep('p2', 3), 'p1' as W, 'p1' as W]
    const s = calculateScoreFromPointLog(log(deuce), bestOf3)
    expect(s.games).toEqual([1, 0])
    expect(s.points).toEqual([0, 0])
    const adv = calculateScoreFromPointLog(log([...rep('p1', 3), ...rep('p2', 3), 'p1']), bestOf3)
    expect(adv.games).toEqual([0, 0])
    expect(adv.points).toEqual([4, 3])
  })

  it('ends a no-ad game on the deciding point', () => {
    const pts = [...rep('p1', 3), ...rep('p2', 3), 'p2' as W]
    expect(calculateScoreFromPointLog(log(pts), noAd).games).toEqual([0, 1])
  })

  it('completes a set 6-0 and rolls into the next', () => {
    const s = calculateScoreFromPointLog(log([...set60('p1'), ...game('p2')]), bestOf3)
    expect(s.sets).toEqual([[6, 0]])
    expect(s.games).toEqual([0, 1])
  })

  it('wins a set 7-5 without a tiebreak', () => {
    const pts: W[] = []
    for (let i = 0; i < 5; i++) pts.push(...game('p1'), ...game('p2')) // 5-5
    pts.push(...game('p1'), ...game('p1')) // 7-5
    expect(calculateScoreFromPointLog(log(pts), bestOf3).sets).toEqual([[7, 5]])
  })

  it('plays a tiebreak at 6-6 and records 7-6', () => {
    const afterSix = calculateScoreFromPointLog(log(to66()), bestOf3)
    expect(afterSix.isTiebreak).toBe(true)
    expect(afterSix.games).toEqual([6, 6])
    const won = calculateScoreFromPointLog(log([...to66(), ...rep('p1', 7)]), bestOf3)
    expect(won.sets).toEqual([[7, 6]])
    expect(won.isTiebreak).toBe(false)
  })

  it('needs a two-point margin in a tiebreak', () => {
    const pts = [...to66(), ...rep('p1', 6), ...rep('p2', 6), 'p1' as W]
    const s = calculateScoreFromPointLog(log(pts), bestOf3)
    expect(s.isTiebreak).toBe(true)
    expect(s.tiebreakPoints).toEqual([7, 6])
    const done = calculateScoreFromPointLog(log([...pts, 'p1' as W]), bestOf3)
    expect(done.sets).toEqual([[7, 6]])
  })

  it('wins a best-of-3 match in straight sets and ignores later points', () => {
    const s = calculateScoreFromPointLog(log([...set60('p1'), ...set60('p1'), ...game('p2')]), bestOf3)
    expect(s.sets).toEqual([[6, 0], [6, 0]])
    expect(s.games).toEqual([0, 0])
    expect(s.points).toEqual([0, 0])
  })

  it('plays a deciding set as a 10-point super tiebreak', () => {
    const pts = [...set60('p1'), ...set60('p2')]
    const mid = calculateScoreFromPointLog(log([...pts, ...rep('p1', 9), ...rep('p2', 9)]), superTb)
    expect(mid.isTiebreak).toBe(true)
    expect(mid.tiebreakPoints).toEqual([9, 9])
    const done = calculateScoreFromPointLog(log([...pts, ...rep('p2', 10)]), superTb)
    expect(done.sets).toEqual([[6, 0], [0, 6], [0, 10]])
    expect(isMatchWon(done.sets, superTb)).toEqual({ won: true, winner: 'p2' })
  })

  it('needs two clear games in an advantage final set (no tiebreak)', () => {
    const pts = [...set60('p1'), ...set60('p2')]
    // final set to 6-6 then p1 wins one game: 7-6 must NOT end the set
    const s = calculateScoreFromPointLog(log([...pts, ...to66(), ...game('p1')]), advantageFinal)
    expect(s.isTiebreak).toBe(false)
    expect(s.sets).toEqual([[6, 0], [0, 6]])
    expect(s.games).toEqual([7, 6])
    const won = calculateScoreFromPointLog(log([...pts, ...to66(), ...game('p1'), ...game('p1')]), advantageFinal)
    expect(won.sets).toEqual([[6, 0], [0, 6], [8, 6]])
  })

  it('plays a standard tiebreak in a final set when configured', () => {
    const pts = [...set60('p1'), ...set60('p2'), ...to66()]
    expect(calculateScoreFromPointLog(log(pts), bestOf3).isTiebreak).toBe(true)
  })

  it('handles best-of-5 needing three sets', () => {
    const s = calculateScoreFromPointLog(log([...set60('p1'), ...set60('p1'), ...game('p2')]), bestOf5)
    expect(s.sets).toEqual([[6, 0], [6, 0]])
    expect(s.games).toEqual([0, 1])
  })
})
