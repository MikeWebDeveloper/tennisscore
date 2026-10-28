import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, features } from '@/lib/framer-motion-config'
import { CompactPlayersStep } from './compact-players-step'

jest.mock('../../../../players/_components/create-player-dialog', () => ({ CreatePlayerDialog: () => null }))
jest.mock('@/components/ui/combobox', () => ({ Combobox: ({ value }: { value: string }) => <span>{value}</span> }))
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

function render(overrides: Record<string, unknown> = {}) {
  const onComplete = jest.fn()
  const container = document.createElement('div')
  const root = createRoot(container)
  const props = {
    matchType: 'singles', players: [], playerOne: 'alice', playerTwo: 'bob', playerThree: '', playerFour: '',
    playerOneAnonymous: false, playerTwoAnonymous: false, playerThreeAnonymous: false, playerFourAnonymous: false,
    onPlayerChange: jest.fn(), onAnonymousChange: jest.fn(), onComplete, ...overrides,
  }
  act(() => root.render(createElement(LazyMotion, { features }, createElement(CompactPlayersStep, props as any))))
  return { container, onComplete, root }
}

describe('player selection navigation', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('keeps completed selections visible until Continue is pressed, including after returning', () => {
    const { container, onComplete, root } = render()
    act(() => jest.advanceTimersByTime(1000))
    expect(onComplete).not.toHaveBeenCalled()
    expect(container.textContent).toContain('alice')
    expect(container.textContent).toContain('bob')
    const button = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('common.continue'))!
    expect(button.disabled).toBe(false)
    act(() => button.click())
    expect(onComplete).toHaveBeenCalledTimes(1)
    act(() => root.unmount())
    const returned = render()
    act(() => jest.advanceTimersByTime(1000))
    expect(returned.onComplete).not.toHaveBeenCalled()
    expect(returned.container.textContent).toContain('alice')
    expect(returned.container.textContent).toContain('bob')
    act(() => returned.root.unmount())
  })

  it('requires all four players for doubles, including anonymous players', () => {
    const { container, root } = render({ matchType: 'doubles', playerThreeAnonymous: true })
    const button = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('common.continue'))!
    expect(button.disabled).toBe(true)
    act(() => root.unmount())
  })
})
