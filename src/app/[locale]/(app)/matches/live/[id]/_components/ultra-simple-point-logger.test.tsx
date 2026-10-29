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
  expect(button('common.ace').className).toContain('whitespace-normal')
})

it('asks for the shot with a matching subtitle after a winner', () => {
  open({})
  expect(subtitle()).toBe('common.selectHowPointEnded')
  click('common.pointWinner')
  expect(subtitle()).toBe('common.selectShotThatEndedPoint')
})

it('offers net cord, out of the court and on the T for an ace, and saves the choice', () => {
  const onSave = open({ winner: 'p1', server: 'p1' })
  click('common.ace')
  expect(subtitle()).toBe('common.selectWhereServeLanded')
  expect(labels()).toEqual(['common.serveNetCord', 'common.serveOutOfCourt', 'common.serveOnTheT'])
  click('common.serveNetCord')
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ pointOutcome: 'ace', servePlacement: 'net-cord' }))
})

it('keeps the existing placement choices for a double fault', () => {
  open({ winner: 'p2', server: 'p1', serveType: 'second' })
  click('common.doubleFault')
  expect(labels()).toEqual(['common.wide', 'common.body', 'common.tDownTheMiddle'])
})

describe('shot-type level', () => {
  it('records the shot type for a winner without asking for direction', () => {
    const onSave = open({}, { mode: 'shot-type' })
    click('common.pointWinner')
    click('common.forehand')
    expect(onSave).toHaveBeenCalledTimes(1)
    const saved = onSave.mock.calls[0][0]
    expect(saved).toMatchObject({ pointOutcome: 'winner', lastShotType: 'forehand' })
    expect(saved.shotDirection).toBeUndefined()
  })

  // Ace placement is asked at this level too; double faults stay one tap
  it('asks where an ace landed and saves it', () => {
    const onSave = open({ winner: 'p1', server: 'p1' }, { mode: 'shot-type' })
    click('common.ace')
    expect(labels()).toEqual(['common.serveNetCord', 'common.serveOutOfCourt', 'common.serveOnTheT'])
    click('common.serveOnTheT')
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ pointOutcome: 'ace', lastShotType: 'serve', servePlacement: 't' }))
  })

  it('saves a double fault straight away without serve placement', () => {
    const onSave = open({ winner: 'p2', server: 'p1', serveType: 'second' }, { mode: 'shot-type' })
    click('common.doubleFault')
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ pointOutcome: 'double_fault', lastShotType: 'serve' }))
    expect(onSave.mock.calls[0][0].servePlacement).toBeUndefined()
  })
})

describe('return shots in the shot step (no separate "was it a return?" step)', () => {
  it('shows the return row to the receiver and saves the return without an extra step', () => {
    const onSave = open({ winner: 'p2', server: 'p1' })
    click('common.pointWinner')
    expect(labels()).toEqual(['common.forehand', 'common.backhand', 'common.returnForehand', 'common.returnBackhand', 'common.volley', 'common.overhead'])
    click('common.returnForehand')
    click('common.crossCourt')
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0][0]).toMatchObject({ pointOutcome: 'winner', lastShotType: 'forehand', winnerType: 'return', shotDirection: 'cross' })
  })

  it('records an ordinary receiver winner as regular, still without the extra step', () => {
    const onSave = open({ winner: 'p2', server: 'p1' })
    click('common.pointWinner')
    click('common.volley')
    click('common.downTheLine')
    expect(onSave.mock.calls[0][0]).toMatchObject({ lastShotType: 'volley', winnerType: 'regular' })
  })

  it('hides the return row from the server', () => {
    open({ winner: 'p1', server: 'p1' })
    click('common.pointWinner')
    expect(labels()).toEqual(['common.forehand', 'common.backhand', 'common.volley', 'common.overhead'])
  })

  it('records a return backhand straight away at the shot-type level', () => {
    const onSave = open({ winner: 'p2', server: 'p1' }, { mode: 'shot-type' })
    click('common.pointWinner')
    click('common.returnBackhand')
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0][0]).toMatchObject({ lastShotType: 'backhand', winnerType: 'return' })
  })
})

describe('return errors (the receiver can also miss the return)', () => {
  it('offers the return row for the receiver\'s unforced error and saves it as a return', () => {
    // Server p1 wins the point because receiver p2 missed
    const onSave = open({ winner: 'p1', server: 'p1' })
    click('common.unforcedError')
    expect(labels()).toEqual(['common.forehand', 'common.backhand', 'common.returnForehand', 'common.returnBackhand', 'common.volley', 'common.overhead'])
    click('common.returnBackhand')
    // Errors ask where the ball went: long, wide or into the net
    click('common.intoNet')
    expect(onSave.mock.calls[0][0]).toMatchObject({ pointOutcome: 'unforced_error', lastShotType: 'backhand', winnerType: 'return', shotDirection: 'net' })
  })

  it('offers the return row for the receiver\'s forced error at the shot-type level', () => {
    const onSave = open({ winner: 'p1', server: 'p1' }, { mode: 'shot-type' })
    click('common.forcedError')
    click('common.returnForehand')
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0][0]).toMatchObject({ pointOutcome: 'forced_error', lastShotType: 'forehand', lastShotPlayer: 'p2', winnerType: 'return' })
  })

  it('records an ordinary receiver error as regular', () => {
    const onSave = open({ winner: 'p1', server: 'p1' })
    click('common.forcedError')
    click('common.volley')
    click('common.long')
    expect(onSave.mock.calls[0][0]).toMatchObject({ pointOutcome: 'forced_error', lastShotType: 'volley', winnerType: 'regular' })
  })

  it('hides the return row when the server made the error', () => {
    // Receiver p2 wins the point because server p1 missed
    open({ winner: 'p2', server: 'p1' })
    click('common.unforcedError')
    expect(labels()).toEqual(['common.forehand', 'common.backhand', 'common.volley', 'common.overhead'])
  })
})

describe('fits a phone screen', () => {
  // A dialog taller than the screen used to push its title and close cross above the top edge
  it('caps the dialog at the screen height and scrolls inside it, keeping the close cross reachable', () => {
    open({})
    const dialog = document.body.querySelector('[data-slot="dialog-content"]') as HTMLElement
    expect(dialog.className).toContain('max-h-[calc(100dvh-2rem)]')
    expect(dialog.className).toContain('overflow-y-auto')
    expect(dialog.querySelector('[data-slot="dialog-close"]')).not.toBeNull()
  })

  it('shows only the reason on an unavailable option, not its general description too', () => {
    open({ winner: 'p2', server: 'p1', serveType: 'first' })
    const ace = button('common.ace')
    expect(ace.textContent).toContain('common.serverMustWinForAce')
    expect(ace.textContent).not.toContain('common.unreturnableServe')
  })

  it('names the serve in the page language instead of "first"/"second"', () => {
    open({ serveType: 'second' })
    // One message for the badge ("Podává Ann (2. podání)"); the real Czech wording is checked in point-windows.cs.test
    expect(document.body.textContent).toContain('common.servingWith')
    expect(document.body.textContent).not.toMatch(/\((first|second)\)/)
  })

  it('uses compact outcome cards so all five fit without scrolling', () => {
    open({})
    const card = button('common.pointWinner')
    expect(card.className).toContain('py-2.5')
    expect(card.className).not.toMatch(/(^|\s)p-4(\s|$)/)
  })
})
