import { create } from 'zustand'
import { 
  isBreakPoint, 
  isGameWon, 
  isSetWon, 
  getGameWinner, 
  getServer, 
  isMatchWon,
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
  sets: Array<{ p1: number; p2: number }>
  games: Array<{ p1: number; p2: number }>
  points: { p1: number; p2: number }
  isTiebreak?: boolean
  tiebreakPoints?: { p1: number; p2: number }
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
  games: [{ p1: 0, p2: 0 }],
  points: { p1: 0, p2: 0 },
  isTiebreak: false,
  tiebreakPoints: { p1: 0, p2: 0 }
}

// Helper function to get point display (0, 15, 30, 40, deuce, advantage)
const getPointDisplay = (points: number) => {
  const pointMap = ["0", "15", "30", "40"]
  if (points < 4) return pointMap[points]
  return "40"
}

// Helper function to get current game score string
const getGameScore = (p1Points: number, p2Points: number, playerNames: { p1: string; p2: string }, isTiebreak: boolean = false) => {
  if (isTiebreak) {
    return `${p1Points} - ${p2Points}`
  }

  const p1Display = getPointDisplay(p1Points)
  const p2Display = getPointDisplay(p2Points)
  
  // Handle deuce situation
  if (p1Points >= 3 && p2Points >= 3) {
    if (p1Points === p2Points) return "DEUCE"
    if (p1Points > p2Points) return `AD-${playerNames.p1.split(' ')[0].toUpperCase()}`
    return `AD-${playerNames.p2.split(' ')[0].toUpperCase()}`
  }
  
  return `${p1Display} - ${p2Display}`
}

