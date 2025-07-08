import { PointDetail, PlayerStats, Match } from "@/lib/types"
import { EnhancedPointDetail, PointsOnlyDetail, SimplePointDetail, DetailedPointDetail, CustomPointDetail } from "@/lib/schemas/match"

export interface EnhancedMatchStats {
  totalPoints: number
  totalPointsWonByPlayer: [number, number]
  servicePointsWonByPlayer: [number, number]
  servicePointsPlayedByPlayer: [number, number]
  servicePointsWonPercentageByPlayer: [number, number]
  receivingPointsWonByPlayer: [number, number]
  receivingPointsPlayedByPlayer: [number, number]
  receivingPointsWonPercentageByPlayer: [number, number]
  winnersByPlayer: [number, number]
  unforcedErrorsByPlayer: [number, number]
  forcedErrorsByPlayer: [number, number]
  acesByPlayer: [number, number]
  doubleFaultsByPlayer: [number, number]
  firstServePercentageByPlayer: [number, number]
  firstServePointsWonByPlayer: [number, number]
  secondServePointsPlayedByPlayer: [number, number]
  secondServePointsWonByPlayer: [number, number]
  breakPointsByPlayer: {
    faced: [number, number]        // Break points faced by each player
    converted: [number, number]    // Break points converted by each player
    saved: [number, number]        // Break points saved by each player
    conversionRate: [number, number] // Break point conversion percentage
  }
}

// Enhanced analytics interfaces
export interface ServeAnalytics {
  placement: {
    distribution: Record<string, number>
    successRate: Record<string, number>
    averageSpeed: Record<string, number>
  }
  speed: {
    average: number
    max: number
    min: number
    distribution: { range: string; count: number }[]
  }
  spin: {
    distribution: Record<string, number>
    effectiveness: Record<string, number>
  }
  situational: {
    breakPointPerformance: ServePerformance
    setPointPerformance: ServePerformance
    matchPointPerformance: ServePerformance
  }
}

export interface ServePerformance {
  attempts: number
  made: number
  percentage: number
}

export interface ReturnAnalytics {
  placement: {
    zones: Record<string, number>
    successRate: Record<string, number>
  }
  quality: {
    distribution: Record<string, number>
    effectiveness: Record<string, number>
  }
  contextual: {
    firstServeReturns: ReturnPerformance
    secondServeReturns: ReturnPerformance
    pressureReturns: ReturnPerformance
  }
}

export interface ReturnPerformance {
  attempts: number
  successful: number
  percentage: number
}

export interface DetailedMatchStats extends EnhancedMatchStats {
  serveDirectionStats: {
    playerOne: ServeDirectionAnalysis
    playerTwo: ServeDirectionAnalysis
  }
  shotDirectionStats: {
    playerOne: ShotDirectionAnalysis
    playerTwo: ShotDirectionAnalysis
  }
  contextualStats: {
    pressurePointPerformance: PressurePointAnalysis
    momentumAnalysis: MomentumAnalysis
  }
  hasDetailedData: boolean
}

export interface ServeDirectionAnalysis {
  wide: { attempts: number; successful: number; aces: number; doubleFaults: number }
  body: { attempts: number; successful: number; aces: number; doubleFaults: number }
  t: { attempts: number; successful: number; aces: number; doubleFaults: number }
  totalAttempts: number
  bestDirection: string
  worstDirection: string
}

export interface ShotDirectionAnalysis {
  crossCourt: { attempts: number; winners: number; errors: number }
  downTheLine: { attempts: number; winners: number; errors: number }
  body: { attempts: number; winners: number; errors: number }
  totalShots: number
  preferredDirection: string
  winnerDirection: string
}

export interface PressurePointAnalysis {
  breakPoints: { total: number; won: number; percentage: number }
  setPoints: { total: number; won: number; percentage: number }
  matchPoints: { total: number; won: number; percentage: number }
}

export interface MomentumAnalysis {
  consecutivePoints: { longest: number; current: number }
  comebackGames: number
  clutchPerformance: number
}

export interface AdvancedMatchStats extends EnhancedMatchStats {
  serveAnalytics: ServeAnalytics
  rallyAnalytics: {
    typeDistribution: Record<string, number>
    averageLength: number
    typeSuccess: Record<string, number>
  }
  customStats: Record<string, unknown>
  hasEnhancedData: boolean
}

