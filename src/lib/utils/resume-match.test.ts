import { findResumeMatch, findStaleMatches } from './resume-match'
import type { Match } from '@/lib/types'

const now = Date.parse('2026-02-03T12:00:00.000Z')

it('selects the most recent in-progress match without reordering the source list', () => {
  const matches = [
    { $id: 'older', status: 'in-progress', matchDate: '2026-02-01' },
    { $id: 'finished', status: 'completed', matchDate: '2026-02-03' },
    { $id: 'newer', status: 'in-progress', matchDate: '2026-02-02' },
  ] as Match[]
  expect(findResumeMatch(matches, now)?.$id).toBe('newer')
  expect(matches[0].$id).toBe('older')
})

it('returns no match when there is nothing to resume', () => {
  expect(findResumeMatch([{ status: 'completed' } as Match], now)).toBeNull()
})

describe('matches left in progress for more than a week', () => {
  const matches = [
    // Created long ago but scored yesterday: still active
    { $id: 'active', status: 'in-progress', matchDate: '2025-12-01', $updatedAt: '2026-02-02T09:00:00.000Z' },
    { $id: 'idle', status: 'in-progress', matchDate: '2026-01-10', $updatedAt: '2026-01-10T10:00:00.000Z' },
    { $id: 'older-idle', status: 'in-progress', matchDate: '2025-06-01', $updatedAt: '2025-06-01T10:00:00.000Z' },
    { $id: 'done', status: 'completed', matchDate: '2025-06-01', $updatedAt: '2025-06-01T10:00:00.000Z' },
  ] as Match[]

  it('are no longer offered to resume', () => {
    expect(findResumeMatch(matches, now)?.$id).toBe('active')
    expect(findResumeMatch(matches.filter(m => m.$id !== 'active'), now)).toBeNull()
  })

  it('are listed for clean-up, most recently touched first', () => {
    expect(findStaleMatches(matches, now).map(m => m.$id)).toEqual(['idle', 'older-idle'])
  })
})
