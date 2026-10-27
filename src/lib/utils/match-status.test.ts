import { normalizeMatchStatus, withNormalizedStatus } from './match-status'

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
    expect(withNormalizedStatus({ status: 'Completed', score: '{}' })).toEqual({ status: 'completed', score: '{}' })
  })
})
