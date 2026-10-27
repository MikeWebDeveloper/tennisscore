import type { Match } from '@/lib/types'

export function matchPerspective(match: Match, playerId: string): { opponents: string[]; isWin: boolean | null } {
  const teamOne = [match.playerOneId, match.playerThreeId].filter((id): id is string => Boolean(id))
  const teamTwo = [match.playerTwoId, match.playerFourId].filter((id): id is string => Boolean(id))
  const playerTeam = teamOne.includes(playerId) ? teamOne : teamTwo.includes(playerId) ? teamTwo : []
  const opponents = playerTeam === teamOne ? teamTwo : playerTeam === teamTwo ? teamOne : []
  const isWin = !match.winnerId || !playerTeam.length ? null : playerTeam.includes(match.winnerId) ? true : opponents.includes(match.winnerId) ? false : null
  return { opponents, isWin }
}
