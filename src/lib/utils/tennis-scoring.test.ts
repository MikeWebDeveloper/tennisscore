import { isBreakPoint, isSetPoint, isMatchPoint } from './tennis-scoring'
import { MatchFormat } from '@/stores/matchStore'

describe('Tennis BP/SP/MP Logic', () => {
  const standardFormat: MatchFormat = { sets: 3, noAd: false, tiebreak: true, finalSetTiebreak: 'standard' }
  const superTiebreakFormat: MatchFormat = { sets: 3, noAd: false, tiebreak: true, finalSetTiebreak: 'super', finalSetTiebreakAt: 10 }

  describe('isBreakPoint', () => {
    it('detects break point in standard scoring', () => {
      expect(isBreakPoint(0, 3, false)).toBe(true) // 0-40
      expect(isBreakPoint(1, 3, false)).toBe(true) // 15-40
      expect(isBreakPoint(2, 3, false)).toBe(true) // 30-40
      expect(isBreakPoint(3, 3, false)).toBe(false) // 40-40
      expect(isBreakPoint(3, 4, false)).toBe(true) // 40-AD
      expect(isBreakPoint(4, 3, false)).toBe(false) // AD-40
    })
    it('never returns break point at 40:40 in standard scoring', () => {
      expect(isBreakPoint(3, 3, false)).toBe(false)
      expect(isBreakPoint(3, 3, true)).toBe(true) // No-Ad: should be true
    })
    it('detects break point in no-ad scoring', () => {
      expect(isBreakPoint(3, 3, true)).toBe(true) // 40-40, returner BP
      expect(isBreakPoint(2, 3, true)).toBe(true) // 30-40, returner BP
      expect(isBreakPoint(3, 2, true)).toBe(false) // 40-30, not BP
    })
  })

  describe('isSetPoint', () => {
    it('detects set point in regular games', () => {
      // P1 at 5 games, 40-30, can win set
      expect(isSetPoint(5, 4, 3, 2, standardFormat, false, [[5,4]])).toEqual({ isSetPoint: true, player: 'p1' })
      // P2 at 5 games, 30-40, can win set
      expect(isSetPoint(4, 5, 2, 3, standardFormat, false, [[4,5]])).toEqual({ isSetPoint: true, player: 'p2' })
      // Not set point at 4-4
      expect(isSetPoint(4, 4, 3, 2, standardFormat, false, [[4,4]])).toEqual({ isSetPoint: false, player: null })
    })
    it('never returns set point at 40:40 in standard scoring', () => {
      expect(isSetPoint(5, 4, 3, 3, standardFormat, false, [[5,4]])).toEqual({ isSetPoint: false, player: null })
      expect(isSetPoint(5, 4, 3, 3, { ...standardFormat, noAd: true }, false, [[5,4]])).not.toEqual({ isSetPoint: false, player: null })
    })
    it('detects set point at deuce/advantage', () => {
      // P1 at 5 games, deuce, can win set
      expect(isSetPoint(5, 4, 3, 3, standardFormat, false, [[5,4]])).toEqual({ isSetPoint: false, player: null })
      // P1 at 5 games, AD-40, can win set
      expect(isSetPoint(5, 4, 4, 3, standardFormat, false, [[5,4]])).toEqual({ isSetPoint: true, player: 'p1' })
      // P2 at 5 games, 40-AD, can win set
      expect(isSetPoint(4, 5, 3, 4, standardFormat, false, [[4,5]])).toEqual({ isSetPoint: true, player: 'p2' })
    })
    it('detects set point in tiebreak', () => {
      // Standard tiebreak, first to 7
      expect(isSetPoint(6, 6, 6, 7, standardFormat, true, [[6,6]])).toEqual({ isSetPoint: true, player: 'p2' })
      expect(isSetPoint(6, 6, 6, 6, standardFormat, true, [[6,6]])).toEqual({ isSetPoint: false, player: null })
    })
    it('detects set point in super tiebreak', () => {
      // Super tiebreak, first to 10
      expect(isSetPoint(6, 6, 9, 10, superTiebreakFormat, true, [[6,6],[6,6]])).toEqual({ isSetPoint: true, player: 'p2' })
      expect(isSetPoint(6, 6, 10, 9, superTiebreakFormat, true, [[6,6],[6,6]])).toEqual({ isSetPoint: true, player: 'p1' })
      expect(isSetPoint(6, 6, 9, 9, superTiebreakFormat, true, [[6,6],[6,6]])).toEqual({ isSetPoint: false, player: null })
    })
  })

  describe('isMatchPoint', () => {
    it('detects match point in regular games', () => {
      // P1 one set away, at set point
      expect(isMatchPoint(5, 4, 3, 2, [[6,4]], standardFormat, false)).toEqual({ isMatchPoint: true, player: 'p1' })
      // P2 one set away, at set point
      expect(isMatchPoint(4, 5, 2, 3, [[4,6]], standardFormat, false)).toEqual({ isMatchPoint: true, player: 'p2' })
      // Not match point if not at set point
      expect(isMatchPoint(4, 4, 3, 2, [[6,4]], standardFormat, false)).toEqual({ isMatchPoint: false, player: null })
    })
    it('detects match point in tiebreak', () => {
      // P1 one set away, at tiebreak set point
      expect(isMatchPoint(6, 6, 6, 7, [[4,6]], standardFormat, true)).toEqual({ isMatchPoint: true, player: 'p2' })
      // Not match point if not at set point
      expect(isMatchPoint(6, 6, 6, 6, [[6,4]], standardFormat, true)).toEqual({ isMatchPoint: false, player: null })
    })
    it('detects match point in super tiebreak', () => {
      expect(isMatchPoint(6, 6, 9, 10, [[6,4],[4,6]], superTiebreakFormat, true)).toEqual({ isMatchPoint: true, player: 'p2' })
      expect(isMatchPoint(6, 6, 10, 9, [[6,4],[4,6]], superTiebreakFormat, true)).toEqual({ isMatchPoint: true, player: 'p1' })
      expect(isMatchPoint(6, 6, 9, 9, [[6,4],[4,6]], superTiebreakFormat, true)).toEqual({ isMatchPoint: false, player: null })
    })
  })
}) 