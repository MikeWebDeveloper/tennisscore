/**
 * Instant Stats Loading with Pre-computed Values
 * Provides lightning-fast dashboard statistics
 */

import { Match, Player } from "@/lib/types"
import { calculatePlayerWinStreak } from "./match-stats"

export interface InstantStats {
  // Core performance metrics
  winRate: number
  totalMatches: number
  matchesWon: number
  currentStreak: number
  longestStreak: number
  
  // Quick insights
  recentForm: number // Last 5 matches win rate
  improvement: number // Trend indicator (-1, 0, 1)
  nextMilestone: {
    type: 'matches' | 'winrate' | 'streak'
    target: number
    progress: number
    description: string
  }
  
  // Performance indicators
  isHotStreak: boolean
  isOnFire: boolean // 4+ wins in last 5
  needsImprovement: boolean
  
  // Time-based stats
  thisMonth: {
    matches: number
    wins: number
    winRate: number
  }
  
  // Comparison data
  lastMonthComparison: {
    matchesChange: number
    winRateChange: number
  }
}

/**
 * Calculate instant stats from matches
 * Optimized for speed - minimal calculations
 */
export function calculateInstantStats(matches: Match[], mainPlayerId?: string): InstantStats {
  if (!mainPlayerId || matches.length === 0) {
    return getEmptyStats()
  }
  
  // Filter completed matches only
  const completedMatches = matches.filter(m => 
    m.status?.toLowerCase() === 'completed'
  )
  
  if (completedMatches.length === 0) {
    return getEmptyStats()
  }
  
  // Core metrics - fast calculation
  const wonMatches = completedMatches.filter(m => m.winnerId === mainPlayerId)
  const totalMatches = completedMatches.length
  const winRate = Math.round((wonMatches.length / totalMatches) * 100)
  
  // Streak calculations
  const streaks = calculatePlayerWinStreak(matches, mainPlayerId)
  const currentStreak = streaks.current
  const longestStreak = streaks.max
  
  // Recent form (last 5 matches)
  const last5Matches = completedMatches.slice(0, 5)
  const last5Wins = last5Matches.filter(m => m.winnerId === mainPlayerId).length
  const recentForm = last5Matches.length > 0 ? Math.round((last5Wins / last5Matches.length) * 100) : 0
  
  // Performance indicators
  const isOnFire = last5Matches.length >= 4 && last5Wins >= 4
  const isHotStreak = currentStreak >= 3
  const needsImprovement = recentForm < 40 && totalMatches >= 5
  
  // Improvement trend
  const last10Matches = completedMatches.slice(0, 10)
  const first5Of10 = last10Matches.slice(5, 10)
  const recent5Of10 = last10Matches.slice(0, 5)
  
  let improvement = 0
  if (first5Of10.length > 0 && recent5Of10.length > 0) {
    const oldWinRate = first5Of10.filter(m => m.winnerId === mainPlayerId).length / first5Of10.length
    const newWinRate = recent5Of10.filter(m => m.winnerId === mainPlayerId).length / recent5Of10.length
    
    if (newWinRate > oldWinRate + 0.1) improvement = 1
    else if (newWinRate < oldWinRate - 0.1) improvement = -1
  }
  
  // Time-based calculations
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  
  const thisMonthMatches = completedMatches.filter(m => 
    new Date(m.matchDate) >= thisMonth
  )
  const thisMonthWins = thisMonthMatches.filter(m => m.winnerId === mainPlayerId)
  const thisMonthWinRate = thisMonthMatches.length > 0 
    ? Math.round((thisMonthWins.length / thisMonthMatches.length) * 100) 
    : 0
  
  const lastMonthMatches = completedMatches.filter(m => {
    const date = new Date(m.matchDate)
    return date >= lastMonth && date <= lastMonthEnd
  })
  const lastMonthWins = lastMonthMatches.filter(m => m.winnerId === mainPlayerId)
  const lastMonthWinRate = lastMonthMatches.length > 0 
    ? Math.round((lastMonthWins.length / lastMonthMatches.length) * 100) 
    : 0
  
  // Next milestone calculation
  const nextMilestone = calculateNextMilestone(totalMatches, winRate, currentStreak)
  
  return {
    winRate,
    totalMatches,
    matchesWon: wonMatches.length,
    currentStreak,
    longestStreak,
    recentForm,
    improvement,
    nextMilestone,
    isHotStreak,
    isOnFire,
    needsImprovement,
    thisMonth: {
      matches: thisMonthMatches.length,
      wins: thisMonthWins.length,
      winRate: thisMonthWinRate
    },
    lastMonthComparison: {
      matchesChange: thisMonthMatches.length - lastMonthMatches.length,
      winRateChange: thisMonthWinRate - lastMonthWinRate
    }
  }
}

