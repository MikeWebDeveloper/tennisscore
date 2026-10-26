const mockInstall = jest.fn(async () => true)
let mockCanInstall = false
jest.mock('@/hooks/use-pwa-install', () => ({
  usePWAInstall: () => ({ canInstall: mockCanInstall, install: mockInstall }),
}))

import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { InstallAppItem } from './install-app-item'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Version/17.4 Mobile/15E148 Safari/604.1'
const CHROME = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36'

function setEnv(userAgent: string, standalone = false) {
  Object.defineProperty(navigator, 'userAgent', { configurable: true, value: userAgent })
  window.matchMedia = ((q: string) => ({ matches: standalone && q.includes('standalone'), addListener() {}, removeListener() {} })) as any
}

function render() {
  const c = document.createElement('div')
  act(() => { createRoot(c).render(createElement(InstallAppItem)) })
  return c
}

describe('InstallAppItem', () => {
  beforeEach(() => { mockCanInstall = false; mockInstall.mockClear() })

  it('shows an install button when the browser offers installation, and installs on tap', () => {
    setEnv(CHROME); mockCanInstall = true
    const c = render()
    const button = c.querySelector('button') as HTMLButtonElement
    expect(button.textContent).toContain('navigation.installApp')
    act(() => { button.click() })
    expect(mockInstall).toHaveBeenCalledTimes(1)
  })

  it('shows the Add-to-Home-Screen hint on iPhone (no install API there)', () => {
    setEnv(IPHONE)
    const c = render()
    expect(c.querySelector('button')).toBeNull()
    expect(c.textContent).toContain('navigation.installAppIos')
  })

  it('renders nothing when already installed', () => {
    setEnv(IPHONE, true); mockCanInstall = true
    expect(render().innerHTML).toBe('')
  })

  it('renders nothing on browsers that cannot install yet', () => {
    setEnv(CHROME)
    expect(render().innerHTML).toBe('')
  })
})
