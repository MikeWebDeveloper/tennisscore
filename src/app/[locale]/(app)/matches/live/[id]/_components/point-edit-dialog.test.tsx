import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { PointEditDialog } from './point-edit-dialog'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
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
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}))

const names = { p1: 'Sofie', p2: 'Eva' }
const point = { index: 3, pointNumber: 4, gameScore: '40-0', winner: 'p1' as const, server: 'p1' as const }

function mount(props: Partial<React.ComponentProps<typeof PointEditDialog>> = {}) {
  const onApply = jest.fn()
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(<PointEditDialog point={point} names={names} recordsOutcome pending={false} onApply={onApply} onClose={jest.fn()} {...props} />))
  const button = (text: string) => [...container.querySelectorAll('button')].find(b => b.textContent === text)
  return { container, onApply, button, unmount: () => { act(() => root.unmount()); container.remove() } }
}

it('gives the point to the other player once the scorer says how it ended', () => {
  const { container, onApply, button, unmount } = mount()
  expect(container.textContent).toContain('Oprava bodu č. 4')
  expect(container.textContent).toContain('40-0 · bod vyhrává Sofie')
  expect(container.textContent).toContain('Bod vyhrává Eva')
  // Eva was receiving: she cannot have served an ace, Sofie can have double-faulted
  expect(button('Eso')).toBeUndefined()
  expect(button('Dvojchyba')).toBeDefined()
  expect(button('Uložit opravu')?.disabled).toBe(true)
  act(() => button('Nevynucená chyba')!.click())
  act(() => button('Uložit opravu')!.click())
  expect(onApply).toHaveBeenCalledWith({ kind: 'change-winner', index: 3, outcome: 'unforced_error' })
  unmount()
})

it('inserts a missing point for the player the scorer picks', () => {
  const { onApply, button, unmount } = mount()
  act(() => button('Chybějící bod')!.click())
  act(() => button('Eva')!.click())
  act(() => button('Vítězný úder')!.click())
  act(() => button('Uložit opravu')!.click())
  expect(onApply).toHaveBeenCalledWith({ kind: 'insert', index: 3, winner: 'p2', outcome: 'winner' })
  unmount()
})

it('deletes the point', () => {
  const { onApply, button, unmount } = mount()
  act(() => button('Smazat')!.click())
  act(() => button('Uložit opravu')!.click())
  expect(onApply).toHaveBeenCalledWith({ kind: 'delete', index: 3 })
  unmount()
})

it('needs no outcome when the match only records who won each point', () => {
  const { onApply, button, container, unmount } = mount({ recordsOutcome: false })
  expect(container.textContent).not.toContain('Jak bod skončil?')
  act(() => button('Uložit opravu')!.click())
  expect(onApply).toHaveBeenCalledWith({ kind: 'change-winner', index: 3 })
  unmount()
})
