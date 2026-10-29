import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from 'sonner'
import { useNetworkStatus } from './use-network-status'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

function Probe() {
  useNetworkStatus()
  return null
}

it('announces connection changes in the page language', async () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  await act(async () => root.render(<Probe />))
  const onLine = jest.spyOn(navigator, 'onLine', 'get')
  onLine.mockReturnValue(false)
  act(() => { window.dispatchEvent(new Event('offline')) })
  expect(toast.error).toHaveBeenCalledWith('common.youAreOffline')
  onLine.mockReturnValue(true)
  act(() => { window.dispatchEvent(new Event('online')) })
  expect(toast.success).toHaveBeenCalledWith('common.backOnline')
  onLine.mockRestore()
  act(() => root.unmount())
})
