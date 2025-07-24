/**
 * Web Worker for Heavy Tennis Statistics Calculations
 * Offloads complex calculations from the main thread for better performance
 */

// Worker message types
const MESSAGE_TYPES = {
  CALCULATE_STATS: 'CALCULATE_STATS',
  CALCULATE_HEAD_TO_HEAD: 'CALCULATE_HEAD_TO_HEAD',
  CALCULATE_TRENDS: 'CALCULATE_TRENDS',
  CALCULATE_ADVANCED_METRICS: 'CALCULATE_ADVANCED_METRICS',
  FILTER_MATCHES: 'FILTER_MATCHES'
}

/**
 * Calculate comprehensive match statistics
 */
function calculateMatchStats(matches, playerId) {
  const stats = {
    totalMatches: matches.length,
    completedMatches: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    setsWon: 0,
    setsLost: 0,
    gamesWon: 0,
    gamesLost: 0,
    pointsWon: 0,
    pointsLost: 0,
    avgMatchDuration: 0,
    longestMatch: null,
    shortestMatch: null,
    currentStreak: { type: null, count: 0 },
    bestStreak: { type: null, count: 0 },
    surfaceStats: {},
    opponentStats: {},
    monthlyStats: {},
    setStats: {
      '2-0': 0, '2-1': 0, '0-2': 0, '1-2': 0,
      '3-0': 0, '3-1': 0, '3-2': 0, 
      '0-3': 0, '1-3': 0, '2-3': 0
    }
  }

  if (matches.length === 0) return stats

  let totalDuration = 0
  let currentStreak = { type: null, count: 0 }
  let bestStreak = { type: null, count: 0 }
  let matchDurations = []

  // Sort matches by date for streak calculation
  const sortedMatches = [...matches].sort((a, b) => 
    new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
  )

  sortedMatches.forEach((match, index) => {
    if (match.status !== 'completed' && match.status !== 'Completed') return
    
    stats.completedMatches++
    const isWin = match.winnerId === playerId
    
    if (isWin) {
      stats.wins++
      updateStreak('win')
    } else {
      stats.losses++
      updateStreak('loss')
    }

    // Calculate match duration
    if (match.startTime && match.endTime) {
      const duration = new Date(match.endTime).getTime() - new Date(match.startTime).getTime()
      totalDuration += duration
      matchDurations.push({ duration, match })
    }

    // Parse score for detailed stats
    try {
      const score = typeof match.score === 'string' ? JSON.parse(match.score) : match.score
      if (score && score.sets) {
        calculateSetStats(score.sets, playerId, match, stats)
      }
    } catch (e) {
      // Skip if score parsing fails
    }

    // Surface stats
    const surface = match.surface || 'Hard'
    if (!stats.surfaceStats[surface]) {
      stats.surfaceStats[surface] = { wins: 0, losses: 0, total: 0 }
    }
    stats.surfaceStats[surface].total++
    if (isWin) stats.surfaceStats[surface].wins++
    else stats.surfaceStats[surface].losses++

    // Opponent stats
    const opponent = getOpponentName(match, playerId)
    if (opponent) {
      if (!stats.opponentStats[opponent]) {
        stats.opponentStats[opponent] = { wins: 0, losses: 0, total: 0 }
      }
      stats.opponentStats[opponent].total++
      if (isWin) stats.opponentStats[opponent].wins++
      else stats.opponentStats[opponent].losses++
    }

    // Monthly stats
    const month = new Date(match.matchDate).toISOString().slice(0, 7)
    if (!stats.monthlyStats[month]) {
      stats.monthlyStats[month] = { wins: 0, losses: 0, total: 0 }
    }
    stats.monthlyStats[month].total++
    if (isWin) stats.monthlyStats[month].wins++
    else stats.monthlyStats[month].losses++
  })

  // Calculate averages and finalize stats
  stats.winRate = stats.completedMatches > 0 ? (stats.wins / stats.completedMatches) * 100 : 0
  stats.avgMatchDuration = totalDuration > 0 ? totalDuration / matchDurations.length : 0
  stats.currentStreak = currentStreak
  stats.bestStreak = bestStreak

  if (matchDurations.length > 0) {
    matchDurations.sort((a, b) => a.duration - b.duration)
    stats.shortestMatch = matchDurations[0].match
    stats.longestMatch = matchDurations[matchDurations.length - 1].match
  }

  return stats

  function updateStreak(type) {
    if (currentStreak.type === type) {
      currentStreak.count++
    } else {
      currentStreak = { type, count: 1 }
    }

    if (currentStreak.count > bestStreak.count) {
      bestStreak = { ...currentStreak }
    }
  }
}

/**
 * Calculate detailed set statistics
 */
function calculateSetStats(sets, playerId, match, stats) {
  let playerSets = 0
  let opponentSets = 0
  
  sets.forEach(set => {
    const playerGames = getPlayerGames(set, playerId, match)
    const opponentGames = getOpponentGames(set, playerId, match)
    
    stats.gamesWon += playerGames
    stats.gamesLost += opponentGames
    
    if (playerGames > opponentGames) {
      playerSets++
      stats.setsWon++
    } else if (opponentGames > playerGames) {
      opponentSets++
      stats.setsLost++
    }

    // Calculate points if available
    if (set.pointLog) {
      set.pointLog.forEach(point => {
        if (point.winnerId === playerId) {
          stats.pointsWon++
        } else {
          stats.pointsLost++
        }
      })
    }
  })

  // Update set score stats
  const setScore = `${playerSets}-${opponentSets}`
  if (stats.setStats[setScore] !== undefined) {
    stats.setStats[setScore]++
  }
}

/**
 * Get player's games in a set
 */
function getPlayerGames(set, playerId, match) {
  if (match.playerOneId === playerId) return set.playerOneGames || 0
  if (match.playerTwoId === playerId) return set.playerTwoGames || 0
  if (match.playerThreeId === playerId) return set.playerThreeGames || 0
  if (match.playerFourId === playerId) return set.playerFourGames || 0
  return 0
}

/**
 * Get opponent's games in a set
 */
function getOpponentGames(set, playerId, match) {
  if (match.playerOneId === playerId) return set.playerTwoGames || 0
  if (match.playerTwoId === playerId) return set.playerOneGames || 0
  if (match.playerThreeId === playerId) return set.playerFourGames || 0
  if (match.playerFourId === playerId) return set.playerThreeGames || 0
  return 0
}

/**
 * Get opponent name for a match
 */
function getOpponentName(match, playerId) {
  if (match.playerOneId === playerId) {
    return match.playerTwoName || 'Unknown'
  }
  if (match.playerTwoId === playerId) {
    return match.playerOneName || 'Unknown'
  }
  if (match.playerThreeId === playerId) {
    return match.playerFourName || 'Unknown'
  }
  if (match.playerFourId === playerId) {
    return match.playerThreeName || 'Unknown'
  }
  return 'Unknown'
}

/**
 * Calculate head-to-head statistics between two players
 */
function calculateHeadToHead(matches, player1Id, player2Id) {
  const h2h = {
    totalMatches: 0,
    player1Wins: 0,
    player2Wins: 0,
    player1Sets: 0,
    player2Sets: 0,
    recentResults: [],
    avgMatchDuration: 0,
    longestMatch: null,
    surfaceBreakdown: {}
  }

  const relevantMatches = matches.filter(match => 
    (match.playerOneId === player1Id && match.playerTwoId === player2Id) ||
    (match.playerOneId === player2Id && match.playerTwoId === player1Id) ||
    (match.playerThreeId === player1Id && match.playerFourId === player2Id) ||
    (match.playerThreeId === player2Id && match.playerFourId === player1Id)
  )

  let totalDuration = 0
  let maxDuration = 0
  let longestMatchData = null

  relevantMatches.forEach(match => {
    if (match.status !== 'completed' && match.status !== 'Completed') return
    
    h2h.totalMatches++
    
    if (match.winnerId === player1Id) h2h.player1Wins++
    else if (match.winnerId === player2Id) h2h.player2Wins++

    // Calculate duration
    if (match.startTime && match.endTime) {
      const duration = new Date(match.endTime).getTime() - new Date(match.startTime).getTime()
      totalDuration += duration
      
      if (duration > maxDuration) {
        maxDuration = duration
        longestMatchData = match
      }
    }

    // Recent results (last 5)
    if (h2h.recentResults.length < 5) {
      h2h.recentResults.push({
        date: match.matchDate,
        winner: match.winnerId,
        score: match.score
      })
    }

    // Surface breakdown
    const surface = match.surface || 'Hard'
    if (!h2h.surfaceBreakdown[surface]) {
      h2h.surfaceBreakdown[surface] = { player1Wins: 0, player2Wins: 0 }
    }
    
    if (match.winnerId === player1Id) h2h.surfaceBreakdown[surface].player1Wins++
    else if (match.winnerId === player2Id) h2h.surfaceBreakdown[surface].player2Wins++
  })

  h2h.avgMatchDuration = totalDuration > 0 ? totalDuration / relevantMatches.length : 0
  h2h.longestMatch = longestMatchData

  return h2h
}

