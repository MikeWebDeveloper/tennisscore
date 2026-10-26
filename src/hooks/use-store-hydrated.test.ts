import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { useStoreHydrated } from './use-store-hydrated'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

function fakePersist(initiallyHydrated: boolean) {
  let hydrated = initiallyHydrated
  const listeners = new Set<() => void>()
  return {
    api: {
      hasHydrated: () => hydrated,
      onFinishHydration: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } },
    },
    finish: () => { hydrated = true; listeners.forEach((l) => l()) },
    listenerCount: () => listeners.size,
  }
}

function mount(persist: any, timeoutMs?: number) {
  const out = { value: false }
  const Probe = () => { out.value = useStoreHydrated(persist, timeoutMs); return null }
  const root = createRoot(document.createElement('div'))
  act(() => { root.render(createElement(Probe)) })
  return { out, unmount: () => act(() => root.unmount()) }
}

describe('useStoreHydrated', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('is immediately true when already hydrated or when there is nothing to wait for', () => {
    expect(mount(fakePersist(true).api).out.value).toBe(true)
    expect(mount(undefined).out.value).toBe(true)
  })

  it('waits until hydration finishes', () => {
    const p = fakePersist(false)
    const { out } = mount(p.api)
    expect(out.value).toBe(false)
    act(() => { p.finish() })
    expect(out.value).toBe(true)
  })

  it('continues after the safety timeout if storage never answers', () => {
    const { out } = mount(fakePersist(false).api, 4000)
    act(() => { jest.advanceTimersByTime(3999) })
    expect(out.value).toBe(false)
    act(() => { jest.advanceTimersByTime(2) })
    expect(out.value).toBe(true)
  })

  it('stops listening when unmounted', () => {
    const p = fakePersist(false)
    const { unmount } = mount(p.api)
    expect(p.listenerCount()).toBe(1)
    unmount()
    expect(p.listenerCount()).toBe(0)
  })
})
