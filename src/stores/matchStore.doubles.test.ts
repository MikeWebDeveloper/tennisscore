jest.unmock('@/stores/matchStore')

import { useMatchStore, normalizePointDetail } from './matchStore'

const baseMatch = {
  $id: 'm1',
  playerOneId: 'a', playerTwoId: 'b', playerThreeId: 'c', playerFourId: 'd',
  isDoubles: true,
  matchFormat: { sets: 3, noAd: false, tiebreak: true, finalSetTiebreak: 'standard' },
  score: { sets: [], games: [0, 0], points: [0, 0], isTiebreak: false, tiebreakPoints: [0, 0] },
  pointLog: [],
  status: 'in-progress',
} as any

describe('doubles serverPlayer in the match store', () => {
  beforeEach(() => {
    useMatchStore.getState().resetMatch()
    useMatchStore.getState().initializeMatch(baseMatch)
    useMatchStore.getState().setServer('p1')
  })

  it('keeps the recorded serverPlayer on the logged point', () => {
    const { pointDetail } = useMatchStore.getState().awardPoint('p1', { serverPlayer: 'p3' })
    expect(pointDetail.serverPlayer).toBe('p3')
    expect(useMatchStore.getState().pointLog[0].serverPlayer).toBe('p3')
    // The team-level server is unchanged
    expect(useMatchStore.getState().pointLog[0].server).toBe('p1')
  })

  it('survives a reload (initializeMatch normalizes the stored log)', () => {
    const { pointDetail } = useMatchStore.getState().awardPoint('p2', { serverPlayer: 'p4' })
    const stored = JSON.parse(JSON.stringify(pointDetail))
    useMatchStore.getState().resetMatch()
    useMatchStore.getState().initializeMatch({ ...baseMatch, pointLog: [stored] })
    expect(useMatchStore.getState().pointLog[0].serverPlayer).toBe('p4')
  })

  it('leaves singles points without a serverPlayer', () => {
    const { pointDetail } = useMatchStore.getState().awardPoint('p1', {})
    expect(pointDetail.serverPlayer).toBeUndefined()
    expect(normalizePointDetail({ winner: 'p1', server: 'p1' }).serverPlayer).toBeUndefined()
  })
})
