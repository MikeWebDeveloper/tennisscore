import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { useSyncStatus, type SyncState } from './use-sync-status'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

function mount(push: () => Promise<unknown>, retryMs = 10_000) {
  const out: { state: SyncState; run: <T>(fn: () => Promise<T>) => Promise<T> } = {} as any
  const Probe = () => { Object.assign(out, useSyncStatus(push, retryMs)); return null }
  const root = createRoot(document.createElement('div'))
  act(() => { root.render(createElement(Probe)) })
  return { out, unmount: () => act(() => root.unmount()) }
}

const setOnline = (online: boolean) =>
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online })

describe('useSyncStatus', () => {
  beforeEach(() => { jest.useFakeTimers(); setOnline(true) })
  afterEach(() => jest.useRealTimers())

  it('starts synced, shows saving while in flight, then synced', async () => {
    const { out } = mount(async () => {})
    expect(out.state).toBe('synced')
    let release!: () => void
    let pending!: Promise<unknown>
    act(() => { pending = out.run(() => new Promise<void>((r) => { release = r })) })
    expect(out.state).toBe('saving')
    await act(async () => { release(); await pending })
    expect(out.state).toBe('synced')
  })

  it('becomes unsent when a save fails and rethrows to the caller', async () => {
    const { out } = mount(async () => {})
    let error: unknown
    await act(async () => { await out.run(() => Promise.reject(new Error('offline'))).catch((e) => { error = e }) })
    expect(out.state).toBe('unsent')
    expect((error as Error).message).toBe('offline')
  })

  it('retries automatically when the browser comes back online', async () => {
    const push = jest.fn(async () => {})
    const { out } = mount(push)
    await act(async () => { await out.run(() => Promise.reject(new Error('x'))).catch(() => {}) })
    expect(out.state).toBe('unsent')
    await act(async () => { window.dispatchEvent(new Event('online')) })
    expect(push).toHaveBeenCalledTimes(1)
    expect(out.state).toBe('synced')
  })

  it('retries on a timer while visible, backs off while offline, and keeps trying after a failed retry', async () => {
    const push = jest.fn().mockRejectedValueOnce(new Error('still down')).mockResolvedValue(undefined)
    const { out } = mount(push, 1000)
    await act(async () => { await out.run(() => Promise.reject(new Error('x'))).catch(() => {}) })

    setOnline(false)
    await act(async () => { await jest.advanceTimersByTimeAsync(3000) })
    expect(push).not.toHaveBeenCalled() // offline: no pointless attempts

    setOnline(true)
    await act(async () => { await jest.advanceTimersByTimeAsync(1000) })
    expect(push).toHaveBeenCalledTimes(1)
    expect(out.state).toBe('unsent') // first retry failed

    await act(async () => { await jest.advanceTimersByTimeAsync(1000) })
    expect(push).toHaveBeenCalledTimes(2)
    expect(out.state).toBe('synced')
  })

  it('does not retry once synced', async () => {
    const push = jest.fn(async () => {})
    mount(push, 1000)
    await act(async () => { await jest.advanceTimersByTimeAsync(5000) })
    expect(push).not.toHaveBeenCalled()
  })
})