/**
 * Calculate performance trends over time
 */
function calculateTrends(matches, playerId, periodDays = 30) {
  const now = new Date()
  const periods = []
  
  // Create periods for trend analysis
  for (let i = 0; i < 12; i++) {
    const endDate = new Date(now)
    endDate.setDate(endDate.getDate() - (i * periodDays))
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - periodDays)
    
    periods.push({
      start: startDate,
      end: endDate,
      matches: [],
      winRate: 0,
      avgRating: 0
    })
  }

  // Categorize matches by period
  matches.forEach(match => {
    if (match.status !== 'completed' && match.status !== 'Completed') return
    
    const matchDate = new Date(match.matchDate)
    const period = periods.find(p => matchDate >= p.start && matchDate <= p.end)
    if (period) {
      period.matches.push(match)
    }
  })

  // Calculate stats for each period
  periods.forEach(period => {
    if (period.matches.length === 0) return
    
    const wins = period.matches.filter(m => m.winnerId === playerId).length
    period.winRate = (wins / period.matches.length) * 100
    
    // Simple rating calculation based on win rate and match quality
    period.avgRating = period.winRate * 10 // Scale to 1000
  })

  return periods.reverse() // Show chronologically
}

/**
 * Filter matches based on complex criteria
 */
function filterMatches(matches, filters) {
  return matches.filter(match => {
    // Date range filter
    if (filters.dateRange) {
      const matchDate = new Date(match.matchDate)
      if (filters.dateRange.start && matchDate < new Date(filters.dateRange.start)) return false
      if (filters.dateRange.end && matchDate > new Date(filters.dateRange.end)) return false
    }

    // Status filter
    if (filters.status && match.status.toLowerCase() !== filters.status.toLowerCase()) return false

    // Surface filter
    if (filters.surface && (match.surface || 'Hard') !== filters.surface) return false

    // Opponent filter
    if (filters.opponent) {
      const hasOpponent = [
        match.playerOneName,
        match.playerTwoName,
        match.playerThreeName,
        match.playerFourName
      ].some(name => name && name.toLowerCase().includes(filters.opponent.toLowerCase()))
      
      if (!hasOpponent) return false
    }

    // Match format filter
    if (filters.matchFormat) {
      if (filters.matchFormat === 'singles' && match.isDoubles) return false
      if (filters.matchFormat === 'doubles' && !match.isDoubles) return false
    }

    // Minimum games filter
    if (filters.minGames) {
      try {
        const score = typeof match.score === 'string' ? JSON.parse(match.score) : match.score
        if (score && score.sets) {
          const totalGames = score.sets.reduce((sum, set) => 
            sum + (set.playerOneGames || 0) + (set.playerTwoGames || 0), 0)
          if (totalGames < filters.minGames) return false
        }
      } catch (e) {
        // Skip if score parsing fails
      }
    }

    return true
  })
}

// Worker message handler
self.addEventListener('message', function(e) {
  const { type, data, id } = e.data
  
  try {
    let result
    
    switch (type) {
      case MESSAGE_TYPES.CALCULATE_STATS:
        result = calculateMatchStats(data.matches, data.playerId)
        break
        
      case MESSAGE_TYPES.CALCULATE_HEAD_TO_HEAD:
        result = calculateHeadToHead(data.matches, data.player1Id, data.player2Id)
        break
        
      case MESSAGE_TYPES.CALCULATE_TRENDS:
        result = calculateTrends(data.matches, data.playerId, data.periodDays)
        break
        
      case MESSAGE_TYPES.FILTER_MATCHES:
        result = filterMatches(data.matches, data.filters)
        break
        
      default:
        throw new Error(`Unknown message type: ${type}`)
    }
    
    // Send result back to main thread
    self.postMessage({
      id,
      type: 'SUCCESS',
      result
    })
    
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      id,
      type: 'ERROR',
      error: error.message
    })
  }
})