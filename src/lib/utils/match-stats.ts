import { PointDetail, MatchStats, PlayerStats } from "@/lib/types"

export function calculateMatchStats(points: PointDetail[]): MatchStats {
  const player1Stats = calculatePlayerStats(points, "p1")
  const player2Stats = calculatePlayerStats(points, "p2")

  return {
    player1: player1Stats,
    player2: player2Stats
  }
}

export function calculatePlayerStats(points: PointDetail[], playerId: "p1" | "p2"): PlayerStats {
  const playerPoints = points.filter(p => p.winner === playerId)
  const playerServes = points.filter(p => p.server === playerId)
  const playerReturns = points.filter(p => p.server !== playerId)

  // **CORRECTED SERVE STATS CALCULATION**
  // In tennis, first serve % = (first serves in) / (total service points)
  // When a player double faults, they attempted both first and second serves
  
  // Count actual serve attempts
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
    // **CORRECTED SERVE STATS**
    firstServesMade: firstServesIn,
    firstServesAttempted: totalServicePoints, // All service points are first serve attempts
    firstServePercentage: totalServicePoints > 0 ? (firstServesIn / totalServicePoints) * 100 : 0,
    firstServePointsWon,
    firstServePointsPlayed: firstServePoints.length,
    firstServeWinPercentage: firstServePoints.length > 0 ? (firstServePointsWon / firstServePoints.length) * 100 : 0,

    secondServesMade: secondServesIn,
    secondServesAttempted: totalServicePoints - firstServesIn, // Second serves attempted when first serve missed
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

    // Point Stats
    totalPointsWon,
    totalPointsPlayed,
    pointWinPercentage: totalPointsPlayed > 0 ? (totalPointsWon / totalPointsPlayed) * 100 : 0,

    winners,
    unforcedErrors,
    forcedErrors,

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