import { calculateDetailedMatchStats } from './match-stats'
import type { PointDetail } from '@/lib/types'

const ace = (servePlacement: PointDetail['servePlacement'], n: number) => ({
  id: String(n), timestamp: '2026-10-29T10:00:00.000Z', pointNumber: n, setNumber: 1, gameNumber: 1, gameScore: '0-0',
  winner: 'p1', server: 'p1', serveType: 'first', serveOutcome: 'ace', servePlacement, rallyLength: 1,
  pointOutcome: 'ace', lastShotType: 'serve', lastShotPlayer: 'p1',
  isBreakPoint: false, isSetPoint: false, isMatchPoint: false, isGameWinning: false, isSetWinning: false, isMatchWinning: false,
}) as unknown as PointDetail

it('counts a net-cord ace in the serve placement statistics instead of crashing', () => {
  const stats = calculateDetailedMatchStats([ace('net-cord', 1), ace('t', 2)])
  expect(stats.serveDirectionStats.playerOne['net-cord'].aces).toBe(1)
  expect(stats.serveDirectionStats.playerOne.t.aces).toBe(1)
  expect(stats.serveDirectionStats.playerOne.totalAttempts).toBe(2)
})
