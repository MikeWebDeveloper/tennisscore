import { PointDetail, MatchStats, PlayerStats } from "@/lib/types"

function createEmptyPlayerStats(): PlayerStats {
  return {
    totalPointsPlayed: 0,
    totalPointsWon: 0,
    pointWinPercentage: 0,
    servicePointsWon: 0,
    returnPointsWon: 0,
    winners: 0,
    unforcedErrors: 0,
    forcedErrors: 0,
    aces: 0,
    doubleFaults: 0,
    firstServesMade: 0,
    firstServesAttempted: 0,
    firstServePercentage: 0,
    firstServePointsWon: 0,
    firstServePointsPlayed: 0,
    firstServeWinPercentage: 0,
    secondServesMade: 0,
    secondServesAttempted: 0,
    secondServePercentage: 0,
    secondServePointsWon: 0,
    secondServePointsPlayed: 0,
    secondServeWinPercentage: 0,
    firstReturnPointsWon: 0,
    firstReturnPointsPlayed: 0,
    firstReturnWinPercentage: 0,
    secondReturnPointsWon: 0,
    secondReturnPointsPlayed: 0,
    secondReturnWinPercentage: 0,
    totalReturnPointsWon: 0,
    totalReturnPointsPlayed: 0,
    totalReturnWinPercentage: 0,
    breakPointsWon: 0,
    breakPointsPlayed: 0,
    breakPointsSaved: 0,
    breakPointsFaced: 0,
    breakPointConversionPercentage: 0,
    breakPointSavePercentage: 0,
    forehandWinners: 0,
    forehandErrors: 0,
    backhandWinners: 0,
    backhandErrors: 0,
    volleyWinners: 0,
    volleyErrors: 0,
    netPointsWon: 0,
    netPointsPlayed: 0,
    netPointWinPercentage: 0,
  }
}

export function calculateMatchStats(pointLog: PointDetail[]): MatchStats {
  const p1Stats = createEmptyPlayerStats()
  const p2Stats = createEmptyPlayerStats()

  if (!pointLog || pointLog.length === 0) {
    return { player1: p1Stats, player2: p2Stats }
  }

  pointLog.forEach(point => {
    const winnerStats = point.winner === 'p1' ? p1Stats : p2Stats
    const loserStats = point.winner === 'p1' ? p2Stats : p1Stats
    const serverStats = point.server === 'p1' ? p1Stats : p2Stats
    const returnerStats = point.server === 'p1' ? p2Stats : p1Stats

    p1Stats.totalPointsPlayed++
    p2Stats.totalPointsPlayed++

    winnerStats.totalPointsWon++
    if (point.server === point.winner) {
      winnerStats.servicePointsWon++
    } else {
      winnerStats.returnPointsWon++
    }

    // **CORRECTED SERVE STATS CALCULATION**
    // Every service point is a first serve attempt
    serverStats.firstServesAttempted++
    
    if (point.serveType === 'first') {
      // First serve went in
      serverStats.firstServesMade++
      serverStats.firstServePointsPlayed++
      if (point.winner === point.server) {
        serverStats.firstServePointsWon++
      }
    } else if (point.serveType === 'second') {
      // Second serve means first serve missed, but we already counted the attempt above
      serverStats.secondServesAttempted++
      if (point.serveOutcome !== 'double_fault') {
        serverStats.secondServesMade++
        serverStats.secondServePointsPlayed++
        if (point.winner === point.server) {
          serverStats.secondServePointsWon++
        }
      }
    }

    // Enhanced breakpoint tracking
    if (point.isBreakPoint) {
      // Receiver gets a break point opportunity
      returnerStats.breakPointsPlayed++
      
      // Server faces a break point
      serverStats.breakPointsFaced++
      
      if (point.winner !== point.server) {
        // Receiver wins the break point
        returnerStats.breakPointsWon++
      } else {
        // Server saves the break point
        serverStats.breakPointsSaved++
      }
    }
    
    switch (point.pointOutcome) {
      case 'ace':
        serverStats.aces++
        winnerStats.winners++
        break
      case 'double_fault':
        serverStats.doubleFaults++
        loserStats.unforcedErrors++
        break
      case 'winner':
        winnerStats.winners++
        break
      case 'unforced_error':
        loserStats.unforcedErrors++
        break
      case 'forced_error':
        loserStats.forcedErrors++
        winnerStats.winners++ 
        break
    }
  })

  // Final percentage calculations
  // Calculate all percentages for player 1
  p1Stats.firstServePercentage = p1Stats.firstServesAttempted > 0 ? (p1Stats.firstServesMade / p1Stats.firstServesAttempted) * 100 : 0
  p1Stats.secondServePercentage = p1Stats.secondServesAttempted > 0 ? (p1Stats.secondServesMade / p1Stats.secondServesAttempted) * 100 : 0
  p1Stats.firstServeWinPercentage = p1Stats.firstServePointsPlayed > 0 ? (p1Stats.firstServePointsWon / p1Stats.firstServePointsPlayed) * 100 : 0
  p1Stats.secondServeWinPercentage = p1Stats.secondServePointsPlayed > 0 ? (p1Stats.secondServePointsWon / p1Stats.secondServePointsPlayed) * 100 : 0
  p1Stats.totalReturnWinPercentage = p1Stats.totalReturnPointsPlayed > 0 ? (p1Stats.totalReturnPointsWon / p1Stats.totalReturnPointsPlayed) * 100 : 0
  p1Stats.breakPointConversionPercentage = p1Stats.breakPointsPlayed > 0 ? (p1Stats.breakPointsWon / p1Stats.breakPointsPlayed) * 100 : 0
  p1Stats.breakPointSavePercentage = p1Stats.breakPointsFaced > 0 ? (p1Stats.breakPointsSaved / p1Stats.breakPointsFaced) * 100 : 0
  p1Stats.pointWinPercentage = p1Stats.totalPointsPlayed > 0 ? (p1Stats.totalPointsWon / p1Stats.totalPointsPlayed) * 100 : 0

  // Calculate all percentages for player 2
  p2Stats.firstServePercentage = p2Stats.firstServesAttempted > 0 ? (p2Stats.firstServesMade / p2Stats.firstServesAttempted) * 100 : 0
  p2Stats.secondServePercentage = p2Stats.secondServesAttempted > 0 ? (p2Stats.secondServesMade / p2Stats.secondServesAttempted) * 100 : 0
  p2Stats.firstServeWinPercentage = p2Stats.firstServePointsPlayed > 0 ? (p2Stats.firstServePointsWon / p2Stats.firstServePointsPlayed) * 100 : 0
  p2Stats.secondServeWinPercentage = p2Stats.secondServePointsPlayed > 0 ? (p2Stats.secondServePointsWon / p2Stats.secondServePointsPlayed) * 100 : 0
  p2Stats.totalReturnWinPercentage = p2Stats.totalReturnPointsPlayed > 0 ? (p2Stats.totalReturnPointsWon / p2Stats.totalReturnPointsPlayed) * 100 : 0
  p2Stats.breakPointConversionPercentage = p2Stats.breakPointsPlayed > 0 ? (p2Stats.breakPointsWon / p2Stats.breakPointsPlayed) * 100 : 0
  p2Stats.breakPointSavePercentage = p2Stats.breakPointsFaced > 0 ? (p2Stats.breakPointsSaved / p2Stats.breakPointsFaced) * 100 : 0
  p2Stats.pointWinPercentage = p2Stats.totalPointsPlayed > 0 ? (p2Stats.totalPointsWon / p2Stats.totalPointsPlayed) * 100 : 0

  return { player1: p1Stats, player2: p2Stats }
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