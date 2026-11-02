import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, features } from '@/lib/framer-motion-config'
import { CompactMatchWizard } from './compact-match-wizard'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))
jest.mock('@/i18n/navigation', () => ({ Link: ({ children }: any) => <div>{children}</div> }))
jest.mock('@/lib/actions/matches', () => ({ createMatch: jest.fn() }))
jest.mock('./compact-steps/compact-match-type-step', () => ({ CompactMatchTypeStep: ({ onComplete }: any) => <button onClick={onComplete}>Choose type</button> }))
jest.mock('./compact-steps/compact-players-step', () => ({ CompactPlayersStep: ({ playerOne, onPlayerChange, onComplete }: any) => <div><span>Player: {playerOne}</span><button onClick={() => onPlayerChange('one', 'alice')}>Choose player</button><button onClick={onComplete}>Continue players</button></div> }))
jest.mock('./compact-steps/compact-tournament-step', () => ({ CompactTournamentStep: ({ onComplete }: any) => <div>Tournament step<button onClick={onComplete}>Continue tournament</button></div> }))
jest.mock('./compact-steps/compact-detail-step', () => ({ CompactDetailStep: () => <div>Detail step</div> }))
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

it('goes back immediately to editable player selections retained from the previous visit', () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  act(() => root.render(createElement(LazyMotion, { features }, createElement(CompactMatchWizard, { players: [] }))))
  const click = (text: string) => {
    const button = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.trim() === text)!
    act(() => button.click())
  }
  click('Choose type')
  click('Choose player')
  click('Continue players')
  expect(container.textContent).toContain('Tournament step')
  click('common.back')
  expect(container.textContent).toContain('Player: alice')
  act(() => root.unmount())
})

it('returns to completed format choices and allows changes before continuing', () => {
  jest.useFakeTimers()
  const container = document.createElement('div')
  const root = createRoot(container)
  act(() => root.render(createElement(LazyMotion, { features }, createElement(CompactMatchWizard, { players: [] }))))
  const button = (text: string) => Array.from(container.querySelectorAll('button')).find(b => b.textContent?.trim() === text)!
  const click = (text: string) => act(() => button(text).click())
  click('Choose type')
  click('Continue players')
  click('Continue tournament')
  click('common.setFormatFast4')
  click('common.bestOf3')
  click('common.fullSet')
  click('common.continue')
  expect(container.textContent).toContain('Detail step')
  click('common.back')
  act(() => jest.advanceTimersByTime(1000))
  expect(button('common.setFormatFast4').getAttribute('aria-pressed')).toBe('true')
  click('common.setFormatPro')
  expect(button('common.setFormatPro').getAttribute('aria-pressed')).toBe('true')
  act(() => jest.advanceTimersByTime(1000))
  expect(container.textContent).not.toContain('Detail step')
  click('common.continue')
  expect(container.textContent).toContain('Detail step')
  act(() => root.unmount())
  jest.useRealTimers()
})

const preset = {
  matchType: 'singles', players: { one: 'me', two: 'eva', three: '', four: '' }, anonymous: { one: false, two: false, three: false, four: false },
  tournamentName: 'Zimní liga', sets: 3, setFormat: 'standard', scoring: 'no-ad', finalSet: 'super-tb', serveOrder: { p1: 'p1', p2: 'p2' }, detailLevel: 'simple', customCategories: [],
} as const

it('opens a rematch on a summary and starts it with one tap', async () => {
  const { createMatch } = jest.requireMock('@/lib/actions/matches') as { createMatch: jest.Mock }
  createMatch.mockResolvedValue({ matchId: 'new1' })
  const container = document.createElement('div')
  const root = createRoot(container)
  const players = [{ $id: 'me', firstName: 'Sofie', lastName: 'Látalová' }, { $id: 'eva', firstName: 'Eva', lastName: 'Nová' }] as never
  act(() => root.render(createElement(LazyMotion, { features }, createElement(CompactMatchWizard, { players, rematch: preset as never }))))
  expect(container.textContent).toContain('common.rematchTitle')
  expect(container.textContent).toContain('Látalová Sofie')
  expect(container.textContent).toContain('Nová Eva')
  const start = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.trim() === 'common.startMatch')!
  await act(async () => start.click())
  expect(createMatch).toHaveBeenCalledWith(expect.objectContaining({
    playerOneId: 'me', playerTwoId: 'eva', tournamentName: 'Zimní liga',
    matchFormat: expect.objectContaining({ sets: 3, noAd: true, finalSetTiebreak: 'super', detailLevel: 'simple' }),
  }))
  act(() => root.unmount())
})

it('fills the rules of the last match with one tap on the format step', () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  act(() => root.render(createElement(LazyMotion, { features }, createElement(CompactMatchWizard, { players: [], lastPreset: preset as never }))))
  const click = (text: string) => act(() => Array.from(container.querySelectorAll('button')).find(b => b.textContent?.trim().startsWith(text))!.click())
  click('Choose type')
  click('Continue players')
  click('Continue tournament')
  click('common.sameAsLastTime')
  expect(container.textContent).toContain('Detail step')
  act(() => root.unmount())
})

it('opens with both players filled in when started from a player profile', () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  act(() => root.render(createElement(LazyMotion, { features }, createElement(CompactMatchWizard, { players: [], startWith: { one: 'me', two: 'eva' } }))))
  act(() => Array.from(container.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Choose type')!.click())
  expect(container.textContent).toContain('Player: me')
  act(() => root.unmount())
})
