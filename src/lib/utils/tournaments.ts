import type { Match } from '@/lib/types'
import { matchPerspective } from './match-perspective'
import { matchStatusKey } from './match-status'

type TournamentMatch = Pick<Match, '$id' | 'matchDate' | 'playerOneId' | 'playerTwoId'>
  & Partial<Pick<Match, 'tournamentName' | 'winnerId' | 'playerThreeId' | 'playerFourId' | 'retirementReason'>>
  & { status?: string }

export interface TournamentSummary {
  /** Lower-case trimmed name: "Zimní liga" and " zimní liga " are one tournament */
  key: string
  /** The name as written for its latest match */
  name: string
  from: string
  to: string
  matches: number
  wins: number
  losses: number
}

export const tournamentKey = (name?: string | null) => (name ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('cs')

/** The account's tournaments, newest first, with the main player's wins and losses (decided matches only) */
export function summarizeTournaments(matches: TournamentMatch[], mainPlayerId?: string): TournamentSummary[] {
  const byKey = new Map<string, TournamentSummary>()
  const named = matches.filter((match) => tournamentKey(match.tournamentName))
  for (const match of named.sort((a, b) => (a.matchDate ?? '').localeCompare(b.matchDate ?? ''))) {
    const key = tournamentKey(match.tournamentName)
    const summary = byKey.get(key) ?? { key, name: '', from: match.matchDate, to: match.matchDate, matches: 0, wins: 0, losses: 0 }
    summary.name = match.tournamentName!.trim()
    summary.to = match.matchDate
    summary.matches += 1
    if (mainPlayerId && matchStatusKey(match) === 'completed') {
      const { isWin } = matchPerspective(match as Match, mainPlayerId)
      if (isWin === true) summary.wins += 1
      if (isWin === false) summary.losses += 1
    }
    byKey.set(key, summary)
  }
  return [...byKey.values()].sort((a, b) => b.to.localeCompare(a.to))
}

export function matchesInTournament<T extends TournamentMatch>(matches: T[], key: string): T[] {
  return matches.filter((match) => tournamentKey(match.tournamentName) === key)
}
