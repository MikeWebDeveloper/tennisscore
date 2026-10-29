import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { PlayerCard } from './player-card'
import type { Player } from '@/lib/types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

it('shows year, rating and club in the live scoreboard colours', async () => {
  const player = { $id: 'p', firstName: 'God', lastName: 'Mike', userId: 'u', isMainPlayer: true, yearOfBirth: 1980, bhRating: '20', club: 'FK Tennis Litoměřice', playingHand: 'right' } as Player
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<PlayerCard player={player} onEdit={jest.fn()} onDelete={jest.fn()} />))
  expect(container.querySelector('[data-player-meta]')?.textContent).toBe('1980 (20 BH)FK Tennis Litoměřice')
  expect(container.textContent).toContain('common.rightHanded')
  act(() => root.unmount())
  container.remove()
})
