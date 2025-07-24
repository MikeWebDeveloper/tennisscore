/**
 * Statistics Caching System
 * Provides cached calculations for expensive tennis statistics
 */

import { Match, Player, PointDetail } from "@/lib/types"
import { calculateMatchStats } from "@/lib/utils/match-stats"
import { cacheManager, CACHE_KEYS, CACHE_DURATIONS } from "./cache-manager"
import { logger } from "./logger"

export interface PlayerStats {
  totalMatches: number
  wins: number
  losses: number
  winPercentage: number
  setsWon: number
  setsLost: number
  gamesWon: number
  gamesLost: number
  pointsWon: number
  pointsLost: number
  averageMatchDuration: number
  longestMatch: number
  shortestMatch: number
  recentForm: ('W' | 'L')[]
  favoriteOpponent?: {
    player: Player
    matches: number
    wins: number
  }
  nemesis?: {
    player: Player
    matches: number
    wins: number
  }
}

export interface DashboardStats {
  totalMatches: number
  totalWins: number
  totalLosses: number
  winPercentage: number
  recentMatches: Match[]
  activeStreaks: {
    current: number
    type: 'win' | 'loss' | 'none'
    best: number
  }
  monthlyStats: {
    month: string
    matches: number
    wins: number
    losses: number
  }[]
  topOpponents: {
    player: Player
    matches: number
    wins: number
    losses: number
  }[]
}

/**
 * Calculate comprehensive player statistics with caching
 */
export async function getPlayerStatsWithCache(
  playerId: string,
  matches: Match[]
): Promise<PlayerStats> {
  const cacheKey = `${CACHE_KEYS.PLAYER_STATS(playerId)}_${matches.length}_${matches[0]?.$updatedAt || 'empty'}`
  
  // Try to get from cache first
  const cached = cacheManager.get<PlayerStats>(cacheKey)
  if (cached) {
    return cached
  }

  try {
    // Calculate statistics
    const playerMatches = matches.filter(match => 
      match.playerOneId === playerId || 
      match.playerTwoId === playerId ||
      match.playerThreeId === playerId ||
      match.playerFourId === playerId
    )

    const stats: PlayerStats = {
      totalMatches: playerMatches.length,
      wins: 0,
      losses: 0,
      winPercentage: 0,
      setsWon: 0,
      setsLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      pointsWon: 0,
      pointsLost: 0,
      averageMatchDuration: 0,
      longestMatch: 0,
      shortestMatch: 0,
      recentForm: [],
      favoriteOpponent: undefined,
      nemesis: undefined
    }

    if (playerMatches.length === 0) {
      cacheManager.set(cacheKey, stats, CACHE_DURATIONS.PLAYER_STATS)
      return stats
    }

    // Calculate detailed statistics
    const matchDurations: number[] = []
    const opponentStats: Record<string, { player: Player; matches: number; wins: number }> = {}
    const recentForm: ('W' | 'L')[] = []

    for (const match of playerMatches) {
      if (match.status !== 'completed') continue

      // Parse point log from strings to PointDetail objects
      const pointDetails: PointDetail[] = (match.pointLog || []).map(pointStr => {
        try {
          return typeof pointStr === 'string' ? JSON.parse(pointStr) : pointStr
        } catch {
          return {} as PointDetail
        }
      }).filter(point => point && typeof point === 'object')
      
      const matchStats = calculateMatchStats(pointDetails)
      const isPlayerOne = match.playerOneId === playerId
      const isPlayerTwo = match.playerTwoId === playerId
      
      // Determine if player won
      const playerWon = match.winnerId === playerId
      
      if (playerWon) {
        stats.wins++
        recentForm.unshift('W')
      } else {
        stats.losses++
        recentForm.unshift('L')
      }

      // Add points statistics from available matchStats
      if (matchStats.totalPoints) {
        const playerIndex = isPlayerOne ? 0 : 1
        const opponentIndex = isPlayerOne ? 1 : 0
        
        stats.pointsWon += matchStats.totalPointsWonByPlayer[playerIndex] || 0
        stats.pointsLost += matchStats.totalPointsWonByPlayer[opponentIndex] || 0
      }

      // Track match duration
      if (match.startTime && match.endTime) {
        const duration = new Date(match.endTime).getTime() - new Date(match.startTime).getTime()
        matchDurations.push(duration)
      }

      // Track opponent statistics
      let opponentId: string | null = null
      let opponent: Player | null = null

      if (isPlayerOne) {
        opponentId = match.playerTwoId
        opponent = match.playerTwo || null
      } else if (isPlayerTwo) {
        opponentId = match.playerOneId
        opponent = match.playerOne || null
      }

      if (opponentId && opponent) {
        if (!opponentStats[opponentId]) {
          opponentStats[opponentId] = {
            player: opponent,
            matches: 0,
            wins: 0
          }
        }
        opponentStats[opponentId].matches++
        if (playerWon) {
          opponentStats[opponentId].wins++
        }
      }
    }

    // Calculate percentages and averages
    stats.winPercentage = stats.totalMatches > 0 ? (stats.wins / stats.totalMatches) * 100 : 0
    stats.recentForm = recentForm.slice(0, 10) // Last 10 matches

    // Calculate duration statistics
    if (matchDurations.length > 0) {
      stats.averageMatchDuration = matchDurations.reduce((sum, duration) => sum + duration, 0) / matchDurations.length
      stats.longestMatch = Math.max(...matchDurations)
      stats.shortestMatch = Math.min(...matchDurations)
    }

    // Find favorite opponent and nemesis
    const opponentEntries = Object.entries(opponentStats)
    if (opponentEntries.length > 0) {
      // Favorite opponent: highest win percentage with at least 3 matches
      const favoriteCandidate = opponentEntries
        .filter(([, stats]) => stats.matches >= 3)
        .sort((a, b) => (b[1].wins / b[1].matches) - (a[1].wins / a[1].matches))[0]
      
      if (favoriteCandidate) {
        stats.favoriteOpponent = favoriteCandidate[1]
      }

      // Nemesis: lowest win percentage with at least 3 matches
      const nemesisCandidate = opponentEntries
        .filter(([, stats]) => stats.matches >= 3)
        .sort((a, b) => (a[1].wins / a[1].matches) - (b[1].wins / b[1].matches))[0]
      
      if (nemesisCandidate) {
        stats.nemesis = nemesisCandidate[1]
      }
    }

    // Cache the calculated statistics
    cacheManager.set(cacheKey, stats, CACHE_DURATIONS.PLAYER_STATS)
    
    return stats
  } catch (error) {
    logger.error("Error calculating player statistics:", error)
    
    // Return basic stats on error
    const basicStats: PlayerStats = {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winPercentage: 0,
      setsWon: 0,
      setsLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      pointsWon: 0,
      pointsLost: 0,
      averageMatchDuration: 0,
      longestMatch: 0,
      shortestMatch: 0,
      recentForm: [],
    }
    
    cacheManager.set(cacheKey, basicStats, CACHE_DURATIONS.PLAYER_STATS)
    return basicStats
  }
}

/**
 * Calculate dashboard statistics with caching
 */
export async function getDashboardStatsWithCache(
  userId: string,
  matches: Match[],
  players: Player[],
  mainPlayer: Player | null
): Promise<DashboardStats> {
  const cacheKey = `${CACHE_KEYS.DASHBOARD_STATS(userId)}_${matches.length}_${matches[0]?.$updatedAt || 'empty'}`
  
  // Try to get from cache first
  const cached = cacheManager.get<DashboardStats>(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const completedMatches = matches.filter(match => match.status === 'completed')
    const recentMatches = matches.slice(0, 10)
    
    // Calculate basic statistics
    const totalMatches = completedMatches.length
    const totalWins = completedMatches.filter(match => 
      mainPlayer && match.winnerId === mainPlayer.$id
    ).length
    const totalLosses = totalMatches - totalWins
    const winPercentage = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0

    // Calculate streaks
    let currentStreak = 0
    let streakType: 'win' | 'loss' | 'none' = 'none'
    let bestStreak = 0

    if (mainPlayer && completedMatches.length > 0) {
      const sortedMatches = completedMatches.sort((a, b) => 
        new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
      )

      // Current streak
      for (const match of sortedMatches) {
        const won = match.winnerId === mainPlayer.$id
        if (currentStreak === 0) {
          currentStreak = 1
          streakType = won ? 'win' : 'loss'
        } else if ((streakType === 'win' && won) || (streakType === 'loss' && !won)) {
          currentStreak++
        } else {
          break
        }
      }

      // Best streak (wins only)
      let tempStreak = 0
      for (const match of sortedMatches.reverse()) {
        if (match.winnerId === mainPlayer.$id) {
          tempStreak++
          bestStreak = Math.max(bestStreak, tempStreak)
        } else {
          tempStreak = 0
        }
      }
    }

    // Calculate monthly statistics
    const monthlyStats = new Map<string, { matches: number; wins: number; losses: number }>()
    
    completedMatches.forEach(match => {
      const date = new Date(match.matchDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyStats.has(monthKey)) {
        monthlyStats.set(monthKey, { matches: 0, wins: 0, losses: 0 })
      }
      
      const stats = monthlyStats.get(monthKey)!
      stats.matches++
      
      if (mainPlayer && match.winnerId === mainPlayer.$id) {
        stats.wins++
      } else {
        stats.losses++
      }
    })

    // Calculate top opponents
    const opponentStats = new Map<string, { player: Player; matches: number; wins: number; losses: number }>()
    
    completedMatches.forEach(match => {
      if (!mainPlayer) return

      let opponentId: string | null = null
      let opponent: Player | null = null

      if (match.playerOneId === mainPlayer.$id) {
        opponentId = match.playerTwoId
        opponent = match.playerTwo || null
      } else if (match.playerTwoId === mainPlayer.$id) {
        opponentId = match.playerOneId
        opponent = match.playerOne || null
      }

      if (opponentId && opponent) {
        if (!opponentStats.has(opponentId)) {
          opponentStats.set(opponentId, {
            player: opponent,
            matches: 0,
            wins: 0,
            losses: 0
          })
        }
        
        const stats = opponentStats.get(opponentId)!
        stats.matches++
        
        if (match.winnerId === mainPlayer.$id) {
          stats.wins++
        } else {
          stats.losses++
        }
      }
    })

    const dashboardStats: DashboardStats = {
      totalMatches,
      totalWins,
      totalLosses,
      winPercentage,
      recentMatches,
      activeStreaks: {
        current: currentStreak,
        type: streakType,
        best: bestStreak
      },
      monthlyStats: Array.from(monthlyStats.entries())
        .map(([month, stats]) => ({ month, ...stats }))
        .sort((a, b) => b.month.localeCompare(a.month))
        .slice(0, 12), // Last 12 months
      topOpponents: Array.from(opponentStats.values())
        .sort((a, b) => b.matches - a.matches)
        .slice(0, 5) // Top 5 opponents by match count
    }

    // Cache the calculated statistics
    cacheManager.set(cacheKey, dashboardStats, CACHE_DURATIONS.DASHBOARD_STATS)
    
    return dashboardStats
  } catch (error) {
    logger.error("Error calculating dashboard statistics:", error)
    
    // Return basic stats on error
    const basicStats: DashboardStats = {
      totalMatches: 0,
      totalWins: 0,
      totalLosses: 0,
      winPercentage: 0,
      recentMatches: [],
      activeStreaks: {
        current: 0,
        type: 'none',
        best: 0
      },
      monthlyStats: [],
      topOpponents: []
    }
    
    cacheManager.set(cacheKey, basicStats, CACHE_DURATIONS.DASHBOARD_STATS)
    return basicStats
  }
}

