import type { Match } from '@/lib/types'
import { buildMatchInsights, type InsightPoint } from './match-insights'
import { normalizeMatchFormat } from './match-format'
import { matchPerspective } from './match-perspective'
import { matchStatusKey } from './match-status'

type Side = 'p1' | 'p2'
type ProfileMatch = Pick<Match, '$id' | 'matchDate' | 'playerOneId' | 'playerTwoId'>
  & Partial<Pick<Match, 'playerThreeId' | 'playerFourId' | 'winnerId' | 'retirementReason' | 'matchFormat' | 'detailLevel' | 'pointLog'>>
  & { status?: string }

const sideOf = (match: ProfileMatch, playerId: string): Side | null =>
  [match.playerOneId, match.playerThreeId].includes(playerId) ? 'p1'
    : [match.playerTwoId, match.playerFourId].includes(playerId) ? 'p2' : null

/** The main player's record against this player: decided meetings counted, every meeting listed, newest first */
export function headToHead<T extends ProfileMatch>(matches: T[], playerId: string, mainPlayerId: string) {
  const meetings = matches
    .filter((match) => { const a = sideOf(match, playerId); const b = sideOf(match, mainPlayerId); return a && b && a !== b })
    .sort((a, b) => b.matchDate.localeCompare(a.matchDate))
  let wins = 0
  let losses = 0
  for (const match of meetings) {
    if (matchStatusKey(match) !== 'completed') continue
    const { isWin } = matchPerspective(match as unknown as Match, mainPlayerId)
    if (isWin === true) wins++
    if (isWin === false) losses++
  }
  return { wins, losses, matches: meetings }
}

export interface ProgressRow {
  /** "2026-03" */
  month: string
  matches: number
  wins: number
  losses: number
  pointsWon: number
  pointsPlayed: number
  serviceGames: number
  serviceGamesHeld: number
  returnGames: number
  breaks: number
  breakPointsFaced: number
  breakPointsSaved: number
  breakPointChances: number
  breakPointsWon: number
}

const parsePoints = (log: string[] | undefined): InsightPoint[] =>
  (log ?? []).flatMap((point) => { try { return [JSON.parse(point) as InsightPoint] } catch { return [] } })

/**
 * Month by month from the point logs, using only what every level records (who served and who won
 * each point), so simple-level matches count fully; newest month first, raw counts kept for every share
 */
export function playerProgress(matches: ProfileMatch[], playerId: string): ProgressRow[] {
  const rows = new Map<string, ProgressRow>()
  for (const match of matches) {
    const side = sideOf(match, playerId)
    const points = parsePoints(match.pointLog as unknown as string[])
    if (!side || points.length === 0) continue
    const other: Side = side === 'p1' ? 'p2' : 'p1'
    const { totals } = buildMatchInsights(points, { format: normalizeMatchFormat(match.matchFormat ?? '{}'), detailLevel: match.detailLevel ?? undefined })
    const month = match.matchDate.slice(0, 7)
    const row = rows.get(month) ?? { month, matches: 0, wins: 0, losses: 0, pointsWon: 0, pointsPlayed: 0, serviceGames: 0, serviceGamesHeld: 0, returnGames: 0, breaks: 0, breakPointsFaced: 0, breakPointsSaved: 0, breakPointChances: 0, breakPointsWon: 0 }
    const mine = totals[side]
    const theirs = totals[other]
    row.matches += 1
    if (matchStatusKey(match) === 'completed') {
      const { isWin } = matchPerspective(match as unknown as Match, playerId)
      if (isWin === true) row.wins += 1
      if (isWin === false) row.losses += 1
    }
    row.pointsWon += mine.points
    row.pointsPlayed += mine.points + theirs.points
    row.serviceGames += mine.serviceGames
    row.serviceGamesHeld += mine.serviceGamesHeld
    row.returnGames += theirs.serviceGames
    row.breaks += theirs.serviceGames - theirs.serviceGamesHeld
    row.breakPointsFaced += mine.breakPointsFaced
    row.breakPointsSaved += mine.breakPointsSaved
    row.breakPointChances += mine.breakPointChances
    row.breakPointsWon += mine.breakPointsWon
    rows.set(month, row)
  }
  return [...rows.values()].sort((a, b) => b.month.localeCompare(a.month))
}
