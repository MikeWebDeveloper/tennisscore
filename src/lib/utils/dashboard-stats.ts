import { Match, PointDetail } from "@/lib/types"
import { aggregatePlayerStatsAcrossMatches, calculatePlayerWinStreak } from "./match-stats"

export interface EnhancedStats {
  // Basic Performance
  totalMatchesWon: number
  winRate: number
  totalMatches: number
  currentWinStreak: number
  
  // Serve Performance
  totalAces: number
  firstServePercentage: number
  servicePointsWon: number
  totalDoubleFaults: number
  
  // Return Performance
  breakPointsConverted: number
  returnPointsWon: number
  breakPointsSaved: number
  firstReturnWinPercentage: number
  breakPointsFaced: number
  breakPointConversionRate: number
  
  // Shot Making
  totalWinners: number
  totalUnforcedErrors: number
  netPointsWon: number
  forehandBackhandRatio: number
  winnersPerMatch: number
  winnerToErrorRatio: number
  netPointsWonPercentage: number
  
  // Return Game Stats
  firstReturnPercentage: number
  
  // Additional contextual stats
  averageMatchDuration: string
  longestWinStreak: number
  thisMonthMatches: number
  secondServePointsWonPercentage: number
  totalForcedErrors: number
  
  // Performance Insights
  recentForm: number
  bestTimeOfDay: string | null
  totalPlayingTime: string
}

// Helper function to calculate matches in current month
export function calculateThisMonthMatches(matches: Match[]): number {
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  
  return matches.filter(match => {
    const matchDate = new Date(match.matchDate)
    return matchDate.getMonth() === thisMonth && 
           matchDate.getFullYear() === thisYear &&
           match.status === 'completed'
  }).length
}

// Helper function to calculate average match duration
export function calculateAverageMatchDuration(matches: Match[]): string {
  const completedMatches = matches.filter(match => 
    match.status === 'completed' && 
    match.startTime && 
    match.endTime
  )
  
  if (completedMatches.length === 0) return "0m"
  
  const totalDurationMs = completedMatches.reduce((total, match) => {
    const start = new Date(match.startTime!).getTime()
    const end = new Date(match.endTime!).getTime()
    return total + (end - start)
  }, 0)
  
  const averageDurationMs = totalDurationMs / completedMatches.length
  const averageDurationMinutes = Math.round(averageDurationMs / (1000 * 60))
  
  if (averageDurationMinutes >= 60) {
    const hours = Math.floor(averageDurationMinutes / 60)
    const minutes = averageDurationMinutes % 60
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
  }
  
  return `${averageDurationMinutes}m`
}

// Helper function to calculate forehand/backhand ratio
export function calculateForehandBackhandRatio(matches: Match[], mainPlayerId: string): number {
  let forehandShots = 0
  let backhandShots = 0
  
  matches.forEach(match => {
    if (match.pointLog && match.pointLog.length > 0) {
      match.pointLog.forEach(pointStr => {
        try {
          const point = JSON.parse(pointStr) as PointDetail
          // Only count shots by the main player
          const isMainPlayerPoint = (
            (match.playerOneId === mainPlayerId && point.lastShotPlayer === 'p1') ||
            (match.playerTwoId === mainPlayerId && point.lastShotPlayer === 'p2')
          )
          
          if (isMainPlayerPoint && point.lastShotType) {
            switch (point.lastShotType) {
              case 'forehand':
                forehandShots++
                break
              case 'backhand':
                backhandShots++
                break
              // Don't count serves, volleys, overheads in this ratio
            }
          }
        } catch {
          // Skip invalid JSON points
        }
      })
    }
  })
  
  const totalGroundstrokes = forehandShots + backhandShots
  if (totalGroundstrokes === 0) return 0
  
  return forehandShots / totalGroundstrokes
}

// Helper function to calculate total playing time
export function calculateTotalPlayingTime(matches: Match[]): string {
  const totalMs = matches
    .filter(m => m.startTime && m.endTime)
    .reduce((total, match) => {
      const start = new Date(match.startTime!).getTime()
      const end = new Date(match.endTime!).getTime()
      return total + (end - start)
    }, 0)
  
  const totalHours = Math.round(totalMs / (1000 * 60 * 60))
  if (totalHours >= 24) {
    const days = Math.floor(totalHours / 24)
    const hours = totalHours % 24
    return hours === 0 ? `${days}d` : `${days}d ${hours}h`
  }
  return `${totalHours}h`
}

