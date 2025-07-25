/**
 * Format match score for display
 */
export function formatMatchScore(finalScore: string): string {
  // Handle different score formats
  if (!finalScore) return ''
  
  // If it's already formatted nicely, return as is
  if (finalScore.includes('-')) {
    return finalScore
  }
  
  // If it's a JSON string, parse and format
  try {
    const scoreData = JSON.parse(finalScore)
    if (scoreData.sets) {
      return scoreData.sets
        .map((set: { p1: number; p2: number }) => `${set.p1}-${set.p2}`)
        .join(' ')
    }
  } catch {
    // Not JSON, return as is
  }
  
  return finalScore
}