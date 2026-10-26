import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { SyncStatusBadge } from './sync-status-badge'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const render = (state: 'synced' | 'saving' | 'unsent') => {
  const c = document.createElement('div')
  act(() => { createRoot(c).render(createElement(SyncStatusBadge, { state })) })
  return c.firstElementChild as HTMLElement
}

describe('SyncStatusBadge', () => {
  it.each(['synced', 'saving', 'unsent'] as const)('announces the %s state politely', (state) => {
    const el = render(state)
    expect(el.getAttribute('role')).toBe('status')
    expect(el.getAttribute('aria-live')).toBe('polite')
    expect(el.getAttribute('data-sync-state')).toBe(state)
    expect(el.textContent?.length).toBeGreaterThan(0)
  })

  it('only spins while saving and warns when unsent', () => {
    expect(render('saving').querySelector('svg')?.getAttribute('class')).toContain('animate-spin')
    expect(render('synced').querySelector('svg')?.getAttribute('class')).not.toContain('animate-spin')
    expect(render('unsent').className).toContain('amber')
  })
})
