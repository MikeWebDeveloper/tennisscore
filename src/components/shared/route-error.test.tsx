import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { RouteError } from './route-error'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }))
jest.mock('@/i18n', () => ({ useTranslations: () => (key: string) => key }))
jest.mock('@/i18n/navigation', () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }))

it('reloads the server data, not only the screen, when Try again is pressed', () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const reset = jest.fn()
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(<RouteError error={new Error('Operation timed out after 2000ms')} reset={reset} />))

  const retry = [...container.querySelectorAll('button')].find((button) => button.textContent === 'tryAgain')!
  act(() => retry.click())

  expect(mockRefresh).toHaveBeenCalledTimes(1)
  expect(reset).toHaveBeenCalledTimes(1)
  act(() => root.unmount())
})
