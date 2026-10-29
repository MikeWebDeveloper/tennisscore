import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { useRealtimeMatch } from './use-realtime-match'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
jest.mock('@/lib/appwrite-client', () => ({ client: { subscribe: jest.fn(() => jest.fn()) }, databases: { getDocument: jest.fn() } }))

function Viewer() {
  const { lastUpdate } = useRealtimeMatch('match1')
  return <span>{lastUpdate?.score || 'waiting'}</span>
}

it('catches up through the public match endpoint without requiring an Appwrite session', async () => {
  const originalFetch = global.fetch
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ score: 'new-score', status: 'In Progress' }) })
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => { root.render(<Viewer />) })
  expect(global.fetch).toHaveBeenCalledWith('/api/live/match1', expect.objectContaining({ cache: 'no-store' }))
  expect(container.textContent).toBe('new-score')
  act(() => root.unmount())
  container.remove()
  global.fetch = originalFetch
})