export function calculateMatchStats(pointLog: PointDetail[]): EnhancedMatchStats {
  const stats: EnhancedMatchStats = {
    totalPoints: pointLog.length,
    totalPointsWonByPlayer: [0, 0],
    servicePointsWonByPlayer: [0, 0],
    servicePointsPlayedByPlayer: [0, 0],
    servicePointsWonPercentageByPlayer: [0, 0],
    receivingPointsWonByPlayer: [0, 0],
    receivingPointsPlayedByPlayer: [0, 0],
    receivingPointsWonPercentageByPlayer: [0, 0],
    winnersByPlayer: [0, 0],
    unforcedErrorsByPlayer: [0, 0],
    forcedErrorsByPlayer: [0, 0],
    acesByPlayer: [0, 0],
    doubleFaultsByPlayer: [0, 0],
    firstServePercentageByPlayer: [0, 0],
    firstServePointsWonByPlayer: [0, 0],
    secondServePointsPlayedByPlayer: [0, 0],
    secondServePointsWonByPlayer: [0, 0],
    breakPointsByPlayer: {
      faced: [0, 0],
      converted: [0, 0],
      saved: [0, 0],
      conversionRate: [0, 0]
    }
  }

  if (pointLog.length === 0) return stats

  // Count totals
  let p1FirstServesIn = 0
  let p1FirstServePointsWon = 0
  let p1SecondServeAttempts = 0  // Include all second serve attempts (including double faults)
  let p1SecondServePointsWon = 0

  let p2FirstServesIn = 0
  let p2FirstServePointsWon = 0
  let p2SecondServeAttempts = 0  // Include all second serve attempts (including double faults)
  let p2SecondServePointsWon = 0

  pointLog.forEach(point => {
    const isP1 = point.winner === 'p1'
    const isP1Serving = point.server === 'p1'

    // Count total points won
    stats.totalPointsWonByPlayer[isP1 ? 0 : 1]++

    // Count service and receiving points
    if (isP1Serving) {
      stats.servicePointsPlayedByPlayer[0]++
      stats.receivingPointsPlayedByPlayer[1]++
      if (isP1) {
        stats.servicePointsWonByPlayer[0]++
      } else {
        stats.receivingPointsWonByPlayer[1]++
      }
    } else {
      stats.servicePointsPlayedByPlayer[1]++
      stats.receivingPointsPlayedByPlayer[0]++
      if (isP1) {
        stats.receivingPointsWonByPlayer[0]++
      } else {
        stats.servicePointsWonByPlayer[1]++
      }
    }

    // Count winners and errors - use lastShotPlayer for proper attribution
    if (point.pointOutcome === 'winner') {
      // Winner should be attributed to the player who hit the winning shot
      const winnerPlayer = point.lastShotPlayer || point.winner
      stats.winnersByPlayer[winnerPlayer === 'p1' ? 0 : 1]++
    } else if (point.pointOutcome === 'unforced_error') {
      // Unforced error should be attributed to the player who made the error
      const errorPlayer = point.lastShotPlayer || (isP1 ? 'p2' : 'p1')
      stats.unforcedErrorsByPlayer[errorPlayer === 'p1' ? 0 : 1]++
    } else if (point.pointOutcome === 'forced_error') {
      // Forced error should be attributed to the player who made the error
      const errorPlayer = point.lastShotPlayer || (isP1 ? 'p2' : 'p1')
      stats.forcedErrorsByPlayer[errorPlayer === 'p1' ? 0 : 1]++
    }

    // Count aces and double faults - use server for proper attribution
    if (point.pointOutcome === 'ace') {
      // Ace should always be attributed to the server
      stats.acesByPlayer[isP1Serving ? 0 : 1]++
    } else if (point.pointOutcome === 'double_fault') {
      // Double fault should always be attributed to the server
      stats.doubleFaultsByPlayer[isP1Serving ? 0 : 1]++
    }

    // Break point statistics
    if (point.isBreakPoint) {
      if (isP1Serving) {
        // P1 is serving, so P1 faces break point
        stats.breakPointsByPlayer.faced[0]++
        if (isP1) {
          // P1 (server) won the point - break point saved
          stats.breakPointsByPlayer.saved[0]++
        }
        // Note: We don't count conversions here because we need to check 
        // if the receiver eventually won the game (not just this point)
      } else {
        // P2 is serving, so P2 faces break point  
        stats.breakPointsByPlayer.faced[1]++
        if (!isP1) {
          // P2 (server) won the point - break point saved
          stats.breakPointsByPlayer.saved[1]++
        }
        // Note: We don't count conversions here because we need to check 
        // if the receiver eventually won the game (not just this point)
      }
    }
    
    // Count break point conversions separately by checking game winners
    if (point.isGameWinning) {
      // Check if this was a break of serve
      const isBreakOfServe = (isP1Serving && !isP1) || (!isP1Serving && isP1)
      if (isBreakOfServe) {
        // The receiver broke serve
        if (isP1Serving) {
          // P2 broke P1's serve
          stats.breakPointsByPlayer.converted[1]++
        } else {
          // P1 broke P2's serve
          stats.breakPointsByPlayer.converted[0]++
        }
      }
    }

    // Serve statistics
    if (isP1Serving) {
      if (point.serveType === 'first') {
        if (point.serveOutcome !== 'double_fault') {
          p1FirstServesIn++
          if (isP1) p1FirstServePointsWon++
        }
      } else if (point.serveType === 'second') {
        // Count ALL second serve attempts (including double faults) for proper percentage calculation
        p1SecondServeAttempts++
        // Only count as won if server actually won the point (never for double faults)
        if (isP1) p1SecondServePointsWon++
      }
    } else {
      if (point.serveType === 'first') {
        if (point.serveOutcome !== 'double_fault') {
          p2FirstServesIn++
          if (!isP1) p2FirstServePointsWon++
        }
      } else if (point.serveType === 'second') {
        // Count ALL second serve attempts (including double faults) for proper percentage calculation
        p2SecondServeAttempts++
        // Only count as won if server actually won the point (never for double faults)
        if (!isP1) p2SecondServePointsWon++
      }
    }
  })

  // Calculate percentages
  stats.firstServePercentageByPlayer = [
    stats.servicePointsPlayedByPlayer[0] > 0 ? Math.round((p1FirstServesIn / stats.servicePointsPlayedByPlayer[0]) * 100) : 0,
    stats.servicePointsPlayedByPlayer[1] > 0 ? Math.round((p2FirstServesIn / stats.servicePointsPlayedByPlayer[1]) * 100) : 0
  ]

  stats.firstServePointsWonByPlayer = [
    p1FirstServesIn > 0 ? Math.round((p1FirstServePointsWon / p1FirstServesIn) * 100) : 0,
    p2FirstServesIn > 0 ? Math.round((p2FirstServePointsWon / p2FirstServesIn) * 100) : 0
  ]

  stats.secondServePointsPlayedByPlayer = [p1SecondServeAttempts, p2SecondServeAttempts]
  stats.secondServePointsWonByPlayer = [p1SecondServePointsWon, p2SecondServePointsWon]

  // Calculate service and receiving percentages
  stats.servicePointsWonPercentageByPlayer = [
    stats.servicePointsPlayedByPlayer[0] > 0 ? Math.round((stats.servicePointsWonByPlayer[0] / stats.servicePointsPlayedByPlayer[0]) * 100) : 0,
    stats.servicePointsPlayedByPlayer[1] > 0 ? Math.round((stats.servicePointsWonByPlayer[1] / stats.servicePointsPlayedByPlayer[1]) * 100) : 0
  ]

  stats.receivingPointsWonPercentageByPlayer = [
    stats.receivingPointsPlayedByPlayer[0] > 0 ? Math.round((stats.receivingPointsWonByPlayer[0] / stats.receivingPointsPlayedByPlayer[0]) * 100) : 0,
    stats.receivingPointsPlayedByPlayer[1] > 0 ? Math.round((stats.receivingPointsWonByPlayer[1] / stats.receivingPointsPlayedByPlayer[1]) * 100) : 0
  ]

  // Calculate break point conversion rates
  // Note: faced[0] means P1 faced break points, converted[0] means P1 converted break points
  // So P1's conversion rate = converted[0] / (total break points P1 had against P2)
  // We need to count how many break points each player had
  const p1BreakPointOpportunities = pointLog.filter(p => p.isBreakPoint && p.server === 'p2').length
  const p2BreakPointOpportunities = pointLog.filter(p => p.isBreakPoint && p.server === 'p1').length
  
  stats.breakPointsByPlayer.conversionRate = [
    p1BreakPointOpportunities > 0 ? 
      Math.round((stats.breakPointsByPlayer.converted[0] / p1BreakPointOpportunities) * 100) : 0,
    p2BreakPointOpportunities > 0 ? 
      Math.round((stats.breakPointsByPlayer.converted[1] / p2BreakPointOpportunities) * 100) : 0
  ]

  return stats
}

