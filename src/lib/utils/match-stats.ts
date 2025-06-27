import { PointDetail, PlayerStats, Match } from "@/lib/types"

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
  let p1SecondServePoints = 0
  let p1SecondServePointsWon = 0

  let p2FirstServesIn = 0
  let p2FirstServePointsWon = 0
  let p2SecondServePoints = 0
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

    // Count winners and errors
    if (point.pointOutcome === 'winner') {
      stats.winnersByPlayer[isP1 ? 0 : 1]++
    } else if (point.pointOutcome === 'unforced_error') {
      stats.unforcedErrorsByPlayer[isP1 ? 1 : 0]++
    } else if (point.pointOutcome === 'forced_error') {
      stats.forcedErrorsByPlayer[isP1 ? 1 : 0]++
    }

    // Count aces and double faults
    if (point.pointOutcome === 'ace') {
      stats.acesByPlayer[isP1 ? 0 : 1]++
    } else if (point.pointOutcome === 'double_fault') {
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
        p1SecondServePoints++
        if (isP1) p1SecondServePointsWon++
      }
    } else {
      if (point.serveType === 'first') {
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
    stats.servicePointsPlayedByPlayer[0] > 0 ? Math.round((p1FirstServesIn / stats.servicePointsPlayedByPlayer[0]) * 100) : 0,
    stats.servicePointsPlayedByPlayer[1] > 0 ? Math.round((p2FirstServesIn / stats.servicePointsPlayedByPlayer[1]) * 100) : 0
  ]

  stats.firstServePointsWonByPlayer = [
    p1FirstServesIn > 0 ? Math.round((p1FirstServePointsWon / p1FirstServesIn) * 100) : 0,
    p2FirstServesIn > 0 ? Math.round((p2FirstServePointsWon / p2FirstServesIn) * 100) : 0
  ]

  stats.secondServePointsPlayedByPlayer = [p1SecondServePoints, p2SecondServePoints]
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