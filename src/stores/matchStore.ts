import { create } from 'zustand'
import { 
  isGameWon, 
  isSetWon, 
  getGameWinner, 
  getServer, 
  shouldStartTiebreak,
  isTiebreakWon,
  getTiebreakWinner,
  getTiebreakServer,
  getTennisScore
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
    winnerId?: string
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

// Helper function to recalculate score from point log with enhanced logic
const calculateScoreFromPointLog = (log: PointDetail[], format: MatchFormat): Score => {
  const sets: Array<[number, number]> = []
  let games: [number, number] = [0, 0]
  let points: [number, number] = [0, 0]
  let isTiebreak = false
  let tiebreakPoints: [number, number] = [0, 0]
  let initialTiebreakServer: 'p1' | 'p2' | undefined = undefined

  // Calculate sets needed to win match
  const setsToWin = Math.ceil(format.sets / 2)

  for (const point of log) {
    // Check if match is already complete before processing this point
    const p1SetsWon = sets.filter(set => set[0] > set[1]).length
    const p2SetsWon = sets.filter(set => set[1] > set[0]).length
    if (p1SetsWon >= setsToWin || p2SetsWon >= setsToWin) {
      // Match is complete, stop processing points
      break
    }

    // Check if this should be a super tie-break (deciding set with tied sets)
    const isDecidingSet = p1SetsWon === setsToWin - 1 && p2SetsWon === setsToWin - 1
    const shouldBeSupetTiebreak = isDecidingSet && format.finalSetTiebreak && games[0] === 0 && games[1] === 0

    if (isTiebreak || shouldBeSupetTiebreak) {
      if (!isTiebreak) {
        // Start super tie-break
        isTiebreak = true
        tiebreakPoints = [0, 0]
        initialTiebreakServer = 'p1'
      }
      
      if (point.winner === "p1") {
        tiebreakPoints[0]++
      } else {
        tiebreakPoints[1]++
      }
      const tiebreakTarget = (format.finalSetTiebreak && isDecidingSet) ? (format.finalSetTiebreakAt || 10) : 7
      if (isTiebreakWon(tiebreakPoints[0], tiebreakPoints[1], tiebreakTarget)) {
        const tiebreakWinner = getTiebreakWinner(tiebreakPoints[0], tiebreakPoints[1], tiebreakTarget)
        if (tiebreakWinner === "p1") games[0]++
        else if (tiebreakWinner === "p2") games[1]++
        
        if (isSetWon(games[0], games[1], format)) {
          sets.push([games[0], games[1]])
          games = [0, 0]
        }
        isTiebreak = false
        tiebreakPoints = [0, 0]
        initialTiebreakServer = undefined
      }
    } else {
      if (point.winner === "p1") {
        points[0]++
      } else {
        points[1]++
      }
      if (isGameWon(points[0], points[1], format.noAd)) {
        const gameWinner = getGameWinner(points[0], points[1], format.noAd)
        if (gameWinner === "p1") games[0]++
        else if (gameWinner === "p2") games[1]++
        points = [0, 0]
        if (shouldStartTiebreak(games[0], games[1], format)) {
          isTiebreak = true
          tiebreakPoints = [0, 0]
          const totalGamesPlayed = sets.reduce((sum, set) => sum + set[0] + set[1], 0) + games[0] + games[1]
          initialTiebreakServer = getServer(totalGamesPlayed)
        } else if (isSetWon(games[0], games[1], format)) {
          sets.push([games[0], games[1]])
          games = [0, 0]
        }
      }
    }
  }
  return {
    sets,
    games: games.length === 2 ? [games[0], games[1]] : [0, 0],
    points,
    isTiebreak,
    tiebreakPoints,
    initialTiebreakServer,
  }
}

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
      // Recalculate score from point log to ensure consistency
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
        events: match.events || []
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

    const newScore: Score = JSON.parse(JSON.stringify(state.score))
    const { matchFormat, currentServer } = state
    const winnerIdx = winner === 'p1' ? 0 : 1
    
    let isThisPointGameWinning = false
    let isThisPointSetWinning = false
    let isThisPointMatchWinning = false
    let matchStatus: "In Progress" | "Completed" = "In Progress"
    let matchWinnerId: string | undefined = undefined
    let nextServer = currentServer

    const setsNeededToWin = Math.ceil(matchFormat.sets / 2)
    const currentP1SetsWon = newScore.sets.filter((s: [number, number]) => s[0] > s[1]).length
    const currentP2SetsWon = newScore.sets.filter((s: [number, number]) => s[1] > s[0]).length
    const isDecidingSet = currentP1SetsWon === setsNeededToWin - 1 && currentP2SetsWon === setsNeededToWin - 1

    let isThisPointBreakPoint = false
    let isThisPointSetPoint = false
    let isThisPointMatchPoint = false

    // --- FINAL REVISED BREAK POINT & GAME/SET/MATCH POINT LOGIC ---
    // This logic runs BEFORE the point is awarded.
    // It answers the question: "If the receiver wins THIS point, do they win the game?"
    const [p1Score, p2Score] = newScore.points
    const isTiebreak = newScore.isTiebreak || false

    if (isTiebreak) {
        const tiebreakTarget = (matchFormat.finalSetTiebreak && isDecidingSet) 
            ? (matchFormat.finalSetTiebreakAt || 10) 
            : 7
        const [p1_tb, p2_tb] = newScore.tiebreakPoints || [0,0]

        // Check if P1 has set/match point
        const p1WinsNextPoint = isTiebreakWon(p1_tb + 1, p2_tb, tiebreakTarget);
        if (p1WinsNextPoint) {
            isThisPointSetPoint = true
            if (currentP1SetsWon === setsNeededToWin - 1) isThisPointMatchPoint = true
        }

        // Check if P2 has set/match point
        const p2WinsNextPoint = isTiebreakWon(p1_tb, p2_tb + 1, tiebreakTarget);
        if (p2WinsNextPoint) {
            isThisPointSetPoint = true
            if (currentP2SetsWon === setsNeededToWin - 1) isThisPointMatchPoint = true
        }
    } else {
        // Standard Game
        const p1ScoreIfP1Wins = p1Score + 1;
        const p2ScoreIfP2Wins = p2Score + 1;

        // Check if P1 (as receiver) has a break point opportunity
        if (currentServer === 'p2' && isGameWon(p1ScoreIfP1Wins, p2Score, matchFormat.noAd)) {
            isThisPointBreakPoint = true;
            // Check if it's also a set/match point
            if (isSetWon(newScore.games[0] + 1, newScore.games[1], matchFormat)) {
                isThisPointSetPoint = true;
                if (currentP1SetsWon === setsNeededToWin - 1) isThisPointMatchPoint = true;
            }
        }

        // Check if P2 (as receiver) has a break point opportunity
        if (currentServer === 'p1' && isGameWon(p1Score, p2ScoreIfP2Wins, matchFormat.noAd)) {
            isThisPointBreakPoint = true;
            // Check if it's also a set/match point
            if (isSetWon(newScore.games[0], newScore.games[1] + 1, matchFormat)) {
                isThisPointSetPoint = true;
                if (currentP2SetsWon === setsNeededToWin - 1) isThisPointMatchPoint = true;
            }
        }

        // Check if Server has a set/match point opportunity (but not a break point)
        if (!isThisPointBreakPoint) {
            if (currentServer === 'p1' && isGameWon(p1ScoreIfP1Wins, p2Score, matchFormat.noAd)) {
                if(isSetWon(newScore.games[0] + 1, newScore.games[1], matchFormat)) {
                    isThisPointSetPoint = true;
                    if (currentP1SetsWon === setsNeededToWin - 1) isThisPointMatchPoint = true;
                }
            }
            if (currentServer === 'p2' && isGameWon(p1Score, p2ScoreIfP2Wins, matchFormat.noAd)) {
                 if(isSetWon(newScore.games[0], newScore.games[1] + 1, matchFormat)) {
                    isThisPointSetPoint = true;
                    if (currentP2SetsWon === setsNeededToWin - 1) isThisPointMatchPoint = true;
                }
            }
        }
    }

    // --- AWARD POINT ---
    if (newScore.isTiebreak) {
      if (!newScore.tiebreakPoints) newScore.tiebreakPoints = [0, 0]
      newScore.tiebreakPoints[winnerIdx]++
      const [p1_tb_after, p2_tb_after] = newScore.tiebreakPoints
      
      if (isTiebreakWon(p1_tb_after, p2_tb_after, 7)) {
        isThisPointGameWinning = true
        isThisPointSetWinning = true
        const setWinner = getTiebreakWinner(p1_tb_after, p2_tb_after, 7)
        
        newScore.games[setWinner === 'p1' ? 0 : 1]++
        newScore.sets.push(newScore.games as [number, number])

        // Check for match win
        const p1SetsWon = newScore.sets.filter((s: [number, number]) => s[0] > s[1]).length
        const p2SetsWon = newScore.sets.filter((s: [number, number]) => s[1] > s[0]).length
        
        if (p1SetsWon >= setsNeededToWin || p2SetsWon >= setsNeededToWin) {
          isThisPointMatchWinning = true
          matchStatus = "Completed"
          matchWinnerId = p1SetsWon >= setsNeededToWin ? state.currentMatch.playerOneId : state.currentMatch.playerTwoId
        }
        
        // Reset for next set - Player 1 always serves first game of new set
        newScore.games = [0, 0]
        newScore.points = [0, 0]
        newScore.isTiebreak = false
        newScore.tiebreakPoints = [0, 0]
        newScore.initialTiebreakServer = undefined
        nextServer = 'p1' // P1 serves first game of new set
      } else {
        // Continue tiebreak, determine next server
        const totalTbPoints = p1_tb_after + p2_tb_after
        nextServer = getTiebreakServer(totalTbPoints, newScore.initialTiebreakServer!)
      }
    } 
    // --- STANDARD GAME LOGIC ---
    else {
      newScore.points[winnerIdx]++
      const [p1, p2] = newScore.points
      
      if (isGameWon(p1, p2, matchFormat.noAd)) {
        isThisPointGameWinning = true
        newScore.games[winnerIdx]++
        newScore.points = [0, 0]
        
        // FIXED: Proper serve alternation for regular games
        nextServer = currentServer === 'p1' ? 'p2' : 'p1'

        // Check for set win
        const [g1, g2] = newScore.games
        if (shouldStartTiebreak(g1, g2, matchFormat)) {
          newScore.isTiebreak = true
          // FIXED: Keep the nextServer as the one who should serve next in tiebreak
          newScore.initialTiebreakServer = nextServer 
        } else if (isSetWon(g1, g2, matchFormat)) {
          isThisPointSetWinning = true
          newScore.sets.push(newScore.games as [number, number])

          // Check for match win
          const p1SetsWon = newScore.sets.filter((s: [number, number]) => s[0] > s[1]).length
          const p2SetsWon = newScore.sets.filter((s: [number, number]) => s[1] > s[0]).length

          if (p1SetsWon >= setsNeededToWin || p2SetsWon >= setsNeededToWin) {
            isThisPointMatchWinning = true
            matchStatus = "Completed"
            matchWinnerId = p1SetsWon >= setsNeededToWin ? state.currentMatch.playerOneId : state.currentMatch.playerTwoId
          } else {
            // FIXED: Check if next set should start as super tie-break
            const newP1SetsWon = newScore.sets.filter((s: [number, number]) => s[0] > s[1]).length
            const newP2SetsWon = newScore.sets.filter((s: [number, number]) => s[1] > s[0]).length
            const willBeDecidingSet = newP1SetsWon === setsNeededToWin - 1 && newP2SetsWon === setsNeededToWin - 1
            
            if (willBeDecidingSet && matchFormat.finalSetTiebreak) {
              // Start super tie-break immediately
              newScore.isTiebreak = true
              newScore.tiebreakPoints = [0, 0]
              newScore.initialTiebreakServer = 'p1' // P1 serves first in super tie-break
              nextServer = 'p1'
            } else {
              nextServer = 'p1'
            }
          }
          
          // Reset for next set 
          newScore.games = [0, 0]
        }
      }
      // FIXED: For regular points within a game, server doesn't change
      // nextServer remains the same as currentServer
    }

    // --- CREATE POINT DETAIL ---
    // The point flags (isBreakPoint, etc.) are determined above, before the point is awarded.
    const currentSetNumber = state.score.sets.length + 1
    const currentGameNumber = (state.score.games[0] + state.score.games[1]) + 1
    
    // Store the score BEFORE this point is awarded.
    const gameScoreToStore = state.score.isTiebreak 
        ? `${state.score.tiebreakPoints?.[0] || 0}-${state.score.tiebreakPoints?.[1] || 0}`
        : getTennisScore(state.score.points[0], state.score.points[1]);

    const pointDetail: PointDetail = {
      ...details,
      id: `point-${state.pointLog.length + 1}`,
      timestamp: new Date().toISOString(),
      pointNumber: state.pointLog.length + 1,
      setNumber: currentSetNumber,
      gameNumber: currentGameNumber,
      gameScore: gameScoreToStore,
      winner,
      server: currentServer,
      isBreakPoint: isThisPointBreakPoint,
      isSetPoint: isThisPointSetPoint,
      isMatchPoint: isThisPointMatchPoint,
      isGameWinning: isThisPointGameWinning,
      isSetWinning: isThisPointSetWinning,
      isMatchWinning: isThisPointMatchWinning,
      isTiebreak: state.score.isTiebreak,
      serveType: details.serveType || 'first',
      serveOutcome: details.serveOutcome || 'winner',
      rallyLength: details.rallyLength || 1,
      pointOutcome: details.pointOutcome || details.serveOutcome || 'winner',
      lastShotPlayer: winner,
    }

    set({
      score: newScore,
      pointLog: [...state.pointLog, pointDetail],
      currentServer: nextServer,
      initialTiebreakServer: newScore.initialTiebreakServer || null,
      isMatchComplete: matchStatus === "Completed",
      winnerId: matchWinnerId || null
    })
    
    return { newScore, pointDetail, isMatchComplete: matchStatus === "Completed", winnerId: matchWinnerId }
  },
  
  undoLastPoint: () => {
    const state = get()
    if (state.pointLog.length === 0 || !state.matchFormat) {
      throw new Error('No points to undo or match not initialized')
    }
    const newPointLog = state.pointLog.slice(0, -1)
    const lastPoint = state.pointLog[state.pointLog.length -1]
    
    // Recalculate score from the new (shorter) point log
    const recalculatedScore = calculateScoreFromPointLog(newPointLog, state.matchFormat)
    
    // The server for the *next* point is the server from the point we just undid.
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