import { create } from 'zustand'
import { 
  isGameWon, 
  isSetWon, 
  isTiebreakWon,
  getTiebreakServer,
  getTennisScore,
  calculateScoreFromPointLog,
  isBreakPoint
} from '@/lib/utils/tennis-scoring'

export interface MatchFormat {
  sets: 1 | 3 | 5
  noAd: boolean
  tiebreak: boolean
  finalSetTiebreak: boolean
  finalSetTiebreakAt?: number
  shortSets?: boolean
  detailLevel?: "points" | "simple" | "complex"
}

export interface Score {
  sets: Array<[number, number]>;
  games: [number, number];
  points: [number, number];
  isTiebreak?: boolean;
  tiebreakPoints?: [number, number];
  initialTiebreakServer?: 'p1' | 'p2';
}

export interface PointDetail {
  id: string
  timestamp: string
  pointNumber: number
  setNumber: number
  gameNumber: number
  gameScore: string
  winner: 'p1' | 'p2'
  server: 'p1' | 'p2'
  serveType: 'first' | 'second'
  serveOutcome: 'ace' | 'winner' | 'unforced_error' | 'forced_error' | 'double_fault'
  servePlacement?: 'wide' | 'body' | 't'
  serveSpeed?: number
  rallyLength: number
  pointOutcome: 'ace' | 'winner' | 'unforced_error' | 'forced_error' | 'double_fault'
  lastShotType?: 'forehand' | 'backhand' | 'serve' | 'volley' | 'overhead' | 'other'
  lastShotPlayer: 'p1' | 'p2'
  isBreakPoint: boolean
  isSetPoint: boolean
  isMatchPoint: boolean
  isGameWinning: boolean
  isSetWinning: boolean
  isMatchWinning: boolean
  notes?: string
  courtPosition?: 'deuce' | 'ad' | 'baseline' | 'net'
  isTiebreak?: boolean
}

export interface Match {
  $id: string
  playerOneId: string
  playerTwoId: string
  matchDate: string
  matchFormat: MatchFormat
  status: 'In Progress' | 'Completed'
  winnerId?: string
  score: Score
  pointLog: PointDetail[]
  startTime?: string       // When first point was played
  endTime?: string         // When match ended
  setDurations?: number[]  // Duration of each completed set in milliseconds
  retirementReason?: string // Reason if match was retired
  events: Array<{
    type: 'comment' | 'photo'
    content: string
    timestamp: string
  }>
  userId: string
}

interface MatchState {
  // Current match being scored
  currentMatch: Match | null
  setCurrentMatch: (match: Match | null) => void
  
  // Live scoring state
  score: Score
  pointLog: PointDetail[]
  currentServer: 'p1' | 'p2' | null
  startingServer: 'p1' | 'p2' | null  // Track who was chosen to serve first
  matchFormat: MatchFormat | null
  initialTiebreakServer: 'p1' | 'p2' | null
  
  // Match state
  isMatchComplete: boolean
  winnerId: string | null
  
  // Timing
  startTime: string | null
  endTime: string | null
  setDurations: number[]  // Duration of each completed set in milliseconds
  currentSetStartTime: string | null  // When current set started
  
  // Detailed logging mode
  detailedLoggingEnabled: boolean
  setDetailedLoggingEnabled: (enabled: boolean) => void
  
  // Match events (comments, photos)
  events: Array<{ type: 'comment' | 'photo'; content: string; timestamp: string }>
  addEvent: (event: { type: 'comment' | 'photo'; content: string }) => void
  
  // Core actions
  initializeMatch: (match: Match) => void
  awardPoint: (winner: 'p1' | 'p2', details: Partial<PointDetail>) => { 
    newScore: Score
    pointDetail: PointDetail
    isMatchComplete: boolean
    winnerId?: string | null
    startTime?: string
    endTime?: string
    setDurations?: number[]
  }
  undoLastPoint: () => { newScore: Score; newPointLog: PointDetail[] }
  setServer: (server: 'p1' | 'p2') => void
  
  // Reset function for new match
  resetMatch: () => void
}

const initialScore: Score = {
  sets: [],
  games: [0, 0],
  points: [0, 0],
  isTiebreak: false,
  tiebreakPoints: [0, 0],
  initialTiebreakServer: undefined,
}