export function calculatePlayerStats(points: PointDetail[], playerKey: "p1" | "p2"): PlayerStats {
  if (!points || points.length === 0) {
    return {
      totalPointsWon: 0,
      winners: 0,
      aces: 0,
      doubleFaults: 0,
      unforcedErrors: 0,
      forcedErrors: 0,
      firstServesAttempted: 0,
      firstServesMade: 0,
      firstServePointsWon: 0,
      secondServesMade: 0,
      secondServePointsWon: 0,
      breakPointsFaced: 0,
      breakPointsSaved: 0,
      breakPointsWon: 0,
      totalReturnPointsWon: 0,
      firstReturnPointsWon: 0,
      secondReturnPointsWon: 0,
      netPointsAttempted: 0,
      netPointsWon: 0,
    }
  }

  const stats = calculateMatchStats(points);
  const idx = playerKey === "p1" ? 0 : 1;

  return {
    totalPointsWon: stats.totalPointsWonByPlayer[idx],
    winners: stats.winnersByPlayer[idx],
    aces: stats.acesByPlayer[idx],
    doubleFaults: stats.doubleFaultsByPlayer[idx],
    unforcedErrors: stats.unforcedErrorsByPlayer[idx],
    forcedErrors: stats.forcedErrorsByPlayer[idx],
    firstServesAttempted: stats.servicePointsPlayedByPlayer[idx],
    firstServesMade: stats.firstServePercentageByPlayer[idx] * stats.servicePointsPlayedByPlayer[idx] / 100, // approximate
    firstServePointsWon: stats.firstServePointsWonByPlayer[idx],
    secondServesMade: stats.secondServePointsPlayedByPlayer[idx],
    secondServePointsWon: stats.secondServePointsWonByPlayer[idx],
    breakPointsFaced: stats.breakPointsByPlayer.faced[idx],
    breakPointsSaved: stats.breakPointsByPlayer.saved[idx],
    breakPointsWon: stats.breakPointsByPlayer.converted[idx],
    totalReturnPointsWon: stats.receivingPointsWonByPlayer[idx],
    firstReturnPointsWon: stats.receivingPointsWonByPlayer[idx], // fallback
    secondReturnPointsWon: 0, // not directly available
    netPointsAttempted: 0, // not directly available
    netPointsWon: 0, // not directly available
  }
}

export function generatePointContext(
  pointNumber: number,
  currentScore: { sets: { p1: number; p2: number }[]; games: number[]; points: number[] },
  winner: "p1" | "p2",
  playerNames: { p1: string; p2: string }
) {
  const winnerName = winner === "p1" ? playerNames.p1 : playerNames.p2
  
  const getGameScoreDisplay = (points: number[]) => {
    const p1Score = points[0] === 40 && points[1] < 40 ? "AD" : points[0]
    const p2Score = points[1] === 40 && points[0] < 40 ? "AD" : points[1]
    
    if (p1Score === 40 && p2Score === 40) return "Deuce"
    return `${p1Score}-${p2Score}`
  }

  const setScores = currentScore.sets.map(set => `${set.p1}-${set.p2}`).join(", ")
  const gameScore = getGameScoreDisplay(currentScore.points)

  return `Point ${pointNumber}: ${winnerName} wins. Score: ${setScores}, ${currentScore.games.join("-")} (${gameScore})`
}

export function calculateDetailedMatchStats(pointLog: PointDetail[]): DetailedMatchStats {
  const baseStats = calculateMatchStats(pointLog)
  
  // Initialize detailed stats structure
  const detailedStats: DetailedMatchStats = {
    ...baseStats,
    serveDirectionStats: {
      playerOne: initializeServeDirectionAnalysis(),
      playerTwo: initializeServeDirectionAnalysis()
    },
    shotDirectionStats: {
      playerOne: initializeShotDirectionAnalysis(),
      playerTwo: initializeShotDirectionAnalysis()
    },
    contextualStats: {
      pressurePointPerformance: initializePressurePointAnalysis(),
      momentumAnalysis: initializeMomentumAnalysis()
    },
    hasDetailedData: false
  }

  if (pointLog.length === 0) return detailedStats

  let hasAnyDetailedData = false

  // Process each point for detailed analysis
  pointLog.forEach((point) => {
    const isP1 = point.winner === 'p1'
    const isP1Serving = point.server === 'p1'
    const playerServeStats = isP1Serving ? detailedStats.serveDirectionStats.playerOne : detailedStats.serveDirectionStats.playerTwo
    const playerShotStats = isP1 ? detailedStats.shotDirectionStats.playerOne : detailedStats.shotDirectionStats.playerTwo

    // Analyze serve direction (for aces and double faults)
    if ((point.pointOutcome === 'ace' || point.pointOutcome === 'double_fault') && point.servePlacement) {
      hasAnyDetailedData = true
      const direction = point.servePlacement as 'wide' | 'body' | 't'
      
      playerServeStats[direction].attempts++
      playerServeStats.totalAttempts++
      
      if (point.pointOutcome === 'ace') {
        playerServeStats[direction].successful++
        playerServeStats[direction].aces++
      } else if (point.pointOutcome === 'double_fault') {
        playerServeStats[direction].doubleFaults++
      }
    }

    // Analyze shot direction (for winners and errors) - check if we have the new shot direction data
    if ((point.pointOutcome === 'winner' || point.pointOutcome === 'unforced_error' || point.pointOutcome === 'forced_error') && 
        point.lastShotType && point.lastShotType !== 'serve') {
      // For now, we'll analyze based on court position since we don't have shot direction in existing data
      // In future points logged with new system, we'd use actual shot direction
      hasAnyDetailedData = true
      
      const direction = inferShotDirection(point)
      if (direction) {
        playerShotStats[direction].attempts++
        playerShotStats.totalShots++
        
        if (point.pointOutcome === 'winner') {
          playerShotStats[direction].winners++
        } else {
          playerShotStats[direction].errors++
        }
      }
    }

    // Analyze pressure points
    if (point.isBreakPoint || point.isSetPoint || point.isMatchPoint) {
      hasAnyDetailedData = true
      
      if (point.isBreakPoint) {
        detailedStats.contextualStats.pressurePointPerformance.breakPoints.total++
        if ((isP1Serving && isP1) || (!isP1Serving && !isP1)) {
          detailedStats.contextualStats.pressurePointPerformance.breakPoints.won++
        }
      }
      
      if (point.isSetPoint) {
        detailedStats.contextualStats.pressurePointPerformance.setPoints.total++
        if (isP1) {
          detailedStats.contextualStats.pressurePointPerformance.setPoints.won++
        }
      }
      
      if (point.isMatchPoint) {
        detailedStats.contextualStats.pressurePointPerformance.matchPoints.total++
        if (isP1) {
          detailedStats.contextualStats.pressurePointPerformance.matchPoints.won++
        }
      }
    }
  })

  // Calculate percentages and best/worst directions
  calculateServeDirectionSummary(detailedStats.serveDirectionStats.playerOne)
  calculateServeDirectionSummary(detailedStats.serveDirectionStats.playerTwo)
  calculateShotDirectionSummary(detailedStats.shotDirectionStats.playerOne)
  calculateShotDirectionSummary(detailedStats.shotDirectionStats.playerTwo)
  calculatePressurePointPercentages(detailedStats.contextualStats.pressurePointPerformance)

  detailedStats.hasDetailedData = hasAnyDetailedData
  
  return detailedStats
}

