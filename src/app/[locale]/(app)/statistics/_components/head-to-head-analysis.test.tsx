import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { HeadToHeadAnalysis } from './head-to-head-analysis'
import type { Match } from '@/lib/types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
jest.mock('@/components/ui/charts', () => ({ UPlotBarChart: () => null, UPlotLineChart: () => null, UPlotPieChart: () => null }))

const vs = (id: string, end: string) => ({
  $id: id, status: 'completed', playerOneId: 'me', playerTwoId: 'rival', winnerId: 'me', matchDate: '2026-10-01T10:00:00.000Z',
  playerTwo: { $id: 'rival', firstName: 'Petr', lastName: 'Dvořák' },
  startTime: '2026-10-01T10:00:00.000Z', endTime: end, score: '{"sets":[[6,4]]}', pointLog: [],
}) as unknown as Match

// Head-to-head only lists opponents met at least twice
it('writes the average length against an opponent in page-language units', async () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  await act(async () => root.render(<HeadToHeadAnalysis matches={[vs('1', '2026-10-01T10:00:30.000Z'), vs('2', '2026-10-01T10:00:50.000Z')]} mainPlayerId="me" />))
  expect(container.textContent).toContain('40 sec')
  expect(container.textContent).not.toMatch(/\b1 min\b|\b0 min\b/)
  act(() => root.unmount())
})
