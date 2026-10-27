import type { Match } from '@/lib/types'

export function findResumeMatch(matches: Match[]): Match | null {
  return matches.reduce<Match | null>((latest, match) => {
    if (match.status !== 'in-progress') return latest
    if (!latest) return match
    const time = Date.parse(match.matchDate || match.$createdAt) || 0
    const latestTime = Date.parse(latest.matchDate || latest.$createdAt) || 0
    return time > latestTime ? match : latest
  }, null)
}
