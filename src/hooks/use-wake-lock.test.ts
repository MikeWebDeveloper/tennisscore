import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { useWakeLock } from './use-wake-lock'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

/** Minimal renderHook: mounts a component that calls the hook. */
function renderHook(hook: () => void) {
  const container = document.createElement('div')
  const root = createRoot(container)
  const Probe = () => { hook(); return null }
  act(() => { root.render(createElement(Probe)) })
  return { unmount: () => act(() => root.unmount()) }
}

function makeSentinel() {
  const listeners: Record<string, () => void> = {}
  return {
    release: jest.fn(async () => { listeners.release?.() }),
    addEventListener: (type: string, fn: () => void) => { listeners[type] = fn },
  }
}

const setVisibility = (state: 'visible' | 'hidden') => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
  document.dispatchEvent(new Event('visibilitychange'))
}
const flush = () => new Promise((r) => setTimeout(r, 0))

describe('useWakeLock', () => {
  afterEach(() => {
    delete (navigator as any).wakeLock
    setVisibility('visible')
  })

  it('requests a screen lock while active and releases it on unmount', async () => {
    const sentinel = makeSentinel()
    const request = jest.fn(async () => sentinel)
    ;(navigator as any).wakeLock = { request }
    const { unmount } = renderHook(() => useWakeLock(true))
    await flush()
    expect(request).toHaveBeenCalledWith('screen')
    unmount()
    expect(sentinel.release).toHaveBeenCalled()
  })

  it('does nothing when inactive', async () => {
    const request = jest.fn()
    ;(navigator as any).wakeLock = { request }
    renderHook(() => useWakeLock(false))
    await flush()
    expect(request).not.toHaveBeenCalled()
  })

  it('re-acquires the lock after the tab becomes visible again', async () => {
    const request = jest.fn(async () => makeSentinel())
    ;(navigator as any).wakeLock = { request }
    renderHook(() => useWakeLock(true))
    await flush()
    expect(request).toHaveBeenCalledTimes(1)
    // Browser releases the lock when hidden; our sentinel's release event clears it
    const first = await request.mock.results[0].value
    await first.release()
    setVisibility('hidden')
    setVisibility('visible')
    await flush()
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('does not throw when the API is missing or denied', async () => {
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow()
    ;(navigator as any).wakeLock = { request: jest.fn(async () => { throw new Error('NotAllowedError') }) }
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow()
    await flush()
  })
})