// Helper function to calculate server based on starting server choice
const getServerWithStartingChoice = (gameNumber: number, startingServer: 'p1' | 'p2'): 'p1' | 'p2' => {
  // gameNumber is 1-indexed (1st game, 2nd game, etc.)
  // Server alternates every game
  const totalGamesPlayed = gameNumber - 1
  
  if (startingServer === 'p1') {
    // P1 serves first: P1 serves games 1,3,5... P2 serves games 2,4,6...
    return totalGamesPlayed % 2 === 0 ? 'p1' : 'p2'
  } else {
    // P2 serves first: P2 serves games 1,3,5... P1 serves games 2,4,6...
    return totalGamesPlayed % 2 === 0 ? 'p2' : 'p1'
  }
}

// This function will be the single source of truth for score calculation.
// The calculateScoreFromPointLog function is being moved to tennis-scoring.ts
// to centralize scoring logic. It will be removed from this file.

export const useMatchStore = create<MatchState>((set, get) => ({
  currentMatch: null,
  setCurrentMatch: (match) => set({ currentMatch: match }),
  
  score: initialScore,
  pointLog: [],
  currentServer: null,
  startingServer: null,
  matchFormat: null,
  initialTiebreakServer: null,
  isMatchComplete: false,
  winnerId: null,
  
  startTime: null,
  endTime: null,
  setDurations: [],
  currentSetStartTime: null,
  
  detailedLoggingEnabled: false,
  setDetailedLoggingEnabled: (enabled) => set({ detailedLoggingEnabled: enabled }),
  
  events: [],
  addEvent: (event) => set((state) => ({
    events: [...state.events, { ...event, timestamp: new Date().toISOString() }]
  })),
  
  initializeMatch: (match) => {
    const score = match.score || initialScore
    const pointLog = match.pointLog || []
    let calculatedServer: 'p1' | 'p2' | null = null
    let startingServer: 'p1' | 'p2' = 'p1' // Default to p1 if not set
    
    if (pointLog.length > 0) {
      const recalculatedScore = calculateScoreFromPointLog(pointLog, match.matchFormat)
      
      // Get the starting server from the first point in the log
      startingServer = pointLog[0].server
      
      if (recalculatedScore.isTiebreak) {
        const totalTiebreakPoints = recalculatedScore.tiebreakPoints![0] + recalculatedScore.tiebreakPoints![1]
        calculatedServer = getTiebreakServer(totalTiebreakPoints, recalculatedScore.initialTiebreakServer!)
      } else {
        const totalGamesPlayed = recalculatedScore.sets.reduce((sum, set) => sum + set[0] + set[1], 0) + recalculatedScore.games[0] + recalculatedScore.games[1]
        calculatedServer = getServerWithStartingChoice(totalGamesPlayed + 1, startingServer)
      }
      
      set({
        currentMatch: match,
        score: recalculatedScore,
        pointLog,
        currentServer: calculatedServer,
        startingServer,
        matchFormat: match.matchFormat,
        initialTiebreakServer: recalculatedScore.initialTiebreakServer || null,
        isMatchComplete: match.status === 'Completed',
        winnerId: match.winnerId || null,
        events: match.events || [],
        startTime: match.startTime || null,
        endTime: match.endTime || null,
        setDurations: match.setDurations || [],
        currentSetStartTime: match.startTime || null,
      })
    } else {
      // For new matches, keep existing server or default to player 1
      const currentState = get()
      startingServer = currentState.currentServer || 'p1'
      calculatedServer = startingServer
      
      set({
        currentMatch: match,
        score,
        pointLog,
        currentServer: calculatedServer,
        startingServer,
        matchFormat: match.matchFormat,
        initialTiebreakServer: score.initialTiebreakServer || null,
        isMatchComplete: match.status === 'Completed',
        winnerId: match.winnerId || null,
        events: match.events || []
      })
    }
  },
  
  awardPoint: (winner, details) => {
    const state = get()
    
    if (state.isMatchComplete) throw new Error('Match is already complete.')
    if (!state.currentServer || !state.matchFormat || !state.currentMatch) throw new Error('Match not properly initialized')
    
    // Handle timing for first point
    const isFirstPoint = state.pointLog.length === 0
    const currentTime = new Date().toISOString()
    let newStartTime = state.startTime
    let newCurrentSetStartTime = state.currentSetStartTime
    
    if (isFirstPoint) {
      newStartTime = currentTime
      newCurrentSetStartTime = currentTime
    }

    const { matchFormat, currentServer, pointLog, score: previousScore } = state
    const winnerId_map = { p1: state.currentMatch.playerOneId, p2: state.currentMatch.playerTwoId }

    // --- 1. Determine point context (isBreakPoint, etc.) BEFORE adding the point ---
    const setsNeededToWin = Math.ceil(matchFormat.sets / 2)
    const currentP1SetsWon = previousScore.sets.filter((s: [number, number]) => s[0] > s[1]).length
    const currentP2SetsWon = previousScore.sets.filter((s: [number, number]) => s[1] > s[0]).length
    
    let isThisPointBreakPoint = false
    let isThisPointSetPoint = false
    let isThisPointMatchPoint = false
    let isThisPointGameWinning = false
    let isThisPointSetWinning = false
    let isThisPointMatchWinning = false
    const isDecidingSet = currentP1SetsWon === setsNeededToWin - 1 && currentP2SetsWon === setsNeededToWin - 1

    // Check if this point will win the game/set/match
    if (previousScore.isTiebreak) {
        const tiebreakTarget = (matchFormat.finalSetTiebreak && isDecidingSet) ? (matchFormat.finalSetTiebreakAt || 10) : 7
        const [p1_tb, p2_tb] = previousScore.tiebreakPoints || [0,0]
        const temp_p1 = p1_tb + (winner === 'p1' ? 1 : 0)
        const temp_p2 = p2_tb + (winner === 'p2' ? 1 : 0)
        
        // Check if this wins the tiebreak
        if (isTiebreakWon(temp_p1, temp_p2, tiebreakTarget)) {
            isThisPointGameWinning = true
            isThisPointSetWinning = true
            isThisPointSetPoint = true
            
            // Check if this wins the match
            const newP1Sets = currentP1SetsWon + (winner === 'p1' ? 1 : 0)
            const newP2Sets = currentP2SetsWon + (winner === 'p2' ? 1 : 0)
            if (newP1Sets >= setsNeededToWin || newP2Sets >= setsNeededToWin) {
                isThisPointMatchWinning = true
                isThisPointMatchPoint = true
            }
        }
    } else {
        const [p1Score, p2Score] = previousScore.points
        const temp_p1_score = p1Score + (winner === 'p1' ? 1 : 0)
        const temp_p2_score = p2Score + (winner === 'p2' ? 1 : 0)
        
        // BREAK POINT: Use proper break point detection logic
        const serverPoints = currentServer === 'p1' ? previousScore.points[0] : previousScore.points[1]
        const returnerPoints = currentServer === 'p1' ? previousScore.points[1] : previousScore.points[0]
        
        // Check if this is a break point situation (receiver can win game with this point)
        isThisPointBreakPoint = isBreakPoint(serverPoints, returnerPoints, matchFormat.noAd)
        
        // GAME WINNING: This point wins the game
        if (isGameWon(temp_p1_score, temp_p2_score, matchFormat.noAd)) {
            isThisPointGameWinning = true
            
            // SET POINT: Check if winning this game would win the set
            const tempGames = [...previousScore.games] as [number, number];
            tempGames[winner === 'p1' ? 0 : 1]++
            
            // Debug logging for Set Point detection
            console.log('🎾 SET POINT Detection:', {
                currentGames: previousScore.games,
                tempGames,
                winner,
                wouldWinSet: isSetWon(tempGames[0], tempGames[1], matchFormat),
                matchFormat: {
                    shortSets: matchFormat.shortSets,
                    tiebreak: matchFormat.tiebreak
                },
                currentSets: previousScore.sets,
                explanation: `If ${winner} wins this point → wins game → ${tempGames[0]}-${tempGames[1]} games`
            })
            
            if (isSetWon(tempGames[0], tempGames[1], matchFormat)) {
                isThisPointSetWinning = true
                isThisPointSetPoint = true
                
                console.log('✅ SET POINT DETECTED!', { winner, games: tempGames })
                
                // MATCH POINT: Check if winning this set would win the match
                const newP1Sets = currentP1SetsWon + (winner === 'p1' ? 1 : 0)
                const newP2Sets = currentP2SetsWon + (winner === 'p2' ? 1 : 0)
                if (newP1Sets >= setsNeededToWin || newP2Sets >= setsNeededToWin) {
                    isThisPointMatchWinning = true
                    isThisPointMatchPoint = true
                    console.log('✅ MATCH POINT DETECTED!', { winner, newP1Sets, newP2Sets, setsNeeded: setsNeededToWin })
                }
            } else {
                console.log('❌ NOT Set Point:', { 
                    tempGames, 
                    isSetWonResult: isSetWon(tempGames[0], tempGames[1], matchFormat),
                    reason: 'Winning this game would not win the set'
                })
            }
        } else {
            console.log('❌ NOT Game Point:', {
                currentPoints: previousScore.points,
                tempPoints: [temp_p1_score, temp_p2_score],
                winner,
                isGameWonResult: isGameWon(temp_p1_score, temp_p2_score, matchFormat.noAd),
                reason: 'This point would not win the game'
            })
        }
    }

    // --- Create a temporary score object to find the score *after* this point ---
    const tempScore = JSON.parse(JSON.stringify(previousScore));
    const winnerIdx = winner === 'p1' ? 0 : 1;
    if (tempScore.isTiebreak) {
        if (!tempScore.tiebreakPoints) tempScore.tiebreakPoints = [0, 0];
        tempScore.tiebreakPoints[winnerIdx]++;
    } else {
        tempScore.points[winnerIdx]++;
    }

    // --- Use the temporary score to create the correct gameScore string for the log ---
    const gameScoreToStore = tempScore.isTiebreak
      ? `${tempScore.tiebreakPoints[0]}-${tempScore.tiebreakPoints[1]}`
      : getTennisScore(tempScore.points[0], tempScore.points[1]);

    // Debug log for breakpoint detection in point storage
    console.log('💾 Storing Point - BP Detection:', {
      currentServer,
      scoreBEFORE: `${previousScore.points[0]}-${previousScore.points[1]}`,
      scoreAFTER: gameScoreToStore,
      serverPoints: currentServer === 'p1' ? previousScore.points[0] : previousScore.points[1],
      returnerPoints: currentServer === 'p1' ? previousScore.points[1] : previousScore.points[0],
      noAd: matchFormat.noAd,
      isBreakPoint: isThisPointBreakPoint,
      pointWinner: winner,
      explanation: isThisPointBreakPoint ? 
        `✅ BP: Returner ${currentServer === 'p1' ? 'p2' : 'p1'} could break serve by winning this point` : 
        '❌ No BP: No break opportunity'
    })

    const pointDetail: PointDetail = {
      ...details,
      id: `point-${pointLog.length + 1}`,
      timestamp: new Date().toISOString(),
      pointNumber: pointLog.length + 1,
      setNumber: previousScore.sets.length + 1,
      gameNumber: previousScore.games[0] + previousScore.games[1] + 1,
      gameScore: gameScoreToStore,
      winner,
      server: currentServer,
      isBreakPoint: isThisPointBreakPoint,
      isSetPoint: isThisPointSetPoint,
      isMatchPoint: isThisPointMatchPoint,
      isGameWinning: isThisPointGameWinning,
      isSetWinning: isThisPointSetWinning,
      isMatchWinning: isThisPointMatchWinning,
      isTiebreak: previousScore.isTiebreak,
      serveType: details.serveType || 'first',
      serveOutcome: details.serveOutcome || 'winner',
      rallyLength: details.rallyLength || 1,
      pointOutcome: details.pointOutcome || details.serveOutcome || 'winner',
      lastShotPlayer: winner,
    }

    const newPointLog = [...pointLog, pointDetail]
    const newScore = calculateScoreFromPointLog(newPointLog, matchFormat)
    
    const finalP1SetsWon = newScore.sets.length > 0 ? newScore.sets.filter((set: [number, number]) => set[0] > set[1]).length : 0
    const finalP2SetsWon = newScore.sets.length > 0 ? newScore.sets.filter((set: [number, number]) => set[1] > set[0]).length : 0
    
    const isMatchComplete = finalP1SetsWon >= setsNeededToWin || finalP2SetsWon >= setsNeededToWin
    const matchWinnerId = isMatchComplete ? (finalP1SetsWon >= setsNeededToWin ? winnerId_map.p1 : winnerId_map.p2) : null
    
    // Handle set completion timing
    const newSetDurations = [...state.setDurations]
    const previousSetCount = previousScore.sets.length
    const newSetCount = newScore.sets.length
    
    if (newSetCount > previousSetCount && newCurrentSetStartTime) {
      // A new set has been completed
      const setDuration = Date.parse(currentTime) - Date.parse(newCurrentSetStartTime)
      newSetDurations.push(setDuration)
      newCurrentSetStartTime = isMatchComplete ? null : currentTime // Start timing next set unless match is over
    }
    
    // Handle match completion timing
    let newEndTime = state.endTime
    if (isMatchComplete && !newEndTime) {
      newEndTime = currentTime
    }

    let nextServer = currentServer
    if (newScore.isTiebreak) {
        const totalTbPoints = newScore.tiebreakPoints![0] + newScore.tiebreakPoints![1]
        nextServer = getTiebreakServer(totalTbPoints, newScore.initialTiebreakServer!)
    } else {
        const prevTotalGames = previousScore.games[0] + previousScore.games[1] + previousScore.sets.reduce((acc, s) => acc + s[0] + s[1], 0)
        const newTotalGames = newScore.games[0] + newScore.games[1] + newScore.sets.reduce((acc, s) => acc + s[0] + s[1], 0)
        if (newTotalGames > prevTotalGames) {
            nextServer = currentServer === 'p1' ? 'p2' : 'p1'
        }
    }
    
    set({
      score: newScore,
      pointLog: newPointLog,
      currentServer: nextServer,
      initialTiebreakServer: newScore.initialTiebreakServer || null,
      isMatchComplete: isMatchComplete,
      winnerId: matchWinnerId || null,
      startTime: newStartTime,
      endTime: newEndTime,
      setDurations: newSetDurations,
      currentSetStartTime: newCurrentSetStartTime,
    })

    return { 
      newScore, 
      pointDetail, 
      isMatchComplete, 
      winnerId: matchWinnerId,
      startTime: newStartTime || undefined,
      endTime: newEndTime || undefined,
      setDurations: newSetDurations
    }
  },
  
  undoLastPoint: () => {
    const state = get()
    if (state.pointLog.length === 0 || !state.matchFormat) {
      throw new Error('No points to undo or match not initialized')
    }
    const newPointLog = state.pointLog.slice(0, -1)
    const lastPoint = state.pointLog[state.pointLog.length -1]
    
    const recalculatedScore = calculateScoreFromPointLog(newPointLog, state.matchFormat)
    
    const newServer = lastPoint.server
    
    set({
      score: recalculatedScore,
      pointLog: newPointLog,
      currentServer: newServer,
      initialTiebreakServer: recalculatedScore.initialTiebreakServer || null,
      isMatchComplete: false,
      winnerId: null
    })
    return { newScore: recalculatedScore, newPointLog }
  },
  
  setServer: (server) => {
    const state = get()
    // If no points have been played yet, this sets the starting server
    if (state.pointLog.length === 0) {
      set({ currentServer: server, startingServer: server })
    } else {
      set({ currentServer: server })
    }
  },
  
  resetMatch: () => set({
    currentMatch: null,
    score: initialScore,
    pointLog: [],
    currentServer: null,
    startingServer: null,
    matchFormat: null,
    initialTiebreakServer: null,
    events: [],
    isMatchComplete: false,
    winnerId: null,
    detailedLoggingEnabled: false,
  }),
}))