function initializeServeDirectionAnalysis(): ServeDirectionAnalysis {
  return {
    wide: { attempts: 0, successful: 0, aces: 0, doubleFaults: 0 },
    body: { attempts: 0, successful: 0, aces: 0, doubleFaults: 0 },
    t: { attempts: 0, successful: 0, aces: 0, doubleFaults: 0 },
    totalAttempts: 0,
    bestDirection: '',
    worstDirection: ''
  }
}

function initializeShotDirectionAnalysis(): ShotDirectionAnalysis {
  return {
    crossCourt: { attempts: 0, winners: 0, errors: 0 },
    downTheLine: { attempts: 0, winners: 0, errors: 0 },
    body: { attempts: 0, winners: 0, errors: 0 },
    totalShots: 0,
    preferredDirection: '',
    winnerDirection: ''
  }
}

function initializePressurePointAnalysis(): PressurePointAnalysis {
  return {
    breakPoints: { total: 0, won: 0, percentage: 0 },
    setPoints: { total: 0, won: 0, percentage: 0 },
    matchPoints: { total: 0, won: 0, percentage: 0 }
  }
}

function initializeMomentumAnalysis(): MomentumAnalysis {
  return {
    consecutivePoints: { longest: 0, current: 0 },
    comebackGames: 0,
    clutchPerformance: 0
  }
}

function inferShotDirection(point: PointDetail): 'crossCourt' | 'downTheLine' | 'body' | null {
  // For now, use court position as a proxy for shot direction
  // This is a placeholder until we get actual shot direction data from new point logger
  if (point.courtPosition === 'deuce') {
    return 'crossCourt' // Assume deuce side shots are more likely cross-court
  } else if (point.courtPosition === 'ad') {
    return 'downTheLine' // Assume ad side shots are more likely down the line
  }
  return 'body' // Default for other cases
}

function calculateServeDirectionSummary(stats: ServeDirectionAnalysis) {
  if (stats.totalAttempts === 0) return
  
  const directions = ['wide', 'body', 't'] as const
  let bestDirection = ''
  let worstDirection = ''
  let bestSuccessRate = -1
  let worstSuccessRate = 101
  
  directions.forEach(direction => {
    if (stats[direction].attempts > 0) {
      const successRate = (stats[direction].successful / stats[direction].attempts) * 100
      if (successRate > bestSuccessRate) {
        bestSuccessRate = successRate
        bestDirection = direction
      }
      if (successRate < worstSuccessRate) {
        worstSuccessRate = successRate
        worstDirection = direction
      }
    }
  })
  
  stats.bestDirection = bestDirection
  stats.worstDirection = worstDirection
}

function calculateShotDirectionSummary(stats: ShotDirectionAnalysis) {
  if (stats.totalShots === 0) return
  
  const directions = ['crossCourt', 'downTheLine', 'body'] as const
  let preferredDirection = ''
  let winnerDirection = ''
  let mostUsed = 0
  let mostWinners = 0
  
  directions.forEach(direction => {
    if (stats[direction].attempts > mostUsed) {
      mostUsed = stats[direction].attempts
      preferredDirection = direction
    }
    if (stats[direction].winners > mostWinners) {
      mostWinners = stats[direction].winners
      winnerDirection = direction
    }
  })
  
  stats.preferredDirection = preferredDirection
  stats.winnerDirection = winnerDirection
}

function calculatePressurePointPercentages(stats: PressurePointAnalysis) {
  stats.breakPoints.percentage = stats.breakPoints.total > 0 ? 
    Math.round((stats.breakPoints.won / stats.breakPoints.total) * 100) : 0
  stats.setPoints.percentage = stats.setPoints.total > 0 ? 
    Math.round((stats.setPoints.won / stats.setPoints.total) * 100) : 0
  stats.matchPoints.percentage = stats.matchPoints.total > 0 ? 
    Math.round((stats.matchPoints.won / stats.matchPoints.total) * 100) : 0
}

// --- AGGREGATION AND WIN STREAK LOGIC FOR DASHBOARD ---

export interface AggregatedPlayerStats {
  totalMatches: number;
  matchesWon: number;
  winRate: number;
  winStreak: number;
  maxWinStreak: number;
  totalAces: number;
  totalDoubleFaults: number;
  totalFirstServesAttempted: number;
  totalFirstServesMade: number;
  totalFirstServePointsWon: number;
  totalSecondServesMade: number;
  totalSecondServePointsPlayed: number;
  totalSecondServePointsWon: number;
  totalServicePointsWon: number;
  totalWinners: number;
  totalUnforcedErrors: number;
  totalForcedErrors: number;
  totalReturnPointsWon: number;
  totalFirstReturnPointsWon: number;
  totalSecondReturnPointsWon: number;
  totalBreakPointsFaced: number;
  totalBreakPointsSaved: number;
  totalBreakPointsWon: number;
  totalNetPointsAttempted: number;
  totalNetPointsWon: number;
  // Derived stats
  firstServePercentage: number;
  firstServePointsWonPercentage: number;
  secondServePointsWonPercentage: number;
  breakPointConversionRate: number;
  breakPointSaveRate: number;
  winnerToErrorRatio: number;
  netPointsWonPercentage: number;
  // For dashboard
  returnPointsPct: number;
}

/**
 * Aggregates stats for a player across all matches.
 * Handles mapping playerId to p1/p2 for each match.
 */
