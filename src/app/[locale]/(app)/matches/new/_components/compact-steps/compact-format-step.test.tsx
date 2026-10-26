import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, features } from '@/lib/framer-motion-config'
import { CompactFormatStep } from './compact-format-step'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

function render(props: Record<string, unknown> = {}) {
  const handlers = {
    onSetFormatChange: jest.fn(), onSetsChange: jest.fn(), onScoringChange: jest.fn(),
    onFinalSetChange: jest.fn(), onComplete: jest.fn(),
  }
  const c = document.createElement('div')
  act(() => {
    createRoot(c).render(
      createElement(LazyMotion, { features }, createElement(CompactFormatStep, {
        setFormat: 'standard', sets: null, scoring: '', finalSet: '', ...handlers, ...props,
      } as any))
    )
  })
  return { c, ...handlers }
}

const buttonByText = (c: HTMLElement, text: string) =>
  Array.from(c.querySelectorAll('button')).find((b) => b.textContent === text) as HTMLButtonElement

describe('CompactFormatStep set length', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('offers standard, short sets, Fast4 and pro set, with the current one pressed', () => {
    const { c } = render({ setFormat: 'fast4' })
    expect(buttonByText(c, 'common.setFormatStandard').getAttribute('aria-pressed')).toBe('false')
    expect(buttonByText(c, 'common.setFormatFast4').getAttribute('aria-pressed')).toBe('true')
    expect(buttonByText(c, 'common.setFormatPro').getAttribute('aria-pressed')).toBe('false')
    expect(buttonByText(c, 'common.setFormatShort').getAttribute('aria-pressed')).toBe('false')
  })

  it('reports the chosen set length', () => {
    const { c, onSetFormatChange } = render()
    act(() => { buttonByText(c, 'common.setFormatPro').click() })
    expect(onSetFormatChange).toHaveBeenCalledWith('pro')
  })

  it('still auto-advances once sets, scoring and final set are chosen (set length is optional)', () => {
    const { onComplete } = render({ sets: 3, scoring: 'no-ad', finalSet: 'full' })
    expect(onComplete).not.toHaveBeenCalled()
    act(() => { jest.advanceTimersByTime(350) })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('does not advance while a required choice is missing', () => {
    const { onComplete } = render({ sets: 3, scoring: '', finalSet: 'full' })
    act(() => { jest.advanceTimersByTime(1000) })
    expect(onComplete).not.toHaveBeenCalled()
  })
})
