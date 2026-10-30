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

it('shows spectators a second serve beside the server, and drops it when the next point starts', async () => {
  const useLive = jest.mocked(usePublicMatchPolling)
  useLive.mockReturnValue(null)
  const pointLog = [JSON.stringify({ winner: 'p1', server: 'p1', setNumber: 1, gameNumber: 1 })]
  const props = { matchId: 'match1', teams: [{ names: ['Alice'], ids: ['p1'] }, { names: ['Bob'], ids: ['p2'] }] as const, playerOneId: 'a', playerTwoId: 'b', initialScore: JSON.stringify({ sets: [], games: [0, 0], points: [1, 0], serve: 'second' }), initialStatus: 'In Progress', initialPointLog: pointLog, format: '{}', labels: { live: 'Živě', finished: 'Konec', firstServe: '1. podání', secondServe: '2. podání' } }
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<CompactLiveScoreboard {...props} />))
  const chip = () => container.querySelector('[data-serve-chip]')
  expect(chip()?.closest('[data-side]')?.getAttribute('data-side')).toBe('p1')
  expect(chip()?.textContent).toBe('2. podání')
  useLive.mockReturnValue({ score: JSON.stringify({ sets: [], games: [0, 0], points: [2, 0] }) })
  await act(async () => root.render(<CompactLiveScoreboard {...props} />))
  expect(chip()?.textContent).toBe('1. podání')
  act(() => root.unmount())
  container.remove()
})
