import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { StaleMatchesCard } from './stale-matches-card'
import { closeUnfinishedMatch } from '@/lib/actions/match-close'
import type { Match, Player } from '@/lib/types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh, push: jest.fn() }) }))
jest.mock('@/i18n', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => values ? `${key}(${Object.values(values).join(',')})` : key,
  useLocale: () => 'cs',
}))
jest.mock('@/i18n/navigation', () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }))
jest.mock('@/lib/actions/match-close', () => ({ closeUnfinishedMatch: jest.fn() }))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))
jest.mock('../../matches/[id]/_components/delete-match-button', () => ({ DeleteMatchButton: () => <button>delete</button> }))

const player = (id: string, firstName: string, lastName: string) => ({ $id: id, firstName, lastName }) as Player
const playersMap = new Map([player('me', 'Sofie', 'Látalová'), player('op', 'Eva', 'Nová')].map(p => [p.$id, p]))
const stale = [
  { $id: 'm1', status: 'in-progress', playerOneId: 'op', playerTwoId: 'me', matchDate: '2026-09-06', $updatedAt: '2026-09-06T10:34:50.000Z', score: JSON.stringify({ sets: [[6, 4]], games: [1, 2], points: [0, 0] }) },
] as Match[]

it('lists a stuck match from the main player’s side and saves it as unfinished', async () => {
  jest.mocked(closeUnfinishedMatch).mockResolvedValue({ success: true })
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<StaleMatchesCard matches={stale} mainPlayerId="me" playersMap={playersMap} />))

  expect(container.textContent).toContain('staleMatchesDescription(1)')
  expect(container.textContent).toContain('Nová Eva')
  // Sofie is player two: her side comes first, 4:6 2:1
  expect(container.textContent).toContain('4:6 2:1')
  expect(container.querySelector('a[href="/matches/live/m1"]')).not.toBeNull()

  const close = [...container.querySelectorAll('button')].find(b => b.textContent === 'staleMarkUnfinished')!
  await act(async () => close.click())
  expect(closeUnfinishedMatch).toHaveBeenCalledWith('m1')
  expect(mockRefresh).toHaveBeenCalled()
  expect(container.textContent).not.toContain('Nová Eva')
  act(() => root.unmount())
  container.remove()
})
