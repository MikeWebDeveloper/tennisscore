import { matchPerspective } from './match-perspective'
import type { Match } from '@/lib/types'

const doubles = { playerOneId: 'one', playerTwoId: 'two', playerThreeId: 'three', playerFourId: 'four', winnerId: 'one' } as Match

it('recognizes a doubles partner win and finds both opponents', () => {
  expect(matchPerspective(doubles, 'three')).toEqual({ opponents: ['two', 'four'], isWin: true })
  expect(matchPerspective(doubles, 'four')).toEqual({ opponents: ['one', 'three'], isWin: false })
})

it('handles singles and unknown winners', () => {
  expect(matchPerspective({ playerOneId: 'one', playerTwoId: 'two' } as Match, 'one')).toEqual({ opponents: ['two'], isWin: null })
})
