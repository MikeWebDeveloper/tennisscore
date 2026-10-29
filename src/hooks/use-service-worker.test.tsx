import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from 'sonner'
import { useServiceWorker } from './use-service-worker'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
jest.mock('sonner', () => ({ toast: { success: jest.fn(), info: jest.fn() } }))

function Probe() {
  useServiceWorker()
  return null
}

it('announces offline support in the page language on first install', async () => {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { controller: null, register: jest.fn().mockResolvedValue({ addEventListener: jest.fn() }), addEventListener: jest.fn(), removeEventListener: jest.fn() },
  })
  const container = document.createElement('div')
  const root = createRoot(container)
  await act(async () => root.render(<Probe />))
  expect(toast.success).toHaveBeenCalledWith('common.offlineReady')
  act(() => root.unmount())
})