// Calculate performance insights
export function calculatePerformanceInsights(matches: Match[], mainPlayerId: string) {
  const completedMatches = matches.filter(m => m.status === 'completed')
  
  // Calculate recent form (last 5 matches)
  const recentMatches = completedMatches
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
    .slice(0, 5)
  const recentWins = recentMatches.filter(m => m.winnerId === mainPlayerId).length
  const recentForm = recentMatches.length > 0 ? (recentWins / recentMatches.length) * 100 : 0
  
  // Calculate best time of day (if we have enough data)
  const matchTimes = completedMatches
    .filter(m => m.startTime)
    .map(m => ({
      hour: new Date(m.startTime!).getHours(),
      won: m.winnerId === mainPlayerId
    }))
  
  let bestTimeOfDay = null
  if (matchTimes.length >= 3) {
    const timeSlots = matchTimes.reduce((acc, match) => {
      const slot = Math.floor(match.hour / 4) // Group into 6-hour slots
      if (!acc[slot]) acc[slot] = { total: 0, wins: 0 }
      acc[slot].total++
      if (match.won) acc[slot].wins++
      return acc
    }, {} as Record<number, { total: number; wins: number }>)
    
    let bestSlot = 0
    let bestWinRate = 0
    Object.entries(timeSlots).forEach(([slot, data]) => {
      const winRate = data.total >= 2 ? data.wins / data.total : 0
      if (winRate > bestWinRate && data.total >= 2) {
        bestWinRate = winRate
        bestSlot = parseInt(slot)
      }
    })
    
    const timeLabels = ['Early Morning', 'Morning', 'Afternoon', 'Evening', 'Night', 'Late Night']
    bestTimeOfDay = timeLabels[bestSlot]
  }
  
  return {
    recentForm,
    bestTimeOfDay,
    totalPlayingTime: calculateTotalPlayingTime(completedMatches)
  }
}

// Enhanced statistics calculation from real match data
export function calculateEnhancedStats(matches: Match[], mainPlayerId: string | undefined): EnhancedStats {
  if (!mainPlayerId || matches.length === 0) {
    return {
      // Basic Performance
      totalMatchesWon: 0,
      winRate: 0,
      totalMatches: 0,
      currentWinStreak: 0,
      
      // Serve Performance
      totalAces: 0,
      firstServePercentage: 0,
      servicePointsWon: 0,
      totalDoubleFaults: 0,
      
      // Return Performance  
      breakPointsConverted: 0,
      returnPointsWon: 0,
      breakPointsSaved: 0,
      firstReturnWinPercentage: 0,
      breakPointsFaced: 0,
      breakPointConversionRate: 0,
      
      // Shot Making
      totalWinners: 0,
      totalUnforcedErrors: 0,
      netPointsWon: 0,
      forehandBackhandRatio: 0,
      winnersPerMatch: 0,
      winnerToErrorRatio: 0,
      netPointsWonPercentage: 0,
      
      // Return Game Stats
      firstReturnPercentage: 0,
      
      // Additional contextual stats
      averageMatchDuration: "0m",
      longestWinStreak: 0,
      thisMonthMatches: 0,
      secondServePointsWonPercentage: 0,
      totalForcedErrors: 0,
      
      // Performance Insights
      recentForm: 0,
      bestTimeOfDay: null,
      totalPlayingTime: "0h"
    }
  }

  const agg = aggregatePlayerStatsAcrossMatches(matches, mainPlayerId)
  const streaks = calculatePlayerWinStreak(matches, mainPlayerId)
  const insights = calculatePerformanceInsights(matches, mainPlayerId)

  return {
    // Basic Performance
    totalMatchesWon: agg.matchesWon,
    winRate: agg.winRate,
    totalMatches: agg.totalMatches,
    currentWinStreak: streaks.current,
    
    // Serve Performance
    totalAces: agg.totalAces,
    firstServePercentage: agg.firstServePercentage,
    servicePointsWon: agg.totalServicePointsWon,
    totalDoubleFaults: agg.totalDoubleFaults,
    
    // Return Performance
    breakPointsConverted: agg.totalBreakPointsWon,
    returnPointsWon: agg.totalReturnPointsWon,
    breakPointsSaved: agg.totalBreakPointsSaved,
    firstReturnWinPercentage: agg.returnPointsPct,
    breakPointsFaced: agg.totalBreakPointsFaced,
    breakPointConversionRate: agg.breakPointConversionRate,
    
    // Shot Making
    totalWinners: agg.totalWinners,
    totalUnforcedErrors: agg.totalUnforcedErrors,
    netPointsWon: agg.totalNetPointsWon,
    forehandBackhandRatio: calculateForehandBackhandRatio(matches, mainPlayerId),
    winnersPerMatch: agg.totalMatches > 0 ? agg.totalWinners / agg.totalMatches : 0,
    winnerToErrorRatio: agg.winnerToErrorRatio,
    netPointsWonPercentage: agg.netPointsWonPercentage,
    
    // Return Game Stats
    firstReturnPercentage: agg.returnPointsPct,
    
    // Additional contextual stats
    averageMatchDuration: calculateAverageMatchDuration(matches),
    longestWinStreak: streaks.max,
    thisMonthMatches: calculateThisMonthMatches(matches),
    secondServePointsWonPercentage: agg.secondServePointsWonPercentage,
    totalForcedErrors: agg.totalForcedErrors,
    
    // Performance Insights
    recentForm: insights.recentForm,
    bestTimeOfDay: insights.bestTimeOfDay,
    totalPlayingTime: insights.totalPlayingTime
  }
}