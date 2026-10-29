import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { SimpleStatsPopup } from './simple-stats-popup'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
function open(context: { winner: 'p1' | 'p2'; server: 'p1' | 'p2'; serveType: 'first' | 'second' }) {
  const onSave = jest.fn()
  const onOpenChange = jest.fn()
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(<SimpleStatsPopup open onOpenChange={onOpenChange} onSave={onSave}
    pointContext={{ pointNumber: 1, setNumber: 1, gameNumber: 1, gameScore: '0-0', playerNames: { p1: 'Ann', p2: 'Bea' }, ...context }} />))
  return { onSave, onOpenChange }
}
const button = (text: string) => Array.from(document.body.querySelectorAll('button')).find(b => b.textContent?.includes(text)) as HTMLButtonElement
const click = (text: string) => act(() => { button(text).click() })
afterEach(() => { act(() => root?.unmount()); root = null; document.body.innerHTML = '' })

it('asks where an ace landed at the simple level and saves the placement', () => {
  const { onSave } = open({ winner: 'p1', server: 'p1', serveType: 'first' })
  click('common.ace')
  expect(onSave).not.toHaveBeenCalled()
  expect(button('common.serveNetCord')).toBeDefined()
  expect(button('common.serveOutOfCourt')).toBeDefined()
  click('common.serveNetCord')
  expect(onSave).toHaveBeenCalledWith('ace', { servePlacement: 'net-cord' })
})

it('still saves other outcomes with one tap', () => {
  const { onSave } = open({ winner: 'p1', server: 'p1', serveType: 'first' })
  click('common.pointWinner')
  expect(onSave).toHaveBeenCalledWith('winner', undefined)
})

it('names the serve in the page language instead of "first"', () => {
  open({ winner: 'p1', server: 'p1', serveType: 'first' })
  expect(document.body.textContent).not.toMatch(/\((first|second)\)/)
})
