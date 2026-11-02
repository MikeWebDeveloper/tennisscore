import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { LinkQrCode } from './link-qr-code'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
// jsdom has no canvas for the encoder's browser build; the real drawing is checked in the browser test
const mockToDataURL = jest.fn(async () => 'data:image/png;base64,QR')
jest.mock('qrcode', () => ({ toDataURL: (...args: unknown[]) => mockToDataURL(...(args as [])) }))

it('draws a scannable code for the watch link, dark on white in every theme', async () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<LinkQrCode url="https://tenis.click/live/m1" label="Naskenujte a sledujte zápas živě" />))
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 50)) })
  const image = container.querySelector('img')
  expect(image?.getAttribute('alt')).toBe('Naskenujte a sledujte zápas živě')
  expect(image?.getAttribute('src')).toBe('data:image/png;base64,QR')
  expect(mockToDataURL).toHaveBeenCalledWith('https://tenis.click/live/m1', expect.objectContaining({ color: { dark: '#000000', light: '#ffffff' } }))
  expect(container.firstElementChild?.className).toContain('bg-white')
  act(() => root.unmount())
  container.remove()
})
