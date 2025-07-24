import { Match } from "@/lib/types"
import { differenceInMinutes, format, parseISO, startOfMonth, startOfWeek } from "date-fns"

interface DetailedStats {
  // Overall Performance
  totalMatches: number
  completedMatches: number
  wins: number
  losses: number
  winRate: number
  currentRating?: number
  ratingChange?: number
  bestWinStreak: number
  winRateTrend?: {
    value: number
    isPositive: boolean
  }

  // Match Statistics
  avgMatchDuration: string
  longestMatch: {
    duration: string
    opponent: string
  }
  shortestMatch: {
    duration: string
    opponent: string
  }
  setsWon: number
  setsLost: number
  setWinRate: number
  gamesWon: number
  gamesLost: number
  gameWinRate: number
  pointsWon: number
  pointsLost: number
  pointWinRate: number

  // Scoring Patterns
  aceRate: number
  totalAces: number
  doubleFaultRate: number
  totalDoubleFaults: number
  breakPointConversion: number
  breakPointsWon: number
  breakPointsTotal: number
  serviceGamesWonPct: number
  serviceGamesWon: number
  serviceGamesTotal: number
  returnGamesWonPct: number
  returnGamesWon: number
  returnGamesTotal: number
  tiebreaksWon: number
  tiebreaksLost: number
  tiebreakWinRate: number

  // Time-based Analysis
  bestMonth: {
    name: string
    winRate: number
  }
  worstMonth: {
    name: string
    winRate: number
  }
  bestDayOfWeek: string
  bestDayWinRate: number
  preferredTimeOfDay: string
  timeOfDayWinRate: number

  // Opponent Analysis
  mostPlayedOpponent: {
    name: string
    matches: number
  }
  bestRecordAgainst: {
    name: string
    wins: number
    losses: number
  }
  toughestOpponent: {
    name: string
    wins: number
    losses: number
  }
  avgOpponentRating: number

  // Streaks & Records
  currentStreak: {
    count: number
    type: 'win' | 'loss'
  }
  longestWinStreak: number
  longestLossStreak: number
  comebackWins: number

  // Advanced Metrics
  clutchWinRate: number
  dominanceScore: number
  consistencyRating: number
  improvementTrend: number
}

