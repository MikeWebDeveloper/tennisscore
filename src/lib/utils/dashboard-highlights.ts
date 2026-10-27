import type { Match } from '@/lib/types'

export function getDashboardHighlights(matches: Match[], playerId: string, now = new Date()) {
  const completed = matches.filter(match => !match.isDoubles && match.status === 'completed')
    .sort((a, b) => Date.parse(b.matchDate || b.$createdAt) - Date.parse(a.matchDate || a.$createdAt))
  const thisMonth = completed.filter(match => {
    const date = new Date(match.matchDate || match.$createdAt)
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length
  let winStreak = 0
  for (const match of completed) {
    if (match.winnerId !== playerId) break
    winStreak++
  }
  return { thisMonth, winStreak }
}
