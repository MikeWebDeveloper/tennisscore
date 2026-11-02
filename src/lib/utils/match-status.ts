export type MatchStatusKey = 'pending' | 'in-progress' | 'completed' | 'retired' | 'unfinished'

/** Matches are stored as "In Progress" / "Completed"; stats screens compare 'in-progress' / 'completed'. */
export function normalizeMatchStatus(status?: string | null): MatchStatusKey {
  const key = (status ?? '').trim().toLowerCase().replace(/[\s_]+/g, '-')
  if (key === 'completed' || key === 'in-progress' || key === 'retired') return key
  return 'pending'
}

interface StatusFields { status?: string | null; winnerId?: string | null; retirementReason?: string | null }

/**
 * Like normalizeMatchStatus, but an ended match without a result (stopped unfinished, or no
 * winner saved) is 'unfinished', so every "won ÷ completed" statistic leaves it out.
 */
export function matchStatusKey(match: StatusFields): MatchStatusKey {
  const key = normalizeMatchStatus(match.status)
  if (key === 'completed' && (match.retirementReason === 'unfinished' || !match.winnerId)) return 'unfinished'
  return key
}

export function withNormalizedStatus<T extends StatusFields>(match: T): T {
  return { ...match, status: matchStatusKey(match) }
}
