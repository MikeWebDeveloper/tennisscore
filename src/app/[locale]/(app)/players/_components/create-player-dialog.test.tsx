import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { CreatePlayerDialog } from './create-player-dialog'
import { createPlayer } from '@/lib/actions/players'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }))
jest.mock('@/i18n', () => ({ useTranslations: () => (key: string) => key }))
jest.mock('@/lib/actions/players', () => ({ createPlayer: jest.fn() }))
jest.mock('@/components/ui/checkbox', () => ({ Checkbox: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input type="checkbox" {...props} /> }))
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}))

beforeEach(() => { jest.mocked(createPlayer).mockReset(); mockRefresh.mockReset() })

it('shows a localized failure and allows a successful retry', async () => {
  jest.mocked(createPlayer).mockResolvedValueOnce({ error: 'failed' }).mockResolvedValueOnce({ success: true })
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const onOpenChange = jest.fn()
  const onCreated = jest.fn()
  act(() => root.render(<CreatePlayerDialog isOpen onOpenChange={onOpenChange} onCreated={onCreated} />))
  const form = container.querySelector('form')!
  await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })
  expect(container.querySelector('[role="alert"]')?.textContent).toBe('createPlayerError')
  expect(onOpenChange).not.toHaveBeenCalled()
  expect(mockRefresh).not.toHaveBeenCalled()
  await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })
  expect(onOpenChange).toHaveBeenCalledWith(false)
  expect(onCreated).toHaveBeenCalledTimes(1)
  expect(mockRefresh).toHaveBeenCalledTimes(1)
  act(() => root.unmount())
  container.remove()
})

it('blocks duplicate submissions while a save is pending', async () => {
  let resolve!: (result: { success: boolean }) => void
  jest.mocked(createPlayer).mockImplementation(() => new Promise(r => { resolve = r }))
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(<CreatePlayerDialog isOpen onOpenChange={jest.fn()} />))
  const form = container.querySelector('form')!
  act(() => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
  expect(createPlayer).toHaveBeenCalledTimes(1)
  expect(container.querySelector('button[type="submit"]')?.hasAttribute('disabled')).toBe(true)
  await act(async () => { resolve({ success: true }) })
  act(() => root.unmount())
  container.remove()
})

it('explains an existing main player without closing or discarding the form', async () => {
  jest.mocked(createPlayer).mockResolvedValue({ error: 'MAIN_PLAYER_EXISTS' })
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const onOpenChange = jest.fn()
  act(() => root.render(<CreatePlayerDialog isOpen onOpenChange={onOpenChange} />))
  const firstName = container.querySelector('input[name="firstName"]') as HTMLInputElement
  firstName.value = 'Alex'
  await act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })
  expect(container.querySelector('[role="alert"]')?.textContent).toBe('mainPlayerAlreadyExists')
  expect(firstName.value).toBe('Alex')
  expect(onOpenChange).not.toHaveBeenCalled()
  expect(mockRefresh).not.toHaveBeenCalled()
  act(() => root.unmount())
  container.remove()
})
