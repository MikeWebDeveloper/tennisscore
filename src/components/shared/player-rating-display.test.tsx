/** @jest-environment node */
import { renderToStaticMarkup } from 'react-dom/server'
import { PlayerRatingDisplay, formatPlayerRating } from './player-rating-display'
import type { Player } from '@/lib/types'

it('shows a legacy BH value alongside the separate Czech ranking', () => {
  const player = { rating: '12BH CŽ 47', czRanking: 47 } as Player
  expect(renderToStaticMarkup(<PlayerRatingDisplay player={player} />)).toContain('12BH')
  expect(formatPlayerRating(player)).toBe('12BH CŽ 47')
})

it('prefers an explicit BH rating over an older combined value', () => {
  const player = { rating: '12BH CŽ 47', bhRating: '15BH', czRanking: 47 } as Player
  expect(formatPlayerRating(player)).toBe('15BH CŽ 47')
})
