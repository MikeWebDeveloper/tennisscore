import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { CacheManager } from './cache-manager'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// Real Czech messages, so untranslated English stays visible
jest.mock('@/i18n', () => {
  const messages = jest.requireActual('@/i18n/messages/cs.json') as Record<string, Record<string, unknown>>
  const { IntlMessageFormat } = jest.requireActual('intl-messageformat')
  return {
    useLocale: () => 'cs',
    useTranslations: (namespace: string) => (key: string, values?: Record<string, unknown>) => {
      const message = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages[namespace])
      return typeof message === 'string' ? String(new IntlMessageFormat(message, 'cs').format(values)) : `${namespace}.${key}`
    },
  }
})

it('shows the cache tools in Czech, with no English left over', async () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  await act(async () => root.render(<CacheManager />))
  const text = container.textContent ?? ''
  expect(text).toContain('Vymazat mezipaměť')
  expect(text).toContain('Připojeno')
  for (const english of ['Cache', 'Clear', 'Refresh', 'Online', 'Connected', 'When to use', 'settings.']) expect(text).not.toContain(english)
  act(() => root.unmount())
})
