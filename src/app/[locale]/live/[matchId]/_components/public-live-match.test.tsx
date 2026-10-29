import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicLiveMatch } from './public-live-match'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
jest.mock('@/hooks/use-realtime-match', () => ({ useRealtimeMatch: () => ({ connected: false, lastUpdate: null, error: 'socket closed', retryCount: 0 }) }))
jest.mock('@/components/shared/live-scoreboard', () => ({ LiveScoreboard: () => null }))
jest.mock('@/app/[locale]/(app)/matches/[id]/_components/match-stats', () => ({ MatchStatsComponentSimpleFixed: () => null }))
jest.mock('@/app/[locale]/(app)/matches/[id]/_components/point-by-point-view', () => ({ PointByPointView: () => null }))
jest.mock('@/app/[locale]/(app)/matches/live/[id]/_components/MatchTimerDisplay', () => ({ MatchTimerDisplay: () => null }))
jest.mock('@/components/ui/momentum-bar', () => ({ MomentumBar: () => null }))
jest.mock('@/components/ui/language-toggle', () => ({ LanguageToggle: () => <button aria-label="language" /> }))

const player = (id: string) => ({ $id: id, firstName: id, lastName: 'X', userId: 'u', isMainPlayer: false })
const match = {
  $id: 'm1', playerOne: player('a'), playerTwo: player('b'), status: 'In Progress' as const, matchDate: '2026-10-29T10:00:00.000Z',
  score: '{"sets":[],"games":[1,0],"points":[0,0]}', matchFormatParsed: { sets: 3, noAd: false, tiebreak: true, finalSetTiebreak: 'standard' },
  pointLog: [], tournamentName: 'Cibulka čtyřhra C5',
}

async function render() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<PublicLiveMatch match={match as never} />))
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

it('keeps the phone header to one row: title on the left, icon buttons on the right', async () => {
  const { container, cleanup } = await render()
  const header = container.querySelector('[data-live-header]') as HTMLElement
  expect(header.className).not.toContain('flex-wrap')
  expect(header.querySelector('.name-gradient, [data-tournament]')?.textContent).toBe('Cibulka čtyřhra C5')
  expect(header.querySelector('h1')?.textContent).toBe('match.liveTennis')
  // The lite-view link sits with the status badges, not squeezed between the buttons
  expect(header.querySelector('a[href$="/watch/m1"]')).toBeNull()
  expect(container.querySelector('a[href$="/watch/m1"]')).not.toBeNull()
  cleanup()
})

it('translates the connection error', async () => {
  const { container, cleanup } = await render()
  expect(container.textContent).toContain('common.connectionError')
  expect(container.textContent).not.toContain('Connection error:')
  cleanup()
})

it('shows why a match ended next to "Completed", like an interruption reason', async () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<PublicLiveMatch match={{ ...match, status: 'Completed', retirementReason: 'retired', winnerId: 'a' } as never} />))
  expect(container.textContent).toContain('match.completed — match.playerRetired')
  act(() => root.unmount())
  container.remove()
})