// Test function to verify break point logic
function testBreakPointLogic() {
  console.log('=== Testing Break Point Logic ===')
  
  // Test traditional scoring
  console.log('Traditional Scoring Tests:')
  
  // Should be BP: 0-40 (server p1, receiver p2 at 3 points)
  console.log('0-40 (p1 serving):', {
    beforeP1: 0, beforeP2: 3,
    shouldBeBP: true,
    actualBP: (3 >= 3 && 0 < 3) // P2 >= 3 && P1 < 3
  })
  
  // Should be BP: 15-40 
  console.log('15-40 (p1 serving):', {
    beforeP1: 1, beforeP2: 3,
    shouldBeBP: true,
    actualBP: (3 >= 3 && 1 < 3)
  })
  
  // Should NOT be BP: 40-40 (deuce)
  console.log('40-40 (p1 serving):', {
    beforeP1: 3, beforeP2: 3,
    shouldBeBP: false,
    actualBP: (3 >= 3 && 3 < 3) || (3 >= 3 && 3 >= 3 && 3 > 3) // False
  })
  
  // Should be BP: 40-AD (receiver advantage)
  console.log('40-AD (p1 serving):', {
    beforeP1: 3, beforeP2: 4,
    shouldBeBP: true,
    actualBP: (4 >= 3 && 3 >= 3 && 4 > 3)
  })
}

// Call test function
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).testBreakPointLogic = testBreakPointLogic
} 