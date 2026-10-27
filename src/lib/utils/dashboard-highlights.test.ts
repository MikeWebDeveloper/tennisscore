import { getDashboardHighlights } from './dashboard-highlights'
import type { Match } from '@/lib/types'

it('counts this month and calculates the current singles win streak', () => {
  const matches = [
    { status: 'completed', matchDate: '2026-10-20', winnerId: 'me' },
    { status: 'completed', matchDate: '2026-10-18', winnerId: 'me' },
    { status: 'completed', matchDate: '2026-09-20', winnerId: 'opponent' },
    { status: 'in-progress', matchDate: '2026-10-21' },
    { status: 'completed', matchDate: '2026-10-19', winnerId: 'me', isDoubles: true },
  ] as Match[]
  expect(getDashboardHighlights(matches, 'me', new Date('2026-10-27T12:00:00Z'))).toEqual({ thisMonth: 2, winStreak: 2 })
})

it('reports zero for a latest loss or no completed matches', () => {
  expect(getDashboardHighlights([{ status: 'completed', matchDate: '2026-10-20', winnerId: 'other' } as Match], 'me').winStreak).toBe(0)
  expect(getDashboardHighlights([], 'me').thisMonth).toBe(0)
})
