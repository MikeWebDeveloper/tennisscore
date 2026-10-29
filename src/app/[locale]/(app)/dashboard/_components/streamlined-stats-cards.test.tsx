import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { StreamlinedStatsCards } from './streamlined-stats-cards'
import type { Match, Player } from '@/lib/types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
jest.mock('@/i18n/navigation', () => ({ Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }))

const me = { $id: 'me' } as Player
const finished = (id: string, start: string, end: string) =>
  ({ $id: id, status: 'completed', playerOneId: 'me', playerTwoId: 'x', winnerId: 'me', matchDate: start, startTime: start, endTime: end }) as unknown as Match

async function render(matches: Match[]) {
  const container = document.createElement('div')
  const root = createRoot(container)
  await act(async () => root.render(<StreamlinedStatsCards matches={matches} mainPlayer={me} />))
  return { text: container.textContent ?? '', cleanup: () => act(() => root.unmount()) }
}

it('writes the average match length in page-language units, with seconds for very short matches', async () => {
  const short = await render([finished('1', '2026-10-01T10:00:00.000Z', '2026-10-01T10:00:22.000Z')])
  expect(short.text).toContain('22 sec')
  short.cleanup()
  const long = await render([finished('1', '2026-10-01T10:00:00.000Z', '2026-10-01T11:05:00.000Z')])
  expect(long.text).toContain('1 hr 5 min')
  expect(long.text).not.toContain('1h 5m')
  long.cleanup()
})

it('shows a dash instead of a 0% win rate before any match is finished', async () => {
  const { text, cleanup } = await render([])
  expect(text).not.toContain('0%')
  cleanup()
})

it('sets duration units in smaller type so "1 hr 5 min" stays on one line in the tile', async () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  await act(async () => root.render(<StreamlinedStatsCards matches={[finished('1', '2026-10-01T10:00:00.000Z', '2026-10-01T11:05:00.000Z')]} mainPlayer={me} />))
  const value = container.querySelector('[data-duration-value]') as HTMLElement
  expect(value.textContent).toBe('1 hr 5 min')
  expect(value.className).toContain('whitespace-nowrap')
  expect(Array.from(value.querySelectorAll('[data-unit]'), unit => unit.textContent?.trim())).toEqual(['hr', 'min'])
  act(() => root.unmount())
})
