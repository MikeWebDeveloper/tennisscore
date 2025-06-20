import { PointDetail, PlayerStats } from "@/lib/types"

export interface EnhancedMatchStats {
  totalPoints: number
  totalPointsWonByPlayer: [number, number]
  winnersByPlayer: [number, number]
  unforcedErrorsByPlayer: [number, number]
  acesByPlayer: [number, number]
  doubleFaultsByPlayer: [number, number]
  firstServePercentageByPlayer: [number, number]
  firstServePointsWonByPlayer: [number, number]
  secondServePointsWonByPlayer: [number, number]
  breakPointsByPlayer: {
    faced: [number, number]        // Break points faced by each player
    converted: [number, number]    // Break points converted by each player
    saved: [number, number]        // Break points saved by each player
    conversionRate: [number, number] // Break point conversion percentage
  }
}

export function calculateMatchStats(pointLog: PointDetail[]): EnhancedMatchStats {
  const stats: EnhancedMatchStats = {
    totalPoints: pointLog.length,
    totalPointsWonByPlayer: [0, 0],
    winnersByPlayer: [0, 0],
    unforcedErrorsByPlayer: [0, 0],
    acesByPlayer: [0, 0],
    doubleFaultsByPlayer: [0, 0],
    firstServePercentageByPlayer: [0, 0],
    firstServePointsWonByPlayer: [0, 0],
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
  let p1FirstServes = 0
  let p1FirstServesIn = 0
  let p1FirstServePointsWon = 0
  let p1SecondServePoints = 0
  let p1SecondServePointsWon = 0

  let p2FirstServes = 0
  let p2FirstServesIn = 0
  let p2FirstServePointsWon = 0
  let p2SecondServePoints = 0
  let p2SecondServePointsWon = 0

  pointLog.forEach(point => {
    const isP1 = point.winner === 'p1'
    const isP1Serving = point.server === 'p1'

    // Count total points won
    stats.totalPointsWonByPlayer[isP1 ? 0 : 1]++

    // Count winners and errors
    if (point.pointOutcome === 'winner') {
      stats.winnersByPlayer[isP1 ? 0 : 1]++
    } else if (point.pointOutcome === 'unforced_error') {
      stats.unforcedErrorsByPlayer[isP1 ? 0 : 1]++
    }

    // Count aces and double faults
    if (point.pointOutcome === 'ace') {
      stats.acesByPlayer[isP1 ? 0 : 1]++
    } else if (point.pointOutcome === 'double_fault') {
      stats.doubleFaultsByPlayer[isP1 ? 0 : 1]++
    }

    // Break point statistics
    if (point.isBreakPoint) {
      if (isP1Serving) {
        // P1 is serving, so P1 faces break point
        stats.breakPointsByPlayer.faced[0]++
        if (!isP1) {
          // P2 won the break point
          stats.breakPointsByPlayer.converted[1]++
        } else {
          // P1 saved the break point
          stats.breakPointsByPlayer.saved[0]++
        }
      } else {
        // P2 is serving, so P2 faces break point
        stats.breakPointsByPlayer.faced[1]++
        if (isP1) {
          // P1 won the break point
          stats.breakPointsByPlayer.converted[0]++
        } else {
          // P2 saved the break point
          stats.breakPointsByPlayer.saved[1]++
        }
      }
    }

    // Serve statistics
    if (isP1Serving) {
      if (point.serveType === 'first') {
        p1FirstServes++
        if (point.serveOutcome !== 'double_fault') {
          p1FirstServesIn++
          if (isP1) p1FirstServePointsWon++
        }
      } else if (point.serveType === 'second') {
        p1SecondServePoints++
        if (isP1) p1SecondServePointsWon++
      }
    } else {
      if (point.serveType === 'first') {
        p2FirstServes++
        if (point.serveOutcome !== 'double_fault') {
          p2FirstServesIn++
          if (!isP1) p2FirstServePointsWon++
        }
      } else if (point.serveType === 'second') {
        p2SecondServePoints++
        if (!isP1) p2SecondServePointsWon++
      }
    }
  })

  // Calculate percentages
  stats.firstServePercentageByPlayer = [
    p1FirstServes > 0 ? Math.round((p1FirstServesIn / p1FirstServes) * 100) : 0,
    p2FirstServes > 0 ? Math.round((p2FirstServesIn / p2FirstServes) * 100) : 0
  ]

  stats.firstServePointsWonByPlayer = [
    p1FirstServesIn > 0 ? Math.round((p1FirstServePointsWon / p1FirstServesIn) * 100) : 0,
    p2FirstServesIn > 0 ? Math.round((p2FirstServePointsWon / p2FirstServesIn) * 100) : 0
  ]

  stats.secondServePointsWonByPlayer = [
    p1SecondServePoints > 0 ? Math.round((p1SecondServePointsWon / p1SecondServePoints) * 100) : 0,
    p2SecondServePoints > 0 ? Math.round((p2SecondServePointsWon / p2SecondServePoints) * 100) : 0
  ]

  // Calculate break point conversion rates
  stats.breakPointsByPlayer.conversionRate = [
    stats.breakPointsByPlayer.faced[1] > 0 ? 
      Math.round((stats.breakPointsByPlayer.converted[0] / stats.breakPointsByPlayer.faced[1]) * 100) : 0,
    stats.breakPointsByPlayer.faced[0] > 0 ? 
      Math.round((stats.breakPointsByPlayer.converted[1] / stats.breakPointsByPlayer.faced[0]) * 100) : 0
  ]

  return stats
}

export function calculatePlayerStats(points: PointDetail[], playerId: "p1" | "p2"): PlayerStats {
  const playerPoints = points.filter(p => p.winner === playerId)
  const playerServes = points.filter(p => p.server === playerId)
  const playerReturns = points.filter(p => p.server !== playerId)

  // **CORRECTED SERVE STATS CALCULATION**
  // In tennis, first serve % = (first serves in) / (total service points)
  // Every service point is a first serve attempt
  
  const totalServicePoints = playerServes.length
  const doubleFaults = playerServes.filter(p => p.pointOutcome === "double_fault").length
  
  // First serves that went in (not double faults or second serves)
  const firstServesIn = playerServes.filter(p => 
    p.serveType === "first" && p.serveOutcome !== "double_fault"
  ).length
  
  // Second serves that went in (not double faults)
  const secondServesIn = playerServes.filter(p => 
    p.serveType === "second" && p.serveOutcome !== "double_fault"
  ).length
  
  // Points played after successful first serves
  const firstServePoints = playerServes.filter(p => 
    p.serveType === "first" && p.serveOutcome !== "double_fault"
  )
  const firstServePointsWon = firstServePoints.filter(p => p.winner === playerId).length
  
  // Points played after successful second serves  
  const secondServePoints = playerServes.filter(p => 
    p.serveType === "second" && p.serveOutcome !== "double_fault"
  )
  const secondServePointsWon = secondServePoints.filter(p => p.winner === playerId).length

  const aces = playerServes.filter(p => p.pointOutcome === "ace").length

  // Return Stats  
  const firstReturnPoints = playerReturns.filter(p => p.serveType === "first")
  const secondReturnPoints = playerReturns.filter(p => p.serveType === "second")
  const firstReturnPointsWon = firstReturnPoints.filter(p => p.winner === playerId).length
  const secondReturnPointsWon = secondReturnPoints.filter(p => p.winner === playerId).length
  const totalReturnPointsWon = firstReturnPointsWon + secondReturnPointsWon

  // Point Stats
  const totalPointsWon = playerPoints.length
  const totalPointsPlayed = points.length

  const winners = playerPoints.filter(p => p.pointOutcome === "winner").length
  const unforcedErrors = points.filter(p => 
    p.winner !== playerId && p.pointOutcome === "unforced_error"
  ).length
  const forcedErrors = points.filter(p => 
    p.winner !== playerId && p.pointOutcome === "forced_error"
  ).length

  // Break Point Stats
  const breakPoints = points.filter(p => p.isBreakPoint && p.server !== playerId)
  const breakPointsWon = breakPoints.filter(p => p.winner === playerId).length
  const breakPointsFaced = points.filter(p => p.isBreakPoint && p.server === playerId)
  const breakPointsSaved = breakPointsFaced.filter(p => p.winner === playerId).length

  // Shot Type Stats
  const forehandWinners = playerPoints.filter(p => 
    p.lastShotType === "forehand" && p.pointOutcome === "winner"
  ).length
  const forehandErrors = points.filter(p => 
    p.winner !== playerId && p.lastShotType === "forehand" && 
    (p.pointOutcome === "unforced_error" || p.pointOutcome === "forced_error")
  ).length

  const backhandWinners = playerPoints.filter(p => 
    p.lastShotType === "backhand" && p.pointOutcome === "winner"
  ).length
  const backhandErrors = points.filter(p => 
    p.winner !== playerId && p.lastShotType === "backhand" && 
    (p.pointOutcome === "unforced_error" || p.pointOutcome === "forced_error")
  ).length

  const volleyWinners = playerPoints.filter(p => 
    p.lastShotType === "volley" && p.pointOutcome === "winner"
  ).length
  const volleyErrors = points.filter(p => 
    p.winner !== playerId && p.lastShotType === "volley" && 
    (p.pointOutcome === "unforced_error" || p.pointOutcome === "forced_error")
  ).length

  // Net Points
  const netPoints = points.filter(p => p.lastShotType === "volley" || p.lastShotType === "overhead")
  const netPointsWon = netPoints.filter(p => p.winner === playerId).length

  return {
    // Point Stats
    totalPointsWon,
    totalPointsPlayed,
    pointWinPercentage: totalPointsPlayed > 0 ? (totalPointsWon / totalPointsPlayed) * 100 : 0,
    servicePointsWon: firstServePointsWon + secondServePointsWon,
    returnPointsWon: totalReturnPointsWon,

    winners,
    unforcedErrors,
    forcedErrors,

    // **CORRECTED SERVE STATS**
    firstServesMade: firstServesIn,
    firstServesAttempted: totalServicePoints, // All service points are first serve attempts
    firstServePercentage: totalServicePoints > 0 ? (firstServesIn / totalServicePoints) * 100 : 0,
    firstServePointsWon,
    firstServePointsPlayed: firstServePoints.length,
    firstServeWinPercentage: firstServePoints.length > 0 ? (firstServePointsWon / firstServePoints.length) * 100 : 0,

    secondServesMade: secondServesIn,
    secondServesAttempted: totalServicePoints - firstServesIn, // Second serves attempted when first serve missed
    secondServePercentage: (totalServicePoints - firstServesIn) > 0 ? (secondServesIn / (totalServicePoints - firstServesIn)) * 100 : 0,
    secondServePointsWon,
    secondServePointsPlayed: secondServePoints.length,
    secondServeWinPercentage: secondServePoints.length > 0 ? (secondServePointsWon / secondServePoints.length) * 100 : 0,

    aces,
    doubleFaults,

    // Return Stats
    firstReturnPointsWon,
    firstReturnPointsPlayed: firstReturnPoints.length,
    firstReturnWinPercentage: firstReturnPoints.length > 0 ? (firstReturnPointsWon / firstReturnPoints.length) * 100 : 0,

    secondReturnPointsWon,
    secondReturnPointsPlayed: secondReturnPoints.length,
    secondReturnWinPercentage: secondReturnPoints.length > 0 ? (secondReturnPointsWon / secondReturnPoints.length) * 100 : 0,
    
    totalReturnPointsWon,
    totalReturnPointsPlayed: playerReturns.length,
    totalReturnWinPercentage: playerReturns.length > 0 ? (totalReturnPointsWon / playerReturns.length) * 100 : 0,

    // Break Point Stats
    breakPointsWon,
    breakPointsPlayed: breakPoints.length,
    breakPointConversionPercentage: breakPoints.length > 0 ? (breakPointsWon / breakPoints.length) * 100 : 0,

    breakPointsSaved,
    breakPointsFaced: breakPointsFaced.length,
    breakPointSavePercentage: breakPointsFaced.length > 0 ? (breakPointsSaved / breakPointsFaced.length) * 100 : 0,

    // Shot Type Stats
    forehandWinners,
    forehandErrors,
    backhandWinners,
    backhandErrors,
    volleyWinners,
    volleyErrors,

    // Net Points
    netPointsWon,
    netPointsPlayed: netPoints.length,
    netPointWinPercentage: netPoints.length > 0 ? (netPointsWon / netPoints.length) * 100 : 0,
  }
}

export function generatePointContext(
  pointNumber: number,
  currentScore: { sets: { p1: number; p2: number }[]; games: number[]; points: number[] },
  winner: "p1" | "p2",
  playerNames: { p1: string; p2: string }
) {
  const setNumber = currentScore.sets.length + 1
  const gameNumber = currentScore.games[0] + currentScore.games[1] + 1
  
  // Generate game score display
  const getGameScoreDisplay = (points: number[]) => {
    if (points[0] < 3 && points[1] < 3) {
      const scoreMap = ["0", "15", "30"]
      return `${scoreMap[points[0]]}-${scoreMap[points[1]]}`
    }
    
    if (points[0] >= 3 && points[1] >= 3) {
      if (points[0] === points[1]) return "Deuce"
      return points[0] > points[1] ? `Ad ${playerNames.p1}` : `Ad ${playerNames.p2}`
    }
    
    const scoreMap = ["0", "15", "30", "40"]
    return `${scoreMap[Math.min(points[0], 3)]}-${scoreMap[Math.min(points[1], 3)]}`
  }

  const gameScore = getGameScoreDisplay(currentScore.points)
  
  // Determine server (alternate each game)
  const totalGames = currentScore.games[0] + currentScore.games[1]
  const server = totalGames % 2 === 0 ? "p1" as const : "p2" as const
  
  // Check for special situations
  const serverGames = server === "p1" ? currentScore.games[0] : currentScore.games[1]
  const returnerGames = server === "p1" ? currentScore.games[1] : currentScore.games[0]
  const serverPoints = server === "p1" ? currentScore.points[0] : currentScore.points[1]
  const returnerPoints = server === "p1" ? currentScore.points[1] : currentScore.points[0]
  
  const isBreakPoint = winner !== server && (
    (serverPoints >= 3 && returnerPoints >= 3 && returnerPoints >= serverPoints) ||
    (serverPoints < 3 && returnerPoints === 3)
  )
  
  const isSetPoint = serverGames >= 5 || returnerGames >= 5
  const isMatchPoint = currentScore.sets.length >= 2 // Assuming best of 3

  return {
    pointNumber,
    setNumber,
    gameNumber,
    gameScore,
    winner,
    server,
    isBreakPoint,
    isSetPoint,
    isMatchPoint,
    playerNames
  }
} 