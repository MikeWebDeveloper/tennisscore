import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { TournamentsPanel } from './tournaments-panel'
import { getTournamentSummaries } from '@/lib/actions/tournaments'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
jest.mock('@/lib/actions/tournaments', () => ({ getTournamentSummaries: jest.fn() }))
jest.mock('@/i18n', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => values ? `${key}(${Object.values(values).join(',')})` : key,
  useLocale: () => 'cs',
}))

const summaries = [
  { key: 'mčr u12', name: 'MČR U12', from: '2026-03-14T09:00:00Z', to: '2026-03-15T15:00:00Z', matches: 3, wins: 1, losses: 1 },
  { key: 'zimní liga', name: 'Zimní liga', from: '2026-01-10T10:00:00Z', to: '2026-02-07T10:00:00Z', matches: 3, wins: 2, losses: 1 },
]

async function mount(onPick = jest.fn()) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<TournamentsPanel onPick={onPick} />))
  return { container, onPick, unmount: () => { act(() => root.unmount()); container.remove() } }
}

it('lists every tournament with its dates and record, and opens one on tap', async () => {
  jest.mocked(getTournamentSummaries).mockResolvedValue({ tournaments: summaries })
  const { container, onPick, unmount } = await mount()
  const buttons = container.querySelectorAll('button')
  expect(buttons).toHaveLength(2)
  expect(buttons[0].textContent).toContain('MČR U12')
  expect(buttons[0].textContent).toContain('tournamentRecord(3,1,1)')
  expect(buttons[1].textContent).toContain('tournamentDates(10. 1. 2026,7. 2. 2026)')
  act(() => buttons[1].click())
  expect(onPick).toHaveBeenCalledWith(summaries[1])
  unmount()
})

it('explains how to add a tournament when there is none', async () => {
  jest.mocked(getTournamentSummaries).mockResolvedValue({ tournaments: [] })
  const { container, unmount } = await mount()
  expect(container.textContent).toContain('noTournaments')
  unmount()
})