export function aggregatePlayerStatsAcrossMatches(matches: Match[], playerId: string): AggregatedPlayerStats {
  let totalMatches = 0;
  let matchesWon = 0;
  let maxWinStreak = 0;
  let currentStreak = 0;
  let lastResultWin = false;
  let totalAces = 0;
  let totalDoubleFaults = 0;
  let totalFirstServesAttempted = 0;
  let totalFirstServesMade = 0;
  let totalFirstServePointsWon = 0;
  let totalSecondServesMade = 0;
  let totalSecondServePointsPlayed = 0;
  let totalSecondServePointsWon = 0;
  let totalServicePointsWon = 0;
  let totalWinners = 0;
  let totalUnforcedErrors = 0;
  let totalForcedErrors = 0;
  let totalReturnPointsWon = 0;
  let totalFirstReturnPointsWon = 0;
  let totalSecondReturnPointsWon = 0;
  let totalBreakPointsFaced = 0;
  let totalBreakPointsSaved = 0;
  let totalBreakPointsWon = 0;
  let totalNetPointsAttempted = 0;
  let totalNetPointsWon = 0;

  // Sort matches by date ascending
  const sortedMatches = matches.slice().sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());

  for (const match of sortedMatches) {
    let playerKey: "p1" | "p2" | null = null;
    if (match.playerOneId === playerId) playerKey = "p1";
    else if (match.playerTwoId === playerId) playerKey = "p2";
    else continue;

    if (match.status && match.status.toLowerCase() === "completed") {
      totalMatches++;
      const didWin = match.winnerId === playerId;
      if (didWin) {
        matchesWon++;
        if (lastResultWin) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
        lastResultWin = true;
      } else {
        if (currentStreak > maxWinStreak) maxWinStreak = currentStreak;
        currentStreak = 0;
        lastResultWin = false;
      }
    }

    const points: PointDetail[] = (match.pointLog || []).map((p: unknown) => typeof p === 'string' ? JSON.parse(p) as PointDetail : p as PointDetail);
    const stats = calculatePlayerStats(points, playerKey);
    totalAces += stats.aces;
    totalDoubleFaults += stats.doubleFaults;
    totalFirstServesAttempted += stats.firstServesAttempted;
    totalFirstServesMade += stats.firstServesMade;
    totalFirstServePointsWon += stats.firstServePointsWon;
    totalSecondServesMade += stats.secondServesMade;
    totalSecondServePointsPlayed += stats.secondServesMade;
    totalSecondServePointsWon += stats.secondServePointsWon;
    totalServicePointsWon += stats.firstServePointsWon + stats.secondServePointsWon;
    totalWinners += stats.winners;
    totalUnforcedErrors += stats.unforcedErrors;
    totalForcedErrors += stats.forcedErrors;
    totalReturnPointsWon += stats.totalReturnPointsWon;
    totalFirstReturnPointsWon += stats.firstReturnPointsWon;
    totalSecondReturnPointsWon += stats.secondReturnPointsWon;
    totalBreakPointsFaced += stats.breakPointsFaced;
    totalBreakPointsSaved += stats.breakPointsSaved;
    totalBreakPointsWon += stats.breakPointsWon;
    totalNetPointsAttempted += stats.netPointsAttempted;
    totalNetPointsWon += stats.netPointsWon;
  }
  if (currentStreak > maxWinStreak) maxWinStreak = currentStreak;
  const winRate = totalMatches > 0 ? Math.round((matchesWon / totalMatches) * 100) : 0;
  // Derived stats
  const firstServePercentage = totalFirstServesAttempted > 0 ? Math.round((totalFirstServesMade / totalFirstServesAttempted) * 100) : 0;
  const firstServePointsWonPercentage = totalFirstServesMade > 0 ? Math.round((totalFirstServePointsWon / totalFirstServesMade) * 100) : 0;
  const secondServePointsWonPercentage = totalSecondServePointsPlayed > 0 ? Math.round((totalSecondServePointsWon / totalSecondServePointsPlayed) * 100) : 0;
  const breakPointConversionRate = totalBreakPointsFaced > 0 ? Math.round((totalBreakPointsWon / totalBreakPointsFaced) * 100) : 0;
  const breakPointSaveRate = totalBreakPointsFaced > 0 ? Math.round((totalBreakPointsSaved / totalBreakPointsFaced) * 100) : 0;
  const winnerToErrorRatio = totalUnforcedErrors > 0 ? Number((totalWinners / totalUnforcedErrors).toFixed(2)) : totalWinners > 0 ? totalWinners : 0;
  const netPointsWonPercentage = totalNetPointsAttempted > 0 ? Math.round((totalNetPointsWon / totalNetPointsAttempted) * 100) : 0;
  const returnPointsPct = totalFirstServesAttempted + totalSecondServesMade > 0 ? Math.round((totalReturnPointsWon / (totalFirstServesAttempted + totalSecondServesMade)) * 100) : 0;
  return {
    totalMatches,
    matchesWon,
    winRate,
    winStreak: currentStreak,
    maxWinStreak,
    totalAces,
    totalDoubleFaults,
    totalFirstServesAttempted,
    totalFirstServesMade,
    totalFirstServePointsWon,
    totalSecondServesMade,
    totalSecondServePointsPlayed,
    totalSecondServePointsWon,
    totalServicePointsWon,
    totalWinners,
    totalUnforcedErrors,
    totalForcedErrors,
    totalReturnPointsWon,
    totalFirstReturnPointsWon,
    totalSecondReturnPointsWon,
    totalBreakPointsFaced,
    totalBreakPointsSaved,
    totalBreakPointsWon,
    totalNetPointsAttempted,
    totalNetPointsWon,
    firstServePercentage,
    firstServePointsWonPercentage,
    secondServePointsWonPercentage,
    breakPointConversionRate,
    breakPointSaveRate,
    winnerToErrorRatio,
    netPointsWonPercentage,
    returnPointsPct,
  };
}

/**
 * Calculates the current and max win streak for a player across matches.
 * Returns { current, max }
 */
export function calculatePlayerWinStreak(matches: Match[], playerId: string): { current: number, max: number } {
  let maxStreak = 0;
  let currentStreak = 0;
  let lastResultWin = false;
  // Sort matches by date ascending
  const sortedMatches = matches.slice().sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
  for (const match of sortedMatches) {
    if (match.status && match.status.toLowerCase() === "completed") {
      const didWin = match.winnerId === playerId;
      if (didWin) {
        if (lastResultWin) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
        lastResultWin = true;
      } else {
        if (currentStreak > maxStreak) maxStreak = currentStreak;
        currentStreak = 0;
        lastResultWin = false;
      }
    }
  }
  if (currentStreak > maxStreak) maxStreak = currentStreak;
  return { current: currentStreak, max: maxStreak };
}