// Helper function to recalculate score from point log with enhanced logic
const calculateScoreFromPointLog = (log: PointDetail[], format: MatchFormat): Score => {
  const sets: Array<{ p1: number; p2: number }> = []
  let games = { p1: 0, p2: 0 }
  let points = { p1: 0, p2: 0 }
  let isTiebreak = false
  let tiebreakPoints = { p1: 0, p2: 0 }

  for (const point of log) {
    if (isTiebreak) {
      // Award tiebreak point
      if (point.winner === "p1") {
        tiebreakPoints.p1++
      } else {
        tiebreakPoints.p2++
      }

             // Check if tiebreak is won
       const setsAsArrays = sets.map(set => [set.p1, set.p2])
       const tiebreakTarget = format.finalSetTiebreakAt && shouldStartTiebreak(games.p1, games.p2, format, setsAsArrays) ? format.finalSetTiebreakAt : 7
       if (isTiebreakWon(tiebreakPoints.p1, tiebreakPoints.p2, tiebreakTarget)) {
         // Tiebreak winner gets the game
         const tiebreakWinner = getTiebreakWinner(tiebreakPoints.p1, tiebreakPoints.p2, tiebreakTarget)
         if (tiebreakWinner === "p1") games.p1++
         else if (tiebreakWinner === "p2") games.p2++

         // End tiebreak
         isTiebreak = false
         tiebreakPoints = { p1: 0, p2: 0 }

         // Check if set is won
         if (isSetWon(games.p1, games.p2, format, setsAsArrays)) {
           sets.push({ ...games })
           games = { p1: 0, p2: 0 }
         }
       }
    } else {
      // Regular game scoring
      if (point.winner === "p1") {
        points.p1++
      } else {
        points.p2++
      }

      // Check if game is won
      if (isGameWon(points.p1, points.p2, format.noAd)) {
        const gameWinner = getGameWinner(points.p1, points.p2, format.noAd)
        if (gameWinner === "p1") games.p1++
        else if (gameWinner === "p2") games.p2++

        // Reset points
        points = { p1: 0, p2: 0 }

        // Check if we should start a tiebreak
        const setsAsArrays = sets.map(set => [set.p1, set.p2])
        if (shouldStartTiebreak(games.p1, games.p2, format, setsAsArrays)) {
          isTiebreak = true
          tiebreakPoints = { p1: 0, p2: 0 }
        } else {
          // Check if set is won
          if (isSetWon(games.p1, games.p2, format, setsAsArrays)) {
            sets.push({ ...games })
            games = { p1: 0, p2: 0 }
          }
        }
      }
    }
  }

  return { 
    sets, 
    games: [games], 
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
    
    // Only calculate server if we have points (match has started)
    // Otherwise leave as null for dynamic selection
    let calculatedServer: 'p1' | 'p2' | null = null
    if (pointLog.length > 0) {
      const totalGamesPlayed = score.sets.reduce((sum, set) => sum + set.p1 + set.p2, 0) + 
                              (score.games[0]?.p1 || 0) + (score.games[0]?.p2 || 0)
      calculatedServer = getServer(totalGamesPlayed + 1)
    }
    
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
  },
  
  awardPoint: (winner, details) => {
    const state = get()
    if (!state.currentServer || !state.matchFormat || !state.currentMatch) {
      throw new Error('Match not properly initialized')
    }
    
    // Calculate new score based on the awarded point
    const newScore = { ...state.score }
    let matchWinnerId: string | undefined = undefined
    let newServer = state.currentServer
    let matchStatus: "In Progress" | "Completed" = "In Progress"

    if (newScore.isTiebreak) {
      // Tiebreak scoring
      if (winner === "p1") {
        newScore.tiebreakPoints!.p1++
      } else {
        newScore.tiebreakPoints!.p2++
      }

               // Check if tiebreak is won
         const setsAsArrays = newScore.sets.map(set => [set.p1, set.p2])
         const tiebreakTarget = state.matchFormat.finalSetTiebreakAt && 
           shouldStartTiebreak(newScore.games[0].p1, newScore.games[0].p2, state.matchFormat, setsAsArrays) 
           ? state.matchFormat.finalSetTiebreakAt : 7
        
      if (isTiebreakWon(newScore.tiebreakPoints!.p1, newScore.tiebreakPoints!.p2, tiebreakTarget)) {
        // Tiebreak winner gets the game
        const tiebreakWinner = getTiebreakWinner(newScore.tiebreakPoints!.p1, newScore.tiebreakPoints!.p2, tiebreakTarget)
        if (tiebreakWinner === "p1") newScore.games[0].p1++
        else if (tiebreakWinner === "p2") newScore.games[0].p2++

        // End tiebreak
        newScore.isTiebreak = false
        newScore.tiebreakPoints = { p1: 0, p2: 0 }

        // Check if set is won
        const setsAsArrays = newScore.sets.map(set => [set.p1, set.p2])
        if (isSetWon(newScore.games[0].p1, newScore.games[0].p2, state.matchFormat, setsAsArrays)) {
          newScore.sets.push({ ...newScore.games[0] })
          newScore.games = [{ p1: 0, p2: 0 }]

          // Check if match is won
          const matchResult = isMatchWon(newScore.sets.map(set => [set.p1, set.p2]), state.matchFormat)
          if (matchResult.won) {
            matchStatus = "Completed"
            matchWinnerId = matchResult.winner === "p1" ? state.currentMatch.playerOneId : state.currentMatch.playerTwoId
          }
        }

        // Server switches after tiebreak
        newServer = newServer === 'p1' ? 'p2' : 'p1'
      } else {
        // Tiebreak continues - server alternates every 2 points
        const totalTiebreakPoints = newScore.tiebreakPoints!.p1 + newScore.tiebreakPoints!.p2
        newServer = getTiebreakServer(totalTiebreakPoints + 1)
      }
    } else {
      // Regular game scoring
      if (winner === "p1") {
        newScore.points.p1++
      } else {
        newScore.points.p2++
      }

      // Check if game is won
      if (isGameWon(newScore.points.p1, newScore.points.p2, state.matchFormat.noAd)) {
        const gameWinner = getGameWinner(newScore.points.p1, newScore.points.p2, state.matchFormat.noAd)
        if (gameWinner === "p1") newScore.games[0].p1++
        else if (gameWinner === "p2") newScore.games[0].p2++

        // Reset points
        newScore.points = { p1: 0, p2: 0 }

        // Check if we should start a tiebreak
        const setsAsArrays = newScore.sets.map(set => [set.p1, set.p2])
        if (shouldStartTiebreak(newScore.games[0].p1, newScore.games[0].p2, state.matchFormat, setsAsArrays)) {
          newScore.isTiebreak = true
          newScore.tiebreakPoints = { p1: 0, p2: 0 }
          // Server for tiebreak is determined by tiebreak rules
          newServer = getTiebreakServer(1)
        } else {
          // Check if set is won
          if (isSetWon(newScore.games[0].p1, newScore.games[0].p2, state.matchFormat, setsAsArrays)) {
            newScore.sets.push({ ...newScore.games[0] })
            newScore.games = [{ p1: 0, p2: 0 }]

            // Check if match is won
            const matchResult = isMatchWon(newScore.sets.map(set => [set.p1, set.p2]), state.matchFormat)
            if (matchResult.won) {
              matchStatus = "Completed"
              matchWinnerId = matchResult.winner === "p1" ? state.currentMatch.playerOneId : state.currentMatch.playerTwoId
            }
          }

          // Server switches after each game (except in tiebreak)
          newServer = newServer === 'p1' ? 'p2' : 'p1'
        }
      }
    }
    
    // Get current game and set scores for context
    const currentSetNumber = newScore.sets.length + 1
    const currentGameNumber = newScore.games[0].p1 + newScore.games[0].p2 + 1
    
    // Create point detail with all context
    const pointDetail: PointDetail = {
      id: `point-${state.pointLog.length + 1}`,
      timestamp: new Date().toISOString(),
      pointNumber: state.pointLog.length + 1,
      setNumber: currentSetNumber,
      gameNumber: currentGameNumber,
      gameScore: getGameScore(
        state.score.isTiebreak ? state.score.tiebreakPoints!.p1 : state.score.points.p1, 
        state.score.isTiebreak ? state.score.tiebreakPoints!.p2 : state.score.points.p2, 
        { p1: 'P1', p2: 'P2' },
        state.score.isTiebreak
      ),
      winner,
      server: state.currentServer,
      serveType: details.serveType || 'first',
      serveOutcome: details.serveOutcome || 'winner',
      servePlacement: details.servePlacement,
      serveSpeed: details.serveSpeed,
      rallyLength: details.rallyLength || 1,
      pointOutcome: details.pointOutcome || details.serveOutcome || 'winner',
      lastShotType: details.lastShotType,
      lastShotPlayer: winner,
      isBreakPoint: !state.score.isTiebreak && isBreakPoint(
        state.currentServer === "p1" ? state.score.points.p1 : state.score.points.p2,
        state.currentServer === "p1" ? state.score.points.p2 : state.score.points.p1,
        state.matchFormat.noAd
      ),
      isSetPoint: matchStatus === 'Completed' ? false : newScore.sets.length > state.score.sets.length,
      isMatchPoint: matchStatus === 'Completed',
             isGameWinning: isGameWon(newScore.points.p1, newScore.points.p2, state.matchFormat.noAd) || 
                      (newScore.isTiebreak === true && isTiebreakWon(newScore.tiebreakPoints!.p1, newScore.tiebreakPoints!.p2)),
      isSetWinning: newScore.sets.length > state.score.sets.length,
      isMatchWinning: matchStatus === 'Completed',
      notes: details.notes,
      courtPosition: details.courtPosition
    }

    // Update state
    set({
      score: newScore,
      pointLog: [...state.pointLog, pointDetail],
      currentServer: newServer,
      isMatchComplete: matchStatus === 'Completed',
      winnerId: matchWinnerId || null
    })

    return {
      newScore,
      pointDetail,
      isMatchComplete: matchStatus === 'Completed',
      winnerId: matchWinnerId
    }
  },
  
  undoLastPoint: () => {
    const state = get()
    if (state.pointLog.length === 0 || !state.matchFormat) {
      throw new Error('No points to undo or match not initialized')
    }

    // Remove the last point from the log
    const newPointLog = state.pointLog.slice(0, -1)

    // Recalculate score from the remaining points
    const recalculatedScore = calculateScoreFromPointLog(newPointLog, state.matchFormat)

    // Recalculate current server based on total games played
    let newServer: 'p1' | 'p2' | null = null
    if (newPointLog.length > 0) {
      if (recalculatedScore.isTiebreak) {
        const totalTiebreakPoints = recalculatedScore.tiebreakPoints!.p1 + recalculatedScore.tiebreakPoints!.p2
        newServer = getTiebreakServer(totalTiebreakPoints + 1)
      } else {
        const totalGamesPlayed = recalculatedScore.sets.reduce((sum, set) => sum + set.p1 + set.p2, 0) + 
                                recalculatedScore.games[0].p1 + recalculatedScore.games[0].p2
        newServer = getServer(totalGamesPlayed + 1)
      }
    }

    // Update state
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