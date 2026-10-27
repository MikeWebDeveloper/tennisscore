export type MatchStatusKey = 'pending' | 'in-progress' | 'completed' | 'retired'

/** Matches are stored as "In Progress" / "Completed"; stats screens compare 'in-progress' / 'completed'. */
export function normalizeMatchStatus(status?: string | null): MatchStatusKey {
  const key = (status ?? '').trim().toLowerCase().replace(/[\s_]+/g, '-')
  if (key === 'completed' || key === 'in-progress' || key === 'retired') return key
  return 'pending'
}

export function withNormalizedStatus<T extends { status?: string }>(match: T): T {
  return { ...match, status: normalizeMatchStatus(match.status) }
}
