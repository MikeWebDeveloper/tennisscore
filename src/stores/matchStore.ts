import { create } from 'zustand'
import { 
  isGameWon, 
  isSetWon, 
  getGameWinner, 
  getServer, 
  shouldStartTiebreak,
  isTiebreakWon,
  getTiebreakWinner,
  getTiebreakServer
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
  matchFormat: MatchFormat | null
  
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
}

// Helper function to recalculate score from point log with enhanced logic
const calculateScoreFromPointLog = (log: PointDetail[], format: MatchFormat): Score => {
  const sets: Array<[number, number]> = []
  let games: [number, number] = [0, 0]
  let points: [number, number] = [0, 0]
  let isTiebreak = false
  let tiebreakPoints: [number, number] = [0, 0]

  for (const point of log) {
    if (isTiebreak) {
      if (point.winner === "p1") {
        tiebreakPoints[0]++
      } else {
        tiebreakPoints[1]++
      }
      const tiebreakTarget = format.finalSetTiebreakAt && shouldStartTiebreak(games[0], games[1], format) ? format.finalSetTiebreakAt : 7
      if (isTiebreakWon(tiebreakPoints[0], tiebreakPoints[1], tiebreakTarget)) {
        const tiebreakWinner = getTiebreakWinner(tiebreakPoints[0], tiebreakPoints[1], tiebreakTarget)
        if (tiebreakWinner === "p1") games[0]++
        else if (tiebreakWinner === "p2") games[1]++
        isTiebreak = false
        tiebreakPoints = [0, 0]
        if (isSetWon(games[0], games[1], format)) {
          sets.push([games[0], games[1]])
          games = [0, 0]
        }
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
    tiebreakPoints
  }
}

export const useMatchStore = create<MatchState>((set, get) => ({
  currentMatch: null,
  setCurrentMatch: (match) => set({ currentMatch: match }),
  
  score: initialScore,
  pointLog: [],
  currentServer: null,
  matchFormat: null,
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
    
    if (pointLog.length > 0) {
      // Recalculate score from point log to ensure consistency
      const recalculatedScore = calculateScoreFromPointLog(pointLog, match.matchFormat)
      if (recalculatedScore.isTiebreak) {
        const totalTiebreakPoints = recalculatedScore.tiebreakPoints![0] + recalculatedScore.tiebreakPoints![1]
        calculatedServer = getTiebreakServer(totalTiebreakPoints + 1)
      } else {
        const totalGamesPlayed = recalculatedScore.sets.reduce((sum, set) => sum + set[0] + set[1], 0) + recalculatedScore.games[0] + recalculatedScore.games[1]
        calculatedServer = getServer(totalGamesPlayed + 1)
      }
      
      set({
        currentMatch: match,
        score: recalculatedScore,
        pointLog,
        currentServer: calculatedServer,
        matchFormat: match.matchFormat,
        isMatchComplete: match.status === 'Completed',
        winnerId: match.winnerId || null,
        events: match.events || []
      })
    } else {
      // For new matches, default to player 1 serving first
      calculatedServer = 'p1'
      
      set({
        currentMatch: match,
        score,
        pointLog,
        currentServer: calculatedServer,
        matchFormat: match.matchFormat,
        isMatchComplete: match.status === 'Completed',
        winnerId: match.winnerId || null,
        events: match.events || []
      })
    }
  },
  
  awardPoint: (winner, details) => {
    const state = get()
    
    // Guard clause: Prevent scoring if match is already complete
    if (state.isMatchComplete) {
      // Note: toast import would need to be added at the top of the file
      // For now, we'll just throw an error to prevent further scoring
      throw new Error('Match is already complete and cannot be modified.')
    }
    
    if (!state.currentServer || !state.matchFormat || !state.currentMatch) {
      throw new Error('Match not properly initialized')
    }

    const newScore = { ...state.score }
    let isTiebreak = state.score.isTiebreak || false
    let tiebreakPoints = state.score.tiebreakPoints ? [...state.score.tiebreakPoints] : [0, 0]
    let matchStatus: "In Progress" | "Completed" = "In Progress"
    let matchWinnerId: string | undefined = undefined
    let newServer = state.currentServer
    let pointDetail: PointDetail | undefined = undefined;

    // --- TIE-BREAK SCORING LOGIC ---
    if (isTiebreak) {
      const winnerIdx = winner === 'p1' ? 0 : 1
      tiebreakPoints[winnerIdx]++
      const target = (state.matchFormat.finalSetTiebreak && newScore.sets.length + 1 === state.matchFormat.sets) ? 10 : 7
      if (isTiebreakWon(tiebreakPoints[0], tiebreakPoints[1], target)) {
        // Award set 7-6 or 6-7
        const setWinner = getTiebreakWinner(tiebreakPoints[0], tiebreakPoints[1], target)
        const setScore: [number, number] = setWinner === 'p1' ? [7, 6] : [6, 7]
        newScore.sets = [...newScore.sets, setScore]
        newScore.games = [0, 0]
        newScore.points = [0, 0]
        isTiebreak = false
        tiebreakPoints = [0, 0]
        newScore.isTiebreak = false
        newScore.tiebreakPoints = [0, 0]
        
        // --- IMPROVED MATCH COMPLETION LOGIC ---
        const p1SetsWon = newScore.sets.filter(set => set[0] > set[1]).length
        const p2SetsWon = newScore.sets.filter(set => set[1] > set[0]).length
        const setsToWin = Math.ceil(state.matchFormat.sets / 2)  // For best-of-3: need 2 sets, for best-of-5: need 3 sets
        
        if (p1SetsWon >= setsToWin) {
          matchStatus = "Completed"
          matchWinnerId = state.currentMatch.playerOneId
        } else if (p2SetsWon >= setsToWin) {
          matchStatus = "Completed"
          matchWinnerId = state.currentMatch.playerTwoId
        }
        
        pointDetail = {
          ...details,
          id: `point-${state.pointLog.length + 1}`,
          timestamp: new Date().toISOString(),
          pointNumber: state.pointLog.length + 1,
          setNumber: newScore.sets.length,
          gameNumber: 0,
          gameScore: `${tiebreakPoints[0]}-${tiebreakPoints[1]}`,
          winner,
          server: state.currentServer,
          serveType: details.serveType || 'first',
          serveOutcome: details.serveOutcome || 'winner',
          rallyLength: details.rallyLength || 1,
          pointOutcome: details.pointOutcome || details.serveOutcome || 'winner',
          lastShotPlayer: winner,
          isBreakPoint: false,
          isSetPoint: false,
          isMatchPoint: matchStatus === 'Completed',
          isGameWinning: false,
          isSetWinning: false,
          isMatchWinning: matchStatus === 'Completed',
          isTiebreak: true,
        } as PointDetail;
      } else {
        // Continue tiebreak, alternate server every 2 points
        const totalTiebreakPoints = tiebreakPoints[0] + tiebreakPoints[1]
        // In tiebreak: first point by player who would serve next game, then alternate every 2 points
        // Points 1,2 -> server A, points 3,4 -> server B, points 5,6 -> server A, etc.
        const totalGamesBeforeTiebreak = newScore.sets.reduce((sum, set) => sum + set[0] + set[1], 0) + newScore.games[0] + newScore.games[1]
        const initialTiebreakServer = getServer(totalGamesBeforeTiebreak + 1)
        newServer = Math.floor((totalTiebreakPoints - 1) / 2) % 2 === 0 ? initialTiebreakServer : (initialTiebreakServer === 'p1' ? 'p2' : 'p1')
        newScore.isTiebreak = true
        newScore.tiebreakPoints = [tiebreakPoints[0], tiebreakPoints[1]]
        pointDetail = {
          ...details,
          id: `point-${state.pointLog.length + 1}`,
          timestamp: new Date().toISOString(),
          pointNumber: state.pointLog.length + 1,
          setNumber: newScore.sets.length + 1,
          gameNumber: 0, // Tiebreak is game 0
          gameScore: `${tiebreakPoints[0]}-${tiebreakPoints[1]}`,
          winner,
          server: state.currentServer,
          serveType: details.serveType || 'first',
          serveOutcome: details.serveOutcome || 'winner',
          rallyLength: details.rallyLength || 1,
          pointOutcome: details.pointOutcome || details.serveOutcome || 'winner',
          lastShotPlayer: winner,
          isBreakPoint: false,
          isSetPoint: false,
          isMatchPoint: false,
          isGameWinning: false,
          isSetWinning: false,
          isMatchWinning: false,
          isTiebreak: true,
        } as PointDetail;
      }
      set({
        score: newScore,
        pointLog: [...state.pointLog, pointDetail!],
        currentServer: newServer,
        isMatchComplete: matchStatus === "Completed",
        winnerId: matchWinnerId || null
      })
      return { newScore, pointDetail: pointDetail!, isMatchComplete: matchStatus === "Completed", winnerId: matchWinnerId }
    }

    // --- STANDARD GAME SCORING LOGIC ---
    const winnerIdx = winner === 'p1' ? 0 : 1
    newScore.points[winnerIdx]++
    if (isGameWon(newScore.points[0], newScore.points[1], state.matchFormat.noAd)) {
      newScore.games[winnerIdx]++
      newScore.points = [0, 0]
      // After a game is won, check for tie-break condition:
      if (shouldStartTiebreak(newScore.games[0], newScore.games[1], state.matchFormat)) {
        isTiebreak = true
        tiebreakPoints = [0, 0]
        newScore.isTiebreak = true
        newScore.tiebreakPoints = [0, 0]
        // The server for tiebreak is the player who would serve the next game (13th game)
        // Don't change server here - it will be set correctly for the first tiebreak point
      } else if (isSetWon(newScore.games[0], newScore.games[1], state.matchFormat)) {
        // Award set
        newScore.sets.push([newScore.games[0], newScore.games[1]])
        newScore.games = [0, 0]

        // --- IMPROVED MATCH & SUPER TIE-BREAK COMPLETION LOGIC ---
        const p1SetsWon = newScore.sets.filter(set => set[0] > set[1]).length
        const p2SetsWon = newScore.sets.filter(set => set[1] > set[0]).length
        const setsToWin = Math.ceil(state.matchFormat.sets / 2)  // For best-of-3: need 2 sets, for best-of-5: need 3 sets

        // Check for match completion FIRST
        if (p1SetsWon >= setsToWin) {
          matchStatus = "Completed"
          matchWinnerId = state.currentMatch.playerOneId
        } else if (p2SetsWon >= setsToWin) {
          matchStatus = "Completed"
          matchWinnerId = state.currentMatch.playerTwoId
        } 
        // Only check for super tie-break if match is NOT complete
        else if (state.matchFormat.finalSetTiebreak && p1SetsWon === p2SetsWon && p1SetsWon === setsToWin - 1) {
          // This means it's tied at one set each in best-of-3, or two sets each in best-of-5
          // Start a super tie-break instead of a final set
          isTiebreak = true
          tiebreakPoints = [0, 0]
          newScore.isTiebreak = true
          newScore.tiebreakPoints = [0, 0]
          // Server for the super tiebreak remains the same as current server
          // (the player who would serve the next game)
        }
      }
      
      // Server alternates after each game, but NOT when a super tiebreak is about to start
      if (!isTiebreak) {
        newServer = newServer === 'p1' ? 'p2' : 'p1'
      }
    }
    pointDetail = {
      ...details,
      id: `point-${state.pointLog.length + 1}`,
      timestamp: new Date().toISOString(),
      pointNumber: state.pointLog.length + 1,
      setNumber: newScore.sets.length + 1,
      gameNumber: newScore.games[0] + newScore.games[1] + 1,
      gameScore: `${newScore.points[0]}-${newScore.points[1]}`,
      winner,
      server: state.currentServer,
      serveType: details.serveType || 'first',
      serveOutcome: details.serveOutcome || 'winner',
      rallyLength: details.rallyLength || 1,
      pointOutcome: details.pointOutcome || details.serveOutcome || 'winner',
      lastShotPlayer: winner,
      isBreakPoint: false,
      isSetPoint: false,
      isMatchPoint: matchStatus === 'Completed',
      isGameWinning: false,
      isSetWinning: false,
      isMatchWinning: matchStatus === 'Completed',
      isTiebreak: false,
    }
    set({
      score: newScore,
      pointLog: [...state.pointLog, pointDetail],
      currentServer: newServer,
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
    const recalculatedScore = calculateScoreFromPointLog(newPointLog, state.matchFormat)
    let newServer: 'p1' | 'p2' | null = null
    if (newPointLog.length > 0) {
      if (recalculatedScore.isTiebreak) {
        const totalTiebreakPoints = recalculatedScore.tiebreakPoints![0] + recalculatedScore.tiebreakPoints![1]
        newServer = getTiebreakServer(totalTiebreakPoints + 1)
      } else {
        const totalGamesPlayed = recalculatedScore.sets.reduce((sum, set) => sum + set[0] + set[1], 0) + recalculatedScore.games[0] + recalculatedScore.games[1]
        newServer = getServer(totalGamesPlayed + 1)
      }
    }
    set({
      score: recalculatedScore,
      pointLog: newPointLog,
      currentServer: newServer,
      isMatchComplete: false,
      winnerId: null
    })
    return { newScore: recalculatedScore, newPointLog }
  },
  
  setServer: (server) => set({ currentServer: server }),
  
  resetMatch: () => set({
    currentMatch: null,
    score: initialScore,
    pointLog: [],
    currentServer: null,
    matchFormat: null,
    events: [],
    isMatchComplete: false,
    winnerId: null,
    detailedLoggingEnabled: false,
  }),
})) 