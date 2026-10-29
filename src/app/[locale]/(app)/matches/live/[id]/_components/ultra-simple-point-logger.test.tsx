import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { UltraSimplePointLogger } from './ultra-simple-point-logger'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type Props = Parameters<typeof UltraSimplePointLogger>[0]
let root: Root | null = null

function open(context: Partial<Props['pointContext']>, extra: Partial<Props> = {}) {
  const onSave = jest.fn()
  const pointContext = {
    pointNumber: 1, setNumber: 1, gameNumber: 1, gameScore: '0-0', winner: 'p1' as const, server: 'p1' as const, serveType: 'first' as const,
    isBreakPoint: false, isSetPoint: false, isMatchPoint: false, playerNames: { p1: 'Ann', p2: 'Bea' }, ...context,
  }
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(<UltraSimplePointLogger open onOpenChange={jest.fn()} onSave={onSave} pointContext={pointContext} {...extra} />))
  return onSave
}
const button = (text: string) => Array.from(document.body.querySelectorAll('button')).find(b => b.textContent?.includes(text)) as HTMLButtonElement
const click = (text: string) => act(() => { button(text).click() })
const subtitle = () => document.body.querySelector('[data-step-subtitle]')?.textContent
const labels = () => Array.from(document.body.querySelectorAll('[data-option]')).map(el => el.textContent)

afterEach(() => { act(() => root?.unmount()); root = null; document.body.innerHTML = '' })

it('puts the reason an option is unavailable on its own wrapping line', () => {
  open({ winner: 'p2', server: 'p1', serveType: 'first' })
  const reason = document.body.querySelector('[data-unavailable-reason]')
  expect(reason?.textContent).toBe('common.serverMustWinForAce')
  expect(reason?.tagName).toBe('DIV')
  expect(button('common.aces').className).toContain('whitespace-normal')
})

it('asks for the shot with a matching subtitle after a winner', () => {
  open({})
  expect(subtitle()).toBe('common.selectHowPointEnded')
  click('common.winner')
  expect(subtitle()).toBe('common.selectShotThatEndedPoint')
})

it('offers net cord, out of the court and on the T for an ace, and saves the choice', () => {
  const onSave = open({ winner: 'p1', server: 'p1' })
  click('common.aces')
  expect(subtitle()).toBe('common.selectWhereServeLanded')
  expect(labels()).toEqual(['common.serveNetCord', 'common.serveOutOfCourt', 'common.serveOnTheT'])
  click('common.serveNetCord')
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ pointOutcome: 'ace', servePlacement: 'net-cord' }))
})

it('keeps the existing placement choices for a double fault', () => {
  open({ winner: 'p2', server: 'p1', serveType: 'second' })
  click('common.doubleFaults')
  expect(labels()).toEqual(['common.wide', 'common.body', 'common.tDownTheMiddle'])
})

describe('shot-type level', () => {
  it('records the shot type for a winner without asking for direction', () => {
    const onSave = open({}, { mode: 'shot-type' })
    click('common.winner')
    click('common.forehand')
    expect(onSave).toHaveBeenCalledTimes(1)
    const saved = onSave.mock.calls[0][0]
    expect(saved).toMatchObject({ pointOutcome: 'winner', lastShotType: 'forehand' })
    expect(saved.shotDirection).toBeUndefined()
  })

  it('saves an ace straight away without serve placement', () => {
    const onSave = open({ winner: 'p1', server: 'p1' }, { mode: 'shot-type' })
    click('common.aces')
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ pointOutcome: 'ace', lastShotType: 'serve' }))
    expect(onSave.mock.calls[0][0].servePlacement).toBeUndefined()
  })
})

describe('return shots in the shot step (no separate "was it a return?" step)', () => {
  it('shows the return row to the receiver and saves the return without an extra step', () => {
    const onSave = open({ winner: 'p2', server: 'p1' })
    click('common.winner')
    expect(labels()).toEqual(['common.forehand', 'common.backhand', 'common.returnForehand', 'common.returnBackhand', 'common.volley', 'common.overhead'])
    click('common.returnForehand')
    click('common.crossCourt')
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0][0]).toMatchObject({ pointOutcome: 'winner', lastShotType: 'forehand', winnerType: 'return', shotDirection: 'cross' })
  })

  it('records an ordinary receiver winner as regular, still without the extra step', () => {
    const onSave = open({ winner: 'p2', server: 'p1' })
    click('common.winner')
    click('common.volley')
    click('common.downTheLine')
    expect(onSave.mock.calls[0][0]).toMatchObject({ lastShotType: 'volley', winnerType: 'regular' })
  })

  it('hides the return row from the server', () => {
    open({ winner: 'p1', server: 'p1' })
    click('common.winner')
    expect(labels()).toEqual(['common.forehand', 'common.backhand', 'common.volley', 'common.overhead'])
  })

  it('records a return backhand straight away at the shot-type level', () => {
    const onSave = open({ winner: 'p2', server: 'p1' }, { mode: 'shot-type' })
    click('common.winner')
    click('common.returnBackhand')
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0][0]).toMatchObject({ lastShotType: 'backhand', winnerType: 'return' })
  })
})
