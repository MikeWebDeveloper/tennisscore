import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { PointByPointView } from './point-by-point-view'
import type { PointDetail } from '@/lib/types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const point = (n: number, winner: 'p1' | 'p2') => ({
  id: String(n), timestamp: '2026-10-29T10:00:00.000Z', pointNumber: n, setNumber: 1, gameNumber: 1, gameScore: `${15 * n}-0`,
  server: 'p1', serveType: 'first', winner, pointOutcome: 'winner', isBreakPoint: false, isSetPoint: false, isMatchPoint: false,
  isGameWinning: false, isSetWinning: false, isMatchWinning: false, isTiebreak: false,
}) as unknown as PointDetail

const pointLog = [point(1, 'p1'), point(2, 'p2'), point(3, 'p1')]

function render(onEditPoint?: (index: number) => void) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(<PointByPointView pointLog={pointLog} playerNames={{ p1: 'Ann', p2: 'Bea' }} detailLevel="simple" onEditPoint={onEditPoint} />))
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

it('lets the scorer open any earlier point for correction, straight from the list', () => {
  const onEditPoint = jest.fn()
  const { container, cleanup } = render(onEditPoint)
  const buttons = container.querySelectorAll('[data-point-row] button[data-edit-point]')
  expect(buttons).toHaveLength(3)
  // The newest point is listed first: the last button is the first point
  act(() => (buttons[2] as HTMLButtonElement).click())
  expect(onEditPoint).toHaveBeenCalledWith(0)
  cleanup()
})

it('offers no correction where the list is only for reading', () => {
  const { container, cleanup } = render()
  expect(container.querySelectorAll('button[data-edit-point]')).toHaveLength(0)
  cleanup()
})
