import { matchStatusKey, normalizeMatchStatus, withNormalizedStatus } from './match-status'

describe('normalizeMatchStatus', () => {
  it('maps the stored labels to the keys the stats screens use', () => {
    expect(normalizeMatchStatus('Completed')).toBe('completed')
    expect(normalizeMatchStatus('In Progress')).toBe('in-progress')
    expect(normalizeMatchStatus('in-progress')).toBe('in-progress')
    expect(normalizeMatchStatus('retired')).toBe('retired')
  })

  it('falls back to pending for unknown or missing values', () => {
    expect(normalizeMatchStatus(undefined)).toBe('pending')
    expect(normalizeMatchStatus('')).toBe('pending')
    expect(normalizeMatchStatus('weird')).toBe('pending')
  })

  it('keeps every other field when normalising a match', () => {
    expect(withNormalizedStatus({ status: 'Completed', winnerId: 'a', score: '{}' })).toEqual({ status: 'completed', winnerId: 'a', score: '{}' })
  })
})

describe('matchStatusKey: an ended match without a result stays out of every win rate', () => {
  it('counts a match won in full or after a retirement or walkover as completed', () => {
    expect(matchStatusKey({ status: 'Completed', winnerId: 'a' })).toBe('completed')
    expect(matchStatusKey({ status: 'Completed', winnerId: 'a', retirementReason: 'retired' })).toBe('completed')
    expect(matchStatusKey({ status: 'Completed', winnerId: 'a', retirementReason: 'walkover' })).toBe('completed')
  })

  it('marks a match stopped unfinished, or ended with no winner, as unfinished', () => {
    expect(matchStatusKey({ status: 'Completed', retirementReason: 'unfinished' })).toBe('unfinished')
    expect(matchStatusKey({ status: 'Completed', winnerId: 'a', retirementReason: 'unfinished' })).toBe('unfinished')
    expect(matchStatusKey({ status: 'Completed' })).toBe('unfinished')
    expect(withNormalizedStatus({ status: 'Completed', retirementReason: 'unfinished' }).status).toBe('unfinished')
  })

  it('leaves matches in play alone', () => {
    expect(matchStatusKey({ status: 'In Progress' })).toBe('in-progress')
  })
})