// Type guard helpers
function hasEnhancedField(point: PointDetail | EnhancedPointDetail, field: string): boolean {
  return field in point && (point as Record<string, unknown>)[field] !== undefined
}

// Enhanced analytics calculation functions
export function calculateAdvancedMatchStats(pointLog: (PointDetail | EnhancedPointDetail)[]): AdvancedMatchStats {
  const baseStats = calculateMatchStats(pointLog as PointDetail[])
  
  // Check if we have enhanced data - more flexible detection
  const enhancedPoints = pointLog.filter(p => {
    // Check for explicit logging level > 1
    if ('loggingLevel' in p && p.loggingLevel && parseInt(p.loggingLevel) > 1) {
      return true
    }
    // Or check for enhanced fields that indicate useful analytics data
    return !!(hasEnhancedField(p, 'servePlacement') || hasEnhancedField(p, 'courtPosition') || 
             hasEnhancedField(p, 'lastShotType') || 
             ('serveStats' in p && p.serveStats) || 
             ('returnStats' in p && p.returnStats) ||
             ('tacticalContext' in p && p.tacticalContext))
  }) as EnhancedPointDetail[]
  
  const hasEnhancedData = enhancedPoints.length > 0
  
  const serveAnalytics = hasEnhancedData ? calculateServeAnalytics(enhancedPoints) : getEmptyServeAnalytics()
  const rallyAnalytics = hasEnhancedData ? calculateRallyAnalytics(enhancedPoints) : getEmptyRallyAnalytics()
  
  return {
    ...baseStats,
    serveAnalytics,
    rallyAnalytics,
    customStats: {},
    hasEnhancedData
  }
}

function calculateServeAnalytics(points: EnhancedPointDetail[]): ServeAnalytics {
  // Use either enhanced serveStats or basic servePlacement data
  const servePoints = points.filter(p => 
    p.serveStats || hasEnhancedField(p, 'servePlacement') || (hasEnhancedField(p, 'lastShotType') || p.serveType)
  )
  
  // Placement analysis
  const placementDistribution: Record<string, number> = {}
  const placementSuccess: Record<string, number> = {}
  const placementSpeed: Record<string, number[]> = {}
  
  servePoints.forEach(point => {
    // Get placement from either serveStats or basic servePlacement
    const placement = point.serveStats?.placement || (point as Record<string, unknown>).servePlacement as string
    
    if (placement) {
      placementDistribution[placement] = (placementDistribution[placement] || 0) + 1
      
      // Track success (ace or serve winner)
      const pointOutcome = (point as Record<string, unknown>).pointOutcome as string
      if (pointOutcome === 'ace' || pointOutcome === 'winner') {
        placementSuccess[placement] = (placementSuccess[placement] || 0) + 1
      }
      
      // Track speed by placement (only if available)
      if (point.serveStats?.speed) {
        if (!placementSpeed[placement]) placementSpeed[placement] = []
        placementSpeed[placement].push(point.serveStats.speed)
      }
    }
  })
  
  // Calculate success rates and average speeds
  const placementSuccessRate: Record<string, number> = {}
  const placementAverageSpeed: Record<string, number> = {}
  
  Object.keys(placementDistribution).forEach(placement => {
    placementSuccessRate[placement] = Math.round(
      ((placementSuccess[placement] || 0) / placementDistribution[placement]) * 100
    )
    
    if (placementSpeed[placement] && placementSpeed[placement].length > 0) {
      placementAverageSpeed[placement] = Math.round(
        placementSpeed[placement].reduce((a, b) => a + b, 0) / placementSpeed[placement].length
      )
    }
  })
  
  // Speed analysis
  const speeds = servePoints
    .filter(p => p.serveStats?.speed)
    .map(p => p.serveStats!.speed!)
    
  const speedStats = speeds.length > 0 ? {
    average: Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length),
    max: Math.max(...speeds),
    min: Math.min(...speeds),
    distribution: createSpeedDistribution(speeds)
  } : {
    average: 0,
    max: 0,
    min: 0,
    distribution: []
  }
  
  // Spin analysis
  const spinDistribution: Record<string, number> = {}
  const spinEffectiveness: Record<string, number> = {}
  
  servePoints.forEach(point => {
    if (point.serveStats?.spin) {
      const spin = point.serveStats.spin
      spinDistribution[spin] = (spinDistribution[spin] || 0) + 1
      
      if (point.outcome === 'ace' || point.outcome === 'winner') {
        spinEffectiveness[spin] = (spinEffectiveness[spin] || 0) + 1
      }
    }
  })
  
  // Convert to percentages
  Object.keys(spinDistribution).forEach(spin => {
    spinEffectiveness[spin] = Math.round(
      ((spinEffectiveness[spin] || 0) / spinDistribution[spin]) * 100
    )
  })
  
  // Situational analysis - using pressure situation as proxy for high-pressure scenarios
  const situational = {
    breakPointPerformance: calculateSituationalServePerformance(servePoints, p => p.tacticalContext?.pressureSituation),
    setPointPerformance: calculateSituationalServePerformance(servePoints, p => p.tacticalContext?.pressureSituation),
    matchPointPerformance: calculateSituationalServePerformance(servePoints, p => p.tacticalContext?.pressureSituation)
  }
  
  return {
    placement: {
      distribution: placementDistribution,
      successRate: placementSuccessRate,
      averageSpeed: placementAverageSpeed
    },
    speed: speedStats,
    spin: {
      distribution: spinDistribution,
      effectiveness: spinEffectiveness
    },
    situational
  }
}

