import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { SoundSettings } from './sound-settings'
import { Slider } from './slider'
import { soundManager } from '@/lib/sounds'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
// jsdom has no ResizeObserver; the Radix slider only uses it to measure the thumb
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver
jest.mock('@/lib/sounds', () => ({
  soundManager: { getSettings: jest.fn(), updateSettings: jest.fn() },
  playSound: jest.fn(),
}))

async function render(ui: React.ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(ui))
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

// Sounds start muted on a new device (a fresh PC); the volume slider used to be silently disabled there
it('lets the volume slider move while sounds are off, and turns sounds on', async () => {
  jest.mocked(soundManager.getSettings).mockReturnValue({ enabled: false, volume: 0.7, pointSounds: true, criticalPointSounds: true, matchEventSounds: true })
  const { container, cleanup } = await render(<SoundSettings />)
  const thumb = container.querySelector('[role="slider"]') as HTMLElement
  expect(thumb.hasAttribute('data-disabled')).toBe(false)
  await act(async () => { thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })) })
  expect(soundManager.updateSettings).toHaveBeenCalledWith(expect.objectContaining({ enabled: true, volume: 0.8 }))
  expect(container.querySelector('[role="switch"]')?.getAttribute('aria-checked')).toBe('true')
  cleanup()
})

it('dims a disabled slider so it does not look usable', async () => {
  const { container, cleanup } = await render(<Slider disabled value={[0.5]} max={1} step={0.1} />)
  expect(container.querySelector('[data-slot="slider"]')?.className).toContain('data-[disabled]:opacity-50')
  cleanup()
})
