import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { CompactLiveScoreboard } from './compact-live-scoreboard'
import { usePublicMatchPolling } from '@/hooks/use-public-match-polling'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
jest.mock('@/hooks/use-public-match-polling', () => ({ usePublicMatchPolling: jest.fn() }))

it('updates the compact score without navigating or refreshing the document', async () => {
  const useLive = jest.mocked(usePublicMatchPolling)
  useLive.mockReturnValue(null)
  const props = { matchId: 'match1', teams: [{ names: ['Alice'], ids: ['p1'] }, { names: ['Bob'], ids: ['p2'] }] as const, playerOneId: 'a', playerTwoId: 'b', initialScore: JSON.stringify({ sets: [], games: [0, 0], points: [0, 0] }), initialStatus: 'In Progress', initialPointLog: [], format: '{}', labels: { live: 'Live', finished: 'Finished' } }
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<CompactLiveScoreboard {...props} />))
  expect(container.querySelector('[data-side="p1"] [data-points]')?.textContent).toBe('0')
  useLive.mockReturnValue({ score: JSON.stringify({ sets: [], games: [0, 0], points: [1, 0] }) })
  await act(async () => root.render(<CompactLiveScoreboard {...props} />))
  expect(container.querySelector('[data-side="p1"] [data-points]')?.textContent).toBe('15')
  act(() => root.unmount())
  container.remove()
})
