import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, features } from '@/lib/framer-motion-config'
import { CompactDetailStep } from './compact-detail-step'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const names = { p1: 'Ann', p2: 'Bob', p3: 'Cara', p4: 'Dan' }

function render(doubles?: Record<string, unknown>) {
  const c = document.createElement('div')
  act(() => {
    createRoot(c).render(
      createElement(LazyMotion, { features }, createElement(CompactDetailStep, {
        value: '', onChange: jest.fn(), onStartMatch: jest.fn(async () => {}), loading: false, doubles,
      } as any))
    )
  })
  return c
}
const radio = (c: HTMLElement, name: string) =>
  Array.from(c.querySelectorAll('[role="radio"]')).find((b) => b.textContent === name) as HTMLButtonElement

describe('CompactDetailStep first server picker', () => {
  it('is hidden for singles', () => {
    expect(render().querySelectorAll('[role="radio"]').length).toBe(0)
  })

  it('shows both partners of both pairs with the chosen first servers selected', () => {
    const c = render({ names, order: { p1: 'p3', p2: 'p2' }, onOrderChange: jest.fn() })
    expect(c.querySelectorAll('[role="radio"]').length).toBe(4)
    expect(radio(c, 'Cara').getAttribute('aria-checked')).toBe('true')
    expect(radio(c, 'Ann').getAttribute('aria-checked')).toBe('false')
    expect(radio(c, 'Bob').getAttribute('aria-checked')).toBe('true')
    expect(radio(c, 'Dan').getAttribute('aria-checked')).toBe('false')
  })

  it('changing one pair keeps the other pair\'s choice', () => {
    const onOrderChange = jest.fn()
    const c = render({ names, order: { p1: 'p1', p2: 'p2' }, onOrderChange })
    act(() => { radio(c, 'Dan').click() })
    expect(onOrderChange).toHaveBeenCalledWith({ p1: 'p1', p2: 'p4' })
    act(() => { radio(c, 'Cara').click() })
    expect(onOrderChange).toHaveBeenLastCalledWith({ p1: 'p3', p2: 'p2' })
  })
})

it('lets players choose custom point statistics before starting', () => {
  const c = document.createElement('div')
  const onStartMatch = jest.fn(async () => {})
  const onChange = jest.fn()
  const onCategoriesChange = jest.fn()
  act(() => { createRoot(c).render(createElement(LazyMotion, { features }, createElement(CompactDetailStep, {
    value: 'custom', onChange, onStartMatch, loading: false,
    customCategories: [], onCategoriesChange,
  }))) })
  const checkbox = c.querySelector('input[type="checkbox"]') as HTMLInputElement
  expect(checkbox).not.toBeNull()
  expect(onStartMatch).not.toHaveBeenCalled()
  act(() => checkbox.click())
  expect(onCategoriesChange).toHaveBeenCalled()
})

it('offers stats with shot type between simple and detailed, and starts the match with it', () => {
  const c = document.createElement('div')
  const onStartMatch = jest.fn(async () => {})
  act(() => { createRoot(c).render(createElement(LazyMotion, { features }, createElement(CompactDetailStep, {
    value: '', onChange: jest.fn(), onStartMatch, loading: false,
  } satisfies Parameters<typeof CompactDetailStep>[0]))) })
  const titles = Array.from(c.querySelectorAll('button')).map(b => b.textContent ?? '')
  const index = (key: string) => titles.findIndex(text => text.includes(key))
  expect(index('common.shotTypeStats')).toBe(index('common.simpleStats') + 1)
  expect(index('common.detailedStats')).toBe(index('common.shotTypeStats') + 1)
  act(() => { (c.querySelectorAll('button')[index('common.shotTypeStats')] as HTMLButtonElement).click() })
  expect(onStartMatch).toHaveBeenCalledWith('shot-type')
})