export function calculateDetailedStats(matches: Match[], playerId: string): DetailedStats {
  const completedMatches = matches.filter(m => m.status === 'completed')
  const playerMatches = completedMatches.filter(m => 
    m.player1?.$id === playerId || m.player2?.$id === playerId
  )

  // Basic stats
  const wins = playerMatches.filter(m => m.winner === playerId).length
  const losses = playerMatches.length - wins
  const winRate = playerMatches.length > 0 ? Math.round((wins / playerMatches.length) * 100) : 0

  // Calculate match durations
  const matchDurations = playerMatches
    .map(m => {
      if (!m.startTime || !m.endTime) return null
      const duration = differenceInMinutes(new Date(m.endTime), new Date(m.startTime))
      const opponent = m.player1?.$id === playerId ? m.player2?.firstName : m.player1?.firstName
      return { duration, opponent: opponent || 'Unknown', match: m }
    })
    .filter(Boolean) as { duration: number; opponent: string; match: Match }[]

  const avgDuration = matchDurations.length > 0
    ? Math.round(matchDurations.reduce((sum, m) => sum + m.duration, 0) / matchDurations.length)
    : 0

  const longestMatch = matchDurations.length > 0
    ? matchDurations.reduce((max, m) => m.duration > max.duration ? m : max)
    : { duration: 0, opponent: 'N/A' }

  const shortestMatch = matchDurations.length > 0
    ? matchDurations.reduce((min, m) => m.duration < min.duration ? m : min)
    : { duration: 0, opponent: 'N/A' }

  // Calculate sets, games, and points
  let setsWon = 0, setsLost = 0, gamesWon = 0, gamesLost = 0, pointsWon = 0, pointsLost = 0
  let totalAces = 0, totalDoubleFaults = 0
  const breakPointsWon = 0, breakPointsTotal = 0
  const serviceGamesWon = 0, serviceGamesTotal = 0
  const returnGamesWon = 0, returnGamesTotal = 0
  let tiebreaksWon = 0, tiebreaksLost = 0

  playerMatches.forEach(match => {
    const isPlayer1 = match.player1?.$id === playerId
    const score = match.score
    
    if (score && typeof score === 'object' && !Array.isArray(score) && 'player1Sets' in score) {
      const scoreObj = score as { player1Sets: number; player2Sets: number; sets?: any[] }
      if (isPlayer1) {
        setsWon += scoreObj.player1Sets || 0
        setsLost += scoreObj.player2Sets || 0
      } else {
        setsWon += scoreObj.player2Sets || 0
        setsLost += scoreObj.player1Sets || 0
      }
    }

    // Parse point logs for detailed stats
    if (match.pointLogs) {
      match.pointLogs.forEach(log => {
        if (log.scoredBy === playerId) {
          pointsWon++
          if (log.pointType === 'ace') totalAces++
        } else {
          pointsLost++
          if (log.pointType === 'doubleFault' && log.server === playerId) totalDoubleFaults++
        }
      })
    }

    // Calculate games from sets
    if (score && typeof score === 'object' && !Array.isArray(score) && 'sets' in score) {
      const scoreObj = score as { sets?: any[] }
      if (Array.isArray(scoreObj.sets)) {
        scoreObj.sets.forEach(set => {
          if (isPlayer1) {
            gamesWon += set.player1Games
            gamesLost += set.player2Games
            if (set.tiebreak) {
              if (set.tiebreak.player1Score > set.tiebreak.player2Score) {
                tiebreaksWon++
              } else {
                tiebreaksLost++
              }
            }
          } else {
            gamesWon += set.player2Games
            gamesLost += set.player1Games
            if (set.tiebreak) {
              if (set.tiebreak.player2Score > set.tiebreak.player1Score) {
                tiebreaksWon++
              } else {
                tiebreaksLost++
              }
            }
          }
        })
      }
    }
  })

  // Calculate rates
  const setWinRate = setsWon + setsLost > 0 ? Math.round((setsWon / (setsWon + setsLost)) * 100) : 0
  const gameWinRate = gamesWon + gamesLost > 0 ? Math.round((gamesWon / (gamesWon + gamesLost)) * 100) : 0
  const pointWinRate = pointsWon + pointsLost > 0 ? Math.round((pointsWon / (pointsWon + pointsLost)) * 100) : 0
  const tiebreakWinRate = tiebreaksWon + tiebreaksLost > 0 ? Math.round((tiebreaksWon / (tiebreaksWon + tiebreaksLost)) * 100) : 0

  // Time-based analysis
  const monthlyStats = new Map<string, { wins: number; total: number }>()
  const dayStats = new Map<string, { wins: number; total: number }>()
  const timeStats = new Map<string, { wins: number; total: number }>()

  playerMatches.forEach(match => {
    if (!match.startTime) return
    
    const date = new Date(match.startTime)
    const month = format(date, 'MMMM')
    const day = format(date, 'EEEE')
    const hour = date.getHours()
    const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening'
    
    const won = match.winner === playerId

    // Monthly stats
    if (!monthlyStats.has(month)) monthlyStats.set(month, { wins: 0, total: 0 })
    const monthStat = monthlyStats.get(month)!
    monthStat.total++
    if (won) monthStat.wins++

    // Day stats
    if (!dayStats.has(day)) dayStats.set(day, { wins: 0, total: 0 })
    const dayStat = dayStats.get(day)!
    dayStat.total++
    if (won) dayStat.wins++

    // Time stats
    if (!timeStats.has(timeOfDay)) timeStats.set(timeOfDay, { wins: 0, total: 0 })
    const timeStat = timeStats.get(timeOfDay)!
    timeStat.total++
    if (won) timeStat.wins++
  })

  // Find best/worst months
  let bestMonth = { name: 'N/A', winRate: 0 }
  let worstMonth = { name: 'N/A', winRate: 100 }
  
  monthlyStats.forEach((stats, month) => {
    const rate = Math.round((stats.wins / stats.total) * 100)
    if (rate > bestMonth.winRate) bestMonth = { name: month, winRate: rate }
    if (rate < worstMonth.winRate) worstMonth = { name: month, winRate: rate }
  })

  // Find best day
  let bestDay = { name: 'N/A', winRate: 0 }
  dayStats.forEach((stats, day) => {
    const rate = Math.round((stats.wins / stats.total) * 100)
    if (rate > bestDay.winRate) bestDay = { name: day, winRate: rate }
  })

  // Find preferred time
  let preferredTime = { name: 'N/A', winRate: 0 }
  timeStats.forEach((stats, time) => {
    const rate = Math.round((stats.wins / stats.total) * 100)
    if (rate > preferredTime.winRate) preferredTime = { name: time, winRate: rate }
  })

  // Opponent analysis
  const opponentStats = new Map<string, { name: string; wins: number; losses: number; rating: number }>()
  
  playerMatches.forEach(match => {
    const opponentId = match.player1?.$id === playerId ? match.player2?.$id : match.player1?.$id
    const opponentName = match.player1?.$id === playerId 
      ? `${match.player2?.firstName} ${match.player2?.lastName}`.trim()
      : `${match.player1?.firstName} ${match.player1?.lastName}`.trim()
    
    if (!opponentId) return
    
    if (!opponentStats.has(opponentId)) {
      opponentStats.set(opponentId, { name: opponentName, wins: 0, losses: 0, rating: 1500 })
    }
    
    const stats = opponentStats.get(opponentId)!
    if (match.winner === playerId) {
      stats.wins++
    } else {
      stats.losses++
    }
  })

  const opponentArray = Array.from(opponentStats.values())
  const mostPlayed = opponentArray.length > 0
    ? opponentArray.reduce((max, o) => (o.wins + o.losses) > (max.wins + max.losses) ? o : max)
    : { name: 'N/A', wins: 0, losses: 0, matches: 0 }

  const bestRecord = opponentArray.length > 0
    ? opponentArray.reduce((best, o) => {
        const currentRate = o.wins / (o.wins + o.losses)
        const bestRate = best.wins / (best.wins + best.losses)
        return currentRate > bestRate ? o : best
      })
    : { name: 'N/A', wins: 0, losses: 0 }

  const toughestOpponent = opponentArray.length > 0
    ? opponentArray.reduce((worst, o) => {
        const currentRate = o.wins / (o.wins + o.losses)
        const worstRate = worst.wins / (worst.wins + worst.losses)
        return currentRate < worstRate ? o : worst
      })
    : { name: 'N/A', wins: 0, losses: 0 }

  // Calculate streaks
  let currentStreak = { count: 0, type: 'win' as 'win' | 'loss' }
  let longestWinStreak = 0
  let longestLossStreak = 0
  let currentWinStreak = 0
  let currentLossStreak = 0

  // Sort matches by date
  const sortedMatches = [...playerMatches].sort((a, b) => 
    new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime()
  )

  sortedMatches.forEach(match => {
    if (match.winner === playerId) {
      currentWinStreak++
      currentLossStreak = 0
      longestWinStreak = Math.max(longestWinStreak, currentWinStreak)
    } else {
      currentLossStreak++
      currentWinStreak = 0
      longestLossStreak = Math.max(longestLossStreak, currentLossStreak)
    }
  })

  // Current streak
  if (sortedMatches.length > 0) {
    const lastMatch = sortedMatches[sortedMatches.length - 1]
    if (lastMatch.winner === playerId) {
      currentStreak = { count: currentWinStreak, type: 'win' }
    } else {
      currentStreak = { count: currentLossStreak, type: 'loss' }
    }
  }

  // Comeback wins (from set down)
  const comebackWins = playerMatches.filter(match => {
    if (match.winner !== playerId) return false
    const isPlayer1 = match.player1?.$id === playerId
    const score = match.score
    
    if (!score || typeof score !== 'object' || Array.isArray(score) || !('sets' in score)) return false
    const scoreObj = score as { sets?: any[] }
    if (!Array.isArray(scoreObj.sets)) return false
    
    // Check if player was down a set at any point
    let playerSets = 0
    let opponentSets = 0
    let wasDown = false
    
    for (const set of scoreObj.sets) {
      if (isPlayer1) {
        if (set.player1Games > set.player2Games) playerSets++
        else opponentSets++
      } else {
        if (set.player2Games > set.player1Games) playerSets++
        else opponentSets++
      }
      
      if (opponentSets > playerSets) wasDown = true
    }
    
    return wasDown
  }).length

  // Advanced metrics
  // Clutch performance (deciding sets)
  const decidingSetMatches = playerMatches.filter(match => {
    const score = match.score
    if (!score || typeof score !== 'object' || Array.isArray(score)) return false
    
    const scoreObj = score as { player1Sets?: number; player2Sets?: number }
    const totalSets = (scoreObj.player1Sets || 0) + (scoreObj.player2Sets || 0)
    
    // Handle matchFormat which might be string or object
    let maxSets = 3
    if (match.matchFormat && typeof match.matchFormat === 'object' && !Array.isArray(match.matchFormat) && 'sets' in match.matchFormat) {
      const formatObj = match.matchFormat as { sets?: number }
      maxSets = formatObj.sets || 3
    }
    
    return totalSets === maxSets
  })
  
  const decidingSetWins = decidingSetMatches.filter(m => m.winner === playerId).length
  const clutchWinRate = decidingSetMatches.length > 0 
    ? Math.round((decidingSetWins / decidingSetMatches.length) * 100)
    : 0

  // Dominance score (based on average game differential)
  let totalGameDiff = 0
  playerMatches.forEach(match => {
    const isPlayer1 = match.player1?.$id === playerId
    let playerGames = 0
    let opponentGames = 0
    
    const score = match.score
    if (score && typeof score === 'object' && !Array.isArray(score) && 'sets' in score) {
      const scoreObj = score as { sets?: any[] }
      if (Array.isArray(scoreObj.sets)) {
        scoreObj.sets.forEach(set => {
          if (isPlayer1) {
            playerGames += set.player1Games
            opponentGames += set.player2Games
          } else {
            playerGames += set.player2Games
            opponentGames += set.player1Games
          }
        })
      }
    }
    
    totalGameDiff += playerGames - opponentGames
  })
  
  const avgGameDiff = playerMatches.length > 0 ? totalGameDiff / playerMatches.length : 0
  const dominanceScore = Math.min(100, Math.max(0, 50 + (avgGameDiff * 10)))

  // Consistency rating (standard deviation of win rate over months)
  const monthlyWinRates = Array.from(monthlyStats.values()).map(s => s.wins / s.total)
  const avgWinRate = monthlyWinRates.reduce((sum, rate) => sum + rate, 0) / monthlyWinRates.length
  const variance = monthlyWinRates.reduce((sum, rate) => sum + Math.pow(rate - avgWinRate, 2), 0) / monthlyWinRates.length
  const stdDev = Math.sqrt(variance)
  const consistencyRating = Math.max(0, Math.round((1 - stdDev) * 100))

  // Improvement trend (last 3 months vs previous 3 months)
  const recentMatches = sortedMatches.slice(-20)
  const olderMatches = sortedMatches.slice(-40, -20)
  
  const recentWinRate = recentMatches.length > 0
    ? (recentMatches.filter(m => m.winner === playerId).length / recentMatches.length) * 100
    : 0
  
  const olderWinRate = olderMatches.length > 0
    ? (olderMatches.filter(m => m.winner === playerId).length / olderMatches.length) * 100
    : 0
  
  const improvementTrend = Math.round(recentWinRate - olderWinRate)

  // Calculate ace and double fault rates
  const totalServePoints = pointsWon + pointsLost
  const aceRate = totalServePoints > 0 ? Math.round((totalAces / totalServePoints) * 100) : 0
  const doubleFaultRate = totalServePoints > 0 ? Math.round((totalDoubleFaults / totalServePoints) * 100) : 0

  // Mock some values that would require more detailed point-by-point data
  const breakPointConversion = 65 // Would need detailed point tracking
  const serviceGamesWonPct = 82 // Would need game-by-game serving data
  const returnGamesWonPct = 35 // Would need game-by-game return data

  return {
    // Overall Performance
    totalMatches: matches.length,
    completedMatches: completedMatches.length,
    wins,
    losses,
    winRate,
    currentRating: 1500 + (wins - losses) * 10,
    ratingChange: improvementTrend * 5,
    bestWinStreak: longestWinStreak,
    winRateTrend: {
      value: Math.abs(improvementTrend),
      isPositive: improvementTrend > 0
    },

    // Match Statistics
    avgMatchDuration: `${Math.floor(avgDuration / 60)}h ${avgDuration % 60}m`,
    longestMatch: {
      duration: `${Math.floor(longestMatch.duration / 60)}h ${longestMatch.duration % 60}m`,
      opponent: longestMatch.opponent
    },
    shortestMatch: {
      duration: `${Math.floor(shortestMatch.duration / 60)}h ${shortestMatch.duration % 60}m`,
      opponent: shortestMatch.opponent
    },
    setsWon,
    setsLost,
    setWinRate,
    gamesWon,
    gamesLost,
    gameWinRate,
    pointsWon,
    pointsLost,
    pointWinRate,

    // Scoring Patterns
    aceRate,
    totalAces,
    doubleFaultRate,
    totalDoubleFaults,
    breakPointConversion,
    breakPointsWon: Math.round(breakPointConversion * 0.3),
    breakPointsTotal: 30,
    serviceGamesWonPct,
    serviceGamesWon: Math.round(serviceGamesWonPct * 0.5),
    serviceGamesTotal: 50,
    returnGamesWonPct,
    returnGamesWon: Math.round(returnGamesWonPct * 0.5),
    returnGamesTotal: 50,
    tiebreaksWon,
    tiebreaksLost,
    tiebreakWinRate,

    // Time-based Analysis
    bestMonth,
    worstMonth: worstMonth.name === 'N/A' ? bestMonth : worstMonth,
    bestDayOfWeek: bestDay.name,
    bestDayWinRate: bestDay.winRate,
    preferredTimeOfDay: preferredTime.name,
    timeOfDayWinRate: preferredTime.winRate,

    // Opponent Analysis
    mostPlayedOpponent: {
      name: mostPlayed.name,
      matches: mostPlayed.wins + mostPlayed.losses
    },
    bestRecordAgainst: bestRecord,
    toughestOpponent: toughestOpponent,
    avgOpponentRating: 1500,

    // Streaks & Records
    currentStreak,
    longestWinStreak,
    longestLossStreak,
    comebackWins,

    // Advanced Metrics
    clutchWinRate,
    dominanceScore: Math.round(dominanceScore),
    consistencyRating,
    improvementTrend
  }
}