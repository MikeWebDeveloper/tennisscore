import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { liveStatus, useRealtimeMatch } from './use-realtime-match'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
jest.mock('@/lib/appwrite-client', () => ({ client: { subscribe: jest.fn(() => jest.fn()) }, databases: { getDocument: jest.fn() } }))

const now = Date.parse('2026-11-02T14:32:00.000Z')

describe('liveStatus: what the spectator page may honestly say', () => {
  it('says live only while pushed updates are arriving', () => {
    expect(liveStatus({ lastPushAt: now - 20_000, lastSyncedAt: now - 20_000, failing: false }, now)).toBe('live')
  })
  it('says it refreshes every 5 s when only the polling brings updates', () => {
    expect(liveStatus({ lastPushAt: now - 5 * 60_000, lastSyncedAt: now - 3_000, failing: false }, now)).toBe('polling')
    expect(liveStatus({ lastPushAt: null, lastSyncedAt: now - 3_000, failing: false }, now)).toBe('polling')
  })
  it('says offline when the last refresh failed, however recent the last push', () => {
    expect(liveStatus({ lastPushAt: now - 10_000, lastSyncedAt: now - 10_000, failing: true }, now)).toBe('offline')
  })
  it('is still connecting before the first answer', () => {
    expect(liveStatus({ lastPushAt: null, lastSyncedAt: null, failing: false }, now)).toBe('connecting')
  })
})

function Viewer() {
  const { status, lastSyncedAt } = useRealtimeMatch('match1')
  return <span data-status={status} data-synced={lastSyncedAt ?? ''} />
}

it('reports polling while the refresh works and offline once it fails, keeping the last good time', async () => {
  jest.useFakeTimers()
  const originalFetch = global.fetch
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ score: 's1', status: 'In Progress' }) })
    .mockRejectedValue(new Error('offline'))
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => { root.render(<Viewer />) })
  const span = () => container.querySelector('span')!
  expect(span().dataset.status).toBe('polling')
  const synced = span().dataset.synced
  expect(synced).not.toBe('')
  await act(async () => { await jest.advanceTimersByTimeAsync(5_000) })
  expect(span().dataset.status).toBe('offline')
  expect(span().dataset.synced).toBe(synced)
  act(() => root.unmount())
  container.remove()
  global.fetch = originalFetch
  jest.useRealTimers()
})