/**
 * Calculate next achievement milestone
 */
function calculateNextMilestone(totalMatches: number, winRate: number, streak: number) {
  // Match count milestones
  const matchMilestones = [5, 10, 25, 50, 100, 200, 500]
  const nextMatchMilestone = matchMilestones.find(m => m > totalMatches)
  
  // Win rate milestones
  const winRateMilestones = [50, 60, 70, 80, 90]
  const nextWinRateMilestone = winRateMilestones.find(wr => wr > winRate)
  
  // Streak milestones
  const streakMilestones = [3, 5, 10, 15, 20]
  const nextStreakMilestone = streakMilestones.find(s => s > streak)
  
  // Determine which milestone is closest/most relevant
  if (nextMatchMilestone && totalMatches < 50) {
    return {
      type: 'matches' as const,
      target: nextMatchMilestone,
      progress: Math.round((totalMatches / nextMatchMilestone) * 100),
      description: `${nextMatchMilestone - totalMatches} matches to go`
    }
  }
  
  if (nextWinRateMilestone && winRate < 80) {
    return {
      type: 'winrate' as const,
      target: nextWinRateMilestone,
      progress: Math.round((winRate / nextWinRateMilestone) * 100),
      description: `${nextWinRateMilestone - winRate}% improvement needed`
    }
  }
  
  if (nextStreakMilestone && streak < 20) {
    return {
      type: 'streak' as const,
      target: nextStreakMilestone,
      progress: streak > 0 ? Math.round((streak / nextStreakMilestone) * 100) : 0,
      description: `${nextStreakMilestone - streak} more wins for streak`
    }
  }
  
  // Default milestone
  return {
    type: 'matches' as const,
    target: (Math.floor(totalMatches / 50) + 1) * 50,
    progress: Math.round((totalMatches % 50) / 50 * 100),
    description: 'Keep playing!'
  }
}

/**
 * Empty stats for new users
 */
function getEmptyStats(): InstantStats {
  return {
    winRate: 0,
    totalMatches: 0,
    matchesWon: 0,
    currentStreak: 0,
    longestStreak: 0,
    recentForm: 0,
    improvement: 0,
    nextMilestone: {
      type: 'matches',
      target: 5,
      progress: 0,
      description: 'Play your first match!'
    },
    isHotStreak: false,
    isOnFire: false,
    needsImprovement: false,
    thisMonth: {
      matches: 0,
      wins: 0,
      winRate: 0
    },
    lastMonthComparison: {
      matchesChange: 0,
      winRateChange: 0
    }
  }
}

/**
 * Cache instant stats for performance
 * Uses a simple in-memory cache with TTL
 */
const statsCache = new Map<string, { stats: InstantStats; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function getCachedInstantStats(matches: Match[], mainPlayerId?: string): InstantStats {
  if (!mainPlayerId) return getEmptyStats()
  
  const cacheKey = `${mainPlayerId}-${matches.length}`
  const cached = statsCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.stats
  }
  
  const stats = calculateInstantStats(matches, mainPlayerId)
  statsCache.set(cacheKey, { stats, timestamp: Date.now() })
  
  // Cleanup old entries
  if (statsCache.size > 100) {
    const oldestKey = Array.from(statsCache.keys())[0]
    statsCache.delete(oldestKey)
  }
  
  return stats
}