jest.mock('@/lib/actions/matches', () => ({ updateMatchScore: jest.fn() }))

import { updateMatchScore } from '@/lib/actions/matches'
import { syncMatchScore, buildScorePayload } from './sync-match-score'

const mockUpdate = updateMatchScore as jest.Mock
const score = { sets: [], games: [0, 0], points: [0, 0], isTiebreak: false, tiebreakPoints: [0, 0] } as any

describe('buildScorePayload', () => {
  it('always carries the full score and point log', () => {
    const log = [{ id: '1' }] as any
    expect(buildScorePayload({ score, pointLog: log })).toEqual({ score, pointLog: log })
  })

  it('adds timing only when present and completion only for a finished match with a winner', () => {
    const base = { score, pointLog: [] as any, startTime: 's', endTime: 'e', setDurations: [1] }
    expect(buildScorePayload({ ...base, isMatchComplete: false, winnerId: 'w' })).toEqual({
      score, pointLog: [], startTime: 's', endTime: 'e', setDurations: [1],
    })
    expect(buildScorePayload({ ...base, isMatchComplete: true, winnerId: null })).not.toHaveProperty('status')
    expect(buildScorePayload({ ...base, isMatchComplete: true, winnerId: 'w' })).toMatchObject({
      status: 'Completed', winnerId: 'w',
    })
    expect(buildScorePayload({ score, pointLog: [], startTime: null })).not.toHaveProperty('startTime')
  })
})

describe('syncMatchScore retry', () => {
  beforeEach(() => { jest.useFakeTimers(); mockUpdate.mockReset() })
  afterEach(() => jest.useRealTimers())

  it('retries after a failure and resolves once the server accepts', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({})
    const p = syncMatchScore('m1', { score, pointLog: [] } as any)
    await jest.advanceTimersByTimeAsync(500)
    await expect(p).resolves.toBeUndefined()
    expect(mockUpdate).toHaveBeenCalledTimes(2)
  })

  it('treats a returned { error } as a failure and throws after the final attempt', async () => {
    mockUpdate.mockResolvedValue({ error: 'denied' })
    const p = syncMatchScore('m1', { score, pointLog: [] } as any, 2)
    const assertion = expect(p).rejects.toThrow('denied')
    await jest.advanceTimersByTimeAsync(500)
    await assertion
    expect(mockUpdate).toHaveBeenCalledTimes(2)
  })
})