function calculateRallyAnalytics(points: EnhancedPointDetail[]): { typeDistribution: Record<string, number>; averageLength: number; typeSuccess: Record<string, number> } {
  // Work with basic rally data or enhanced tactical context
  const typeDistribution: Record<string, number> = {}
  const typeSuccess: Record<string, number> = {}
  const rallyLengths: number[] = []
  
  points.forEach(point => {
    // Use tactical context if available, otherwise infer from basic data
    let rallyType = point.tacticalContext?.rallyType
    
    // Infer rally type from basic data if not explicitly set
    if (!rallyType) {
      const rallyLength = (point as Record<string, unknown>).rallyLength as number
      
      if (rallyLength === 1) {
        rallyType = 'baseline' // Short points are typically baseline
      } else if (rallyLength && rallyLength <= 3) {
        rallyType = 'baseline' // Short rallies
      } else if (rallyLength && rallyLength >= 10) {
        rallyType = 'defensive' // Long rallies tend to be defensive
      } else {
        rallyType = 'baseline' // Default baseline rally
      }
    }
    
    if (rallyType) {
      typeDistribution[rallyType] = (typeDistribution[rallyType] || 0) + 1
      
      const pointOutcome = (point as Record<string, unknown>).pointOutcome as string
      if (pointOutcome === 'winner') {
        typeSuccess[rallyType] = (typeSuccess[rallyType] || 0) + 1
      }
    }
    
    const rallyLength = (point as Record<string, unknown>).rallyLength as number
    if (rallyLength) {
      rallyLengths.push(rallyLength)
    }
  })
  
  // Convert success to percentages
  Object.keys(typeDistribution).forEach(type => {
    typeSuccess[type] = Math.round(
      ((typeSuccess[type] || 0) / typeDistribution[type]) * 100
    )
  })
  
  const averageLength = rallyLengths.length > 0 
    ? rallyLengths.reduce((a, b) => a + b, 0) / rallyLengths.length
    : 0
  
  return {
    typeDistribution,
    averageLength: Math.round(averageLength * 10) / 10, // One decimal place
    typeSuccess
  }
}

function calculateSituationalServePerformance(
  servePoints: EnhancedPointDetail[], 
  condition: (point: EnhancedPointDetail) => boolean | undefined
): ServePerformance {
  const situationalPoints = servePoints.filter(condition)
  const attempts = situationalPoints.length
  const made = situationalPoints.filter(p => 
    p.outcome === 'ace' || p.outcome === 'winner'
  ).length
  
  return {
    attempts,
    made,
    percentage: attempts > 0 ? Math.round((made / attempts) * 100) : 0
  }
}

function createSpeedDistribution(speeds: number[]): { range: string; count: number }[] {
  const ranges = [
    { min: 60, max: 79, label: '60-79 mph' },
    { min: 80, max: 99, label: '80-99 mph' },
    { min: 100, max: 119, label: '100-119 mph' },
    { min: 120, max: 139, label: '120-139 mph' },
    { min: 140, max: 160, label: '140+ mph' }
  ]
  
  return ranges.map(range => ({
    range: range.label,
    count: speeds.filter(speed => speed >= range.min && speed <= range.max).length
  }))
}

function getEmptyServeAnalytics(): ServeAnalytics {
  return {
    placement: {
      distribution: {},
      successRate: {},
      averageSpeed: {}
    },
    speed: {
      average: 0,
      max: 0,
      min: 0,
      distribution: []
    },
    spin: {
      distribution: {},
      effectiveness: {}
    },
    situational: {
      breakPointPerformance: { attempts: 0, made: 0, percentage: 0 },
      setPointPerformance: { attempts: 0, made: 0, percentage: 0 },
      matchPointPerformance: { attempts: 0, made: 0, percentage: 0 }
    }
  }
}

function getEmptyRallyAnalytics(): { typeDistribution: Record<string, number>; averageLength: number; typeSuccess: Record<string, number> } {
  return {
    typeDistribution: {},
    averageLength: 0,
    typeSuccess: {}
  }
}

// Points-only statistics - only basic service and receiving stats
export function calculatePointsOnlyStats(pointLog: PointsOnlyDetail[]): EnhancedMatchStats {
  const stats: EnhancedMatchStats = {
    totalPoints: pointLog.length,
    totalPointsWonByPlayer: [0, 0],
    servicePointsWonByPlayer: [0, 0],
    servicePointsPlayedByPlayer: [0, 0],
    servicePointsWonPercentageByPlayer: [0, 0],
    receivingPointsWonByPlayer: [0, 0],
    receivingPointsPlayedByPlayer: [0, 0],
    receivingPointsWonPercentageByPlayer: [0, 0],
    // These are not available in points-only mode
    winnersByPlayer: [0, 0],
    unforcedErrorsByPlayer: [0, 0],
    forcedErrorsByPlayer: [0, 0],
    acesByPlayer: [0, 0],
    doubleFaultsByPlayer: [0, 0],
    firstServePercentageByPlayer: [0, 0],
    firstServePointsWonByPlayer: [0, 0],
    secondServePointsPlayedByPlayer: [0, 0],
    secondServePointsWonByPlayer: [0, 0],
    breakPointsByPlayer: {
      faced: [0, 0],
      converted: [0, 0],
      saved: [0, 0],
      conversionRate: [0, 0]
    }
  }

  pointLog.forEach(point => {
    const isP1 = point.winner === 'p1'
    const isP1Serving = point.server === 'p1'

    // Total points won
    stats.totalPointsWonByPlayer[isP1 ? 0 : 1]++

    // Service points
    if (isP1Serving) {
      stats.servicePointsPlayedByPlayer[0]++
      if (isP1) {
        stats.servicePointsWonByPlayer[0]++
      }
    } else {
      stats.servicePointsPlayedByPlayer[1]++
      if (!isP1) {
        stats.servicePointsWonByPlayer[1]++
      }
    }

    // Receiving points
    if (!isP1Serving) {
      stats.receivingPointsPlayedByPlayer[0]++
      if (isP1) {
        stats.receivingPointsWonByPlayer[0]++
      }
    } else {
      stats.receivingPointsPlayedByPlayer[1]++
      if (!isP1) {
        stats.receivingPointsWonByPlayer[1]++
      }
    }

    // Break points
    if (point.isBreakPoint) {
      if (isP1Serving) {
        stats.breakPointsByPlayer.faced[0]++
        if (isP1) {
          stats.breakPointsByPlayer.saved[0]++
        } else {
          stats.breakPointsByPlayer.converted[1]++
        }
      } else {
        stats.breakPointsByPlayer.faced[1]++
        if (!isP1) {
          stats.breakPointsByPlayer.saved[1]++
        } else {
          stats.breakPointsByPlayer.converted[0]++
        }
      }
    }
  })

  // Calculate percentages
  stats.servicePointsWonPercentageByPlayer = [
    stats.servicePointsPlayedByPlayer[0] > 0 ? Math.round((stats.servicePointsWonByPlayer[0] / stats.servicePointsPlayedByPlayer[0]) * 100) : 0,
    stats.servicePointsPlayedByPlayer[1] > 0 ? Math.round((stats.servicePointsWonByPlayer[1] / stats.servicePointsPlayedByPlayer[1]) * 100) : 0
  ]

  stats.receivingPointsWonPercentageByPlayer = [
    stats.receivingPointsPlayedByPlayer[0] > 0 ? Math.round((stats.receivingPointsWonByPlayer[0] / stats.receivingPointsPlayedByPlayer[0]) * 100) : 0,
    stats.receivingPointsPlayedByPlayer[1] > 0 ? Math.round((stats.receivingPointsWonByPlayer[1] / stats.receivingPointsPlayedByPlayer[1]) * 100) : 0
  ]

  // Calculate break point conversion rates
  const p1BreakPointOpportunities = pointLog.filter(p => p.isBreakPoint && p.server === 'p2').length
  const p2BreakPointOpportunities = pointLog.filter(p => p.isBreakPoint && p.server === 'p1').length
  
  stats.breakPointsByPlayer.conversionRate = [
    p1BreakPointOpportunities > 0 ? Math.round((stats.breakPointsByPlayer.converted[0] / p1BreakPointOpportunities) * 100) : 0,
    p2BreakPointOpportunities > 0 ? Math.round((stats.breakPointsByPlayer.converted[1] / p2BreakPointOpportunities) * 100) : 0
  ]

  return stats
}

