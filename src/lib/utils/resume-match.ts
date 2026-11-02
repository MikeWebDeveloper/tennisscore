import type { Match } from '@/lib/types'

/** An in-progress match untouched for longer than this is offered for clean-up instead of resuming */
export const STALE_AFTER_DAYS = 7

/** The last time the match was saved (every point updates it), else when it was played */
export function lastActivity(match: Match): number {
  return Date.parse(match.$updatedAt || match.matchDate || match.$createdAt) || 0
}

function isStale(match: Match, now: number) {
  return now - lastActivity(match) > STALE_AFTER_DAYS * 86_400_000
}

export function findResumeMatch(matches: Match[], now = Date.now()): Match | null {
  return matches.reduce<Match | null>((latest, match) => {
    if (match.status !== 'in-progress' || isStale(match, now)) return latest
    if (!latest) return match
    const time = Date.parse(match.matchDate || match.$createdAt) || 0
    const latestTime = Date.parse(latest.matchDate || latest.$createdAt) || 0
    return time > latestTime ? match : latest
  }, null)
}

/** In-progress matches nobody has scored for a week, most recently touched first */
export function findStaleMatches(matches: Match[], now = Date.now()): Match[] {
  return matches
    .filter(match => match.status === 'in-progress' && isStale(match, now))
    .sort((a, b) => lastActivity(b) - lastActivity(a))
}
