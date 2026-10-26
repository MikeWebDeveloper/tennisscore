import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, features } from '@/lib/framer-motion-config'
import { LiveScoreboard } from './live-scoreboard'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const score = { sets: [], games: [0, 0], points: [0, 0], isTiebreak: false, tiebreakPoints: [0, 0] } as any

function render(props: Record<string, unknown>) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      createElement(LazyMotion, { features }, createElement(LiveScoreboard, {
        playerOneName: 'Ann', playerTwoName: 'Bob', score, currentServer: 'p1', ...props,
      } as any))
    )
  })
  return container
}

const underlined = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('h3 span.underline')).map((e) => e.textContent)

describe('LiveScoreboard doubles serving marker', () => {
  const doubles = { playerThreeName: 'Cara', playerFourName: 'Dan' }

  it.each([
    ['p1', 'Ann'],
    ['p3', 'Cara'],
  ])('underlines only %s when team one serves', (servingPlayer, name) => {
    expect(underlined(render({ ...doubles, servingPlayer }))).toEqual([name])
  })

  it.each([
    ['p2', 'Bob'],
    ['p4', 'Dan'],
  ])('underlines only %s when team two serves', (servingPlayer, name) => {
    expect(underlined(render({ ...doubles, currentServer: 'p2', servingPlayer }))).toEqual([name])
  })

  it('shows both partner names separated by a slash and marks nobody without servingPlayer', () => {
    const c = render(doubles)
    expect(c.textContent).toContain('Ann / Cara')
    expect(c.textContent).toContain('Bob / Dan')
    expect(underlined(c)).toEqual([])
  })

  it('leaves singles untouched', () => {
    const c = render({ servingPlayer: 'p1' })
    expect(c.textContent).toContain('Ann')
    expect(underlined(c)).toEqual([])
  })
})

describe('LiveScoreboard server selection', () => {
  const doubles = { playerThreeName: 'Cara', playerFourName: 'Dan' }

  it('makes only the serving team partners tappable and reports the choice', () => {
    const onSelect = jest.fn()
    const c = render({ ...doubles, servingPlayer: 'p1', onSelectServingPlayer: onSelect })
    const buttons = Array.from(c.querySelectorAll('h3 [role="button"]'))
    expect(buttons.map((b) => b.textContent)).toEqual(['Ann', 'Cara'])
    act(() => { (buttons[1] as HTMLElement).click() })
    expect(onSelect).toHaveBeenCalledWith('p3')
  })

  it('has no tappable names when no handler is given', () => {
    const c = render({ ...doubles, servingPlayer: 'p1' })
    expect(c.querySelectorAll('h3 [role="button"]').length).toBe(0)
  })
})