/**
 * Precompute and cache statistics for performance
 */
export async function precomputeStatistics(
  userId: string,
  matches: Match[],
  players: Player[],
  mainPlayer: Player | null
) {
  try {
    // Precompute dashboard statistics
    await getDashboardStatsWithCache(userId, matches, players, mainPlayer)
    
    // Precompute player statistics for main player
    if (mainPlayer) {
      await getPlayerStatsWithCache(mainPlayer.$id, matches)
    }
    
    // Precompute statistics for frequently played opponents
    const opponentCounts = new Map<string, number>()
    matches.forEach(match => {
      if (match.playerOneId !== mainPlayer?.$id) {
        opponentCounts.set(match.playerOneId, (opponentCounts.get(match.playerOneId) || 0) + 1)
      }
      if (match.playerTwoId !== mainPlayer?.$id) {
        opponentCounts.set(match.playerTwoId, (opponentCounts.get(match.playerTwoId) || 0) + 1)
      }
    })
    
    // Precompute stats for top 5 opponents
    const topOpponents = Array.from(opponentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([playerId]) => playerId)
    
    for (const playerId of topOpponents) {
      await getPlayerStatsWithCache(playerId, matches)
    }
    
    logger.debug(`Precomputed statistics for user ${userId}`)
  } catch (error) {
    logger.error("Error precomputing statistics:", error)
  }
}