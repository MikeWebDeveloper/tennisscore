import { findResumeMatch } from './resume-match'
import type { Match } from '@/lib/types'

it('selects the most recent in-progress match without reordering the source list', () => {
  const matches = [
    { $id: 'older', status: 'in-progress', matchDate: '2026-01-01' },
    { $id: 'finished', status: 'completed', matchDate: '2026-03-01' },
    { $id: 'newer', status: 'in-progress', matchDate: '2026-02-01' },
  ] as Match[]
  expect(findResumeMatch(matches)?.$id).toBe('newer')
  expect(matches[0].$id).toBe('older')
})

it('returns no match when there is nothing to resume', () => {
  expect(findResumeMatch([{ status: 'completed' } as Match])).toBeNull()
})
