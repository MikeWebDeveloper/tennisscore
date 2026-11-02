import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { DoublesServeCard } from './doubles-serve-card'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
jest.mock('@/i18n', () => {
  const messages = jest.requireActual('@/i18n/messages/cs.json') as Record<string, Record<string, unknown>>
  const { IntlMessageFormat } = jest.requireActual('intl-messageformat')
  return {
    useTranslations: (namespace: string) => (key: string, values?: Record<string, unknown>) => {
      const message = messages[namespace]?.[key]
      return typeof message === 'string' ? String(new IntlMessageFormat(message, 'cs').format(values)) : `${namespace}.${key}`
    },
  }
})

it('lists each partner with their own service games and serve points, in Czech', () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(<DoublesServeCard
    names={{ p1: 'Sofie', p2: 'Eva', p3: 'Anna', p4: 'Bára' }}
    rows={[
      { player: 'p1', serviceGames: 3, held: 2, pointsServed: 20, pointsWon: 13, secondServes: 4, aces: 1, doubleFaults: 2 },
      { player: 'p3', serviceGames: 2, held: 2, pointsServed: 10, pointsWon: 8, secondServes: 0 },
    ]}
  />))
  const rows = container.querySelectorAll('[data-doubles-serve-row]')
  expect(rows).toHaveLength(2)
  expect(rows[0].textContent).toContain('Sofie')
  expect(rows[0].textContent).toContain('Udržená podání 2/3')
  expect(rows[0].textContent).toContain('Body na podání 13/20 (65 %)')
  expect(rows[0].textContent).toContain('Esa 1')
  expect(rows[0].textContent).toContain('Dvojchyby 2')
  // A level without outcomes shows no aces or double faults
  expect(rows[1].textContent).not.toContain('Esa')
  act(() => root.unmount())
  container.remove()
})
