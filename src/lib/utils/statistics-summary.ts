import { parseDbScore } from "@/lib/utils/db-score"

/** Composite scores (dominance, pressure, mental toughness) and pattern insights need this many finished matches. */
export const MIN_MATCHES_FOR_SCORES = 5

export function remainingForScores(completedMatches: number): number {
  return Math.max(0, MIN_MATCHES_FOR_SCORES - completedMatches)
}

/** "22 s", "45 min", "1 h 5 min" in the page language; empty when there is nothing meaningful to show. */
export function formatMatchDuration(minutes: number, locale: string): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return ""
  const unit = (value: number, name: "second" | "minute" | "hour") =>
    new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: "short" }).format(value)
  const totalSeconds = Math.round(minutes * 60)
  if (totalSeconds < 60) return unit(totalSeconds, "second")
  const totalMinutes = Math.round(minutes)
  if (totalMinutes < 60) return unit(totalMinutes, "minute")
  const hours = Math.floor(totalMinutes / 60)
  const rest = totalMinutes % 60
  return rest === 0 ? unit(hours, "hour") : `${unit(hours, "hour")} ${unit(rest, "minute")}`
}

interface ShareMatch {
  status?: string
  playerOneId: string
  playerTwoId: string
  playerThreeId?: string
  playerFourId?: string
  score?: string
  pointLog?: string[]
}

export interface Share { won: number; total: number }

/** Games and sets from saved set scores, points from point logs; completed matches only, seen from the main player's side. */
export function summarizeWonShares(matches: ShareMatch[], playerId: string): { points: Share; games: Share; sets: Share } {
  const points = { won: 0, total: 0 }
  const games = { won: 0, total: 0 }
  const sets = { won: 0, total: 0 }

  for (const match of matches) {
    if (match.status?.toLowerCase() !== "completed") continue
    const side = match.playerOneId === playerId || match.playerThreeId === playerId ? 0
      : match.playerTwoId === playerId || match.playerFourId === playerId ? 1 : null
    if (side === null) continue

    for (const [p1, p2] of parseDbScore(match.score).sets) {
      const mine = side === 0 ? p1 : p2
      const theirs = side === 0 ? p2 : p1
      games.won += mine
      games.total += mine + theirs
      if (mine !== theirs) {
        sets.total++
        if (mine > theirs) sets.won++
      }
    }

    const sideKey = side === 0 ? "p1" : "p2"
    for (const raw of match.pointLog ?? []) {
      try {
        const winner = (JSON.parse(raw) as { winner?: string }).winner
        if (winner !== "p1" && winner !== "p2") continue
        points.total++
        if (winner === sideKey) points.won++
      } catch {
        // Skip unreadable point entries rather than failing the whole summary
      }
    }
  }

  return { points, games, sets }
}

export const sharePct = (share: Share) => share.total > 0 ? Math.round((share.won / share.total) * 100) : 0