// Simple statistics - includes point outcomes and serve types
export function calculateSimpleStats(pointLog: SimplePointDetail[]): EnhancedMatchStats {
  const stats = calculatePointsOnlyStats(pointLog as PointsOnlyDetail[])

  // Additional tracking for simple mode
  let p1FirstServeAttempts = 0
  let p1FirstServesMade = 0
  let p1FirstServePointsWon = 0
  let p1SecondServeAttempts = 0
  let p1SecondServePointsWon = 0

  let p2FirstServeAttempts = 0
  let p2FirstServesMade = 0
  let p2FirstServePointsWon = 0
  let p2SecondServeAttempts = 0
  let p2SecondServePointsWon = 0

  pointLog.forEach(point => {
    const isP1 = point.winner === 'p1'
    const isP1Serving = point.server === 'p1'

    // Point outcomes
    if (point.pointOutcome === 'winner') {
      const winnerPlayer = point.lastShotPlayer || point.winner
      stats.winnersByPlayer[winnerPlayer === 'p1' ? 0 : 1]++
    } else if (point.pointOutcome === 'unforced_error') {
      const errorPlayer = point.lastShotPlayer || (isP1 ? 'p2' : 'p1')
      stats.unforcedErrorsByPlayer[errorPlayer === 'p1' ? 0 : 1]++
    } else if (point.pointOutcome === 'forced_error') {
      const errorPlayer = point.lastShotPlayer || (isP1 ? 'p2' : 'p1')
      stats.forcedErrorsByPlayer[errorPlayer === 'p1' ? 0 : 1]++
    }

    // Aces and double faults
    if (point.pointOutcome === 'ace') {
      stats.acesByPlayer[isP1Serving ? 0 : 1]++
    } else if (point.pointOutcome === 'double_fault') {
      stats.doubleFaultsByPlayer[isP1Serving ? 0 : 1]++
    }

    // Serve statistics
    if (isP1Serving) {
      if (point.serveType === 'first') {
        p1FirstServeAttempts++
        if (point.pointOutcome !== 'double_fault') {
          p1FirstServesMade++
          if (isP1) {
            p1FirstServePointsWon++
          }
        }
      } else if (point.serveType === 'second') {
        // A second serve means the first serve was a fault
        p1FirstServeAttempts++  // Implied first serve fault
        p1SecondServeAttempts++
        if (isP1) {
          p1SecondServePointsWon++
        }
      }
    } else {
      if (point.serveType === 'first') {
        p2FirstServeAttempts++
        if (point.pointOutcome !== 'double_fault') {
          p2FirstServesMade++
          if (!isP1) {
            p2FirstServePointsWon++
          }
        }
      } else if (point.serveType === 'second') {
        // A second serve means the first serve was a fault
        p2FirstServeAttempts++  // Implied first serve fault
        p2SecondServeAttempts++
        if (!isP1) {
          p2SecondServePointsWon++
        }
      }
    }
  })

  // Update serve statistics
  stats.firstServePercentageByPlayer = [
    p1FirstServeAttempts > 0 ? Math.round((p1FirstServesMade / p1FirstServeAttempts) * 100) : 0,
    p2FirstServeAttempts > 0 ? Math.round((p2FirstServesMade / p2FirstServeAttempts) * 100) : 0
  ]

  stats.firstServePointsWonByPlayer = [
    p1FirstServesMade > 0 ? Math.round((p1FirstServePointsWon / p1FirstServesMade) * 100) : 0,
    p2FirstServesMade > 0 ? Math.round((p2FirstServePointsWon / p2FirstServesMade) * 100) : 0
  ]

  stats.secondServePointsPlayedByPlayer = [p1SecondServeAttempts, p2SecondServeAttempts]
  stats.secondServePointsWonByPlayer = [p1SecondServePointsWon, p2SecondServePointsWon]

  return stats
}

// Detailed statistics - includes positioning and shot direction
export function calculateDetailedStats(pointLog: DetailedPointDetail[]): EnhancedMatchStats {
  const stats = calculateSimpleStats(pointLog as SimplePointDetail[])

  // Additional statistics for detailed mode can be added here
  // For now, it includes all simple stats plus the additional fields are available
  // for more granular analysis in components

  return stats
}

// Custom statistics - includes all advanced analytics
export function calculateCustomStats(pointLog: CustomPointDetail[]): EnhancedMatchStats {
  const stats = calculateDetailedStats(pointLog as DetailedPointDetail[])

  // Advanced analytics for custom mode can be added here
  // This would include serve speed analysis, return quality, tactical context, etc.

  return stats
}

// Main function that routes to appropriate calculator based on detail level
export function calculateMatchStatsByLevel(pointLog: PointDetail[], detailLevel: string): EnhancedMatchStats {
  if (pointLog.length === 0) {
    return calculatePointsOnlyStats([])
  }

  switch (detailLevel) {
    case 'points':
      return calculatePointsOnlyStats(pointLog as PointsOnlyDetail[])
    case 'simple':
      return calculateSimpleStats(pointLog as SimplePointDetail[])
    case 'detailed':
    case 'complex': // Backward compatibility - treat complex as detailed
      return calculateDetailedStats(pointLog as DetailedPointDetail[])
    case 'custom':
      return calculateCustomStats(pointLog as CustomPointDetail[])
    default:
      // Fallback to existing function for backward compatibility
      return calculateMatchStats(pointLog)
  }
}