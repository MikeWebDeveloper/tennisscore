/** @jest-environment node */
import { renderToStaticMarkup } from 'react-dom/server'
import { PlayerRatingDisplay, formatPlayerRating } from './player-rating-display'
import type { Player } from '@/lib/types'

it('labels both numbers: "12 BH • 260 CŽ"', () => {
  const player = { bhRating: '12', czRanking: 260 } as Player
  expect(formatPlayerRating(player)).toBe('12 BH • 260 CŽ')
  const html = renderToStaticMarkup(<PlayerRatingDisplay player={player} />)
  expect(html).toContain('12 BH')
  expect(html).toContain('260 CŽ')
})

it('labels a BH rating on its own, which used to show as a bare number', () => {
  expect(formatPlayerRating({ bhRating: '30' } as Player)).toBe('30 BH')
  expect(formatPlayerRating({ czRanking: 44 } as Player)).toBe('44 CŽ')
})

it('normalises an older "20BH" value and reads BH from the legacy combined field', () => {
  expect(formatPlayerRating({ bhRating: '20BH' } as Player)).toBe('20 BH')
  const legacy = { rating: '12BH CŽ 47', czRanking: 47 } as Player
  expect(formatPlayerRating(legacy)).toBe('12 BH • 47 CŽ')
  expect(renderToStaticMarkup(<PlayerRatingDisplay player={legacy} />)).toContain('12 BH')
})

it('prefers an explicit BH rating over an older combined value', () => {
  const player = { rating: '12BH CŽ 47', bhRating: '15BH', czRanking: 47 } as Player
  expect(formatPlayerRating(player)).toBe('15 BH • 47 CŽ')
})
