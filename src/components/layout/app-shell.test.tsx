import { act, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppShell } from './app-shell'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
  usePathname: () => '/dashboard',
  useRouter: () => ({ prefetch: jest.fn(), push: jest.fn() }),
}))
jest.mock('@/lib/actions/auth', () => ({ signOut: jest.fn() }))
jest.mock('@/lib/auth', () => ({ isAdmin: () => false }))
jest.mock('@/components/ui/language-switcher', () => ({ LanguageSwitcher: () => null }))
jest.mock('@/components/ui/theme-switcher', () => ({ ThemeSwitcher: () => null, ThemeCycleButton: () => null }))
jest.mock('./collapsible-mobile-nav', () => ({ MobileTabBar: () => null }))
jest.mock('@/components/shared/install-app-item', () => ({ InstallAppItem: () => null }))
jest.mock('@/components/shared/extension-conflict-notice', () => ({ ExtensionConflictNotice: () => null }))

it('names an account without a display name by its email instead of a generic placeholder', async () => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn(), addListener: jest.fn(), removeListener: jest.fn() })
  const container = document.createElement('div')
  const root = createRoot(container)
  await act(async () => root.render(<AppShell user={{ $id: 'u1', name: '', email: 'player@example.com' } as never}><p>page</p></AppShell>))
  const userBlock = container.querySelector('[data-user-block]')
  expect(userBlock?.textContent).not.toContain('defaultUserName')
  expect(userBlock?.textContent?.split('player@example.com').length).toBe(2)
  act(() => root.unmount())
})
