import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { buildMatchInsights, type InsightPoint, type Side } from '@/lib/utils/match-insights'
import { LiveInsights } from './live-insights'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// Real Czech messages, so a missing or English text shows up
jest.mock('@/i18n', () => {
  const messages = jest.requireActual('@/i18n/messages/cs.json') as Record<string, Record<string, unknown>>
  const { IntlMessageFormat } = jest.requireActual('intl-messageformat')
  return {
    useLocale: () => 'cs',
    useTranslations: (namespace: string) => (key: string, values?: Record<string, unknown>) => {
      const message = messages[namespace]?.[key]
      return typeof message === 'string' ? String(new IntlMessageFormat(message, 'cs').format(values)) : `${namespace}.${key}`
    },
  }
})

/** One game: the server and who won each point ("s" server, "r" receiver) */
const game = (gameNumber: number, server: Side, seq: string): InsightPoint[] =>
  seq.split('').map((c) => ({ winner: c === 's' ? server : server === 'p1' ? 'p2' : 'p1', server, serveType: 'first', pointOutcome: 'winner', setNumber: 1, gameNumber }))

async function render(points: InsightPoint[]) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<LiveInsights insights={buildMatchInsights(points)} names={{ p1: 'Sofie', p2: 'Eva' }} matchOver={false} />))
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

describe('LiveInsights', () => {
  it('shows the current run and the comeback that just happened, in Czech', async () => {
    // p1 serves from 0:40 to hold, then wins the first point of the next game
    const { container, cleanup } = await render([...game(1, 'p1', 'rrrssss'), ...game(2, 'p2', 'r')])
    expect(container.querySelector('[data-live-run]')?.textContent).toBe('Sofie: 5 bodů v řadě')
    expect(container.querySelector('[data-live-moment]')?.textContent).toContain('Obrat z 0:40')
    expect(container.querySelector('[data-live-moment]')?.textContent).toContain('3 zachráněné brejkboly')
    cleanup()
  })

  it('lists this set\'s games with the one being played as "teď"', async () => {
    const { container, cleanup } = await render([...game(1, 'p1', 'ssss'), ...game(2, 'p2', 'ssss')])
    const tiles = Array.from(container.querySelectorAll('[data-game-tile]'), (tile) => tile.textContent)
    expect(tiles).toEqual(['1:0', '1:1', 'teď'])
    expect(container.textContent).toContain('Hry v 1. setu')
    expect(container.querySelector('[data-live-run]')?.textContent).toBe('Eva: 4 body v řadě')
    cleanup()
  })

  it('stays hidden before the first point', async () => {
    const { container, cleanup } = await render([])
    expect(container.querySelector('[data-live-insights]')).toBeNull()
    cleanup()
  })
})
