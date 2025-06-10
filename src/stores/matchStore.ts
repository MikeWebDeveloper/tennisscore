import { create } from 'zustand'

export interface MatchFormat {
  sets: number
  noAd: boolean
  tiebreakAt?: number
}

export interface Score {
  sets: Array<{ p1: number; p2: number }>
  games: Array<{ p1: number; p2: number }>
  points: { p1: number; p2: number }
}

export interface PointDetail {
  winner: 'p1' | 'p2'
  type?: 'winner' | 'unforced_error' | 'forced_error' | 'ace' | 'double_fault'
  shot?: 'forehand' | 'backhand' | 'serve' | 'volley' | 'overhead' | 'other'
  timestamp: string
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
  setScore: (score: Score) => void
  updateScore: (winner: 'p1' | 'p2') => void
  
  // Point logging
  pointLog: PointDetail[]
  addPoint: (point: PointDetail) => void
  removeLastPoint: () => void
  
  // Detailed logging mode
  detailedLoggingEnabled: boolean
  setDetailedLoggingEnabled: (enabled: boolean) => void
  
  // Match events (comments, photos)
  events: Array<{ type: 'comment' | 'photo'; content: string; timestamp: string }>
  addEvent: (event: { type: 'comment' | 'photo'; content: string }) => void
  
  // Match state
  isMatchComplete: boolean
  setIsMatchComplete: (complete: boolean) => void
  
  // Reset function for new match
  resetMatch: () => void
}

const initialScore: Score = {
  sets: [],
  games: [{ p1: 0, p2: 0 }],
  points: { p1: 0, p2: 0 }
}

export const useMatchStore = create<MatchState>((set, get) => ({
  currentMatch: null,
  setCurrentMatch: (match) => set({ currentMatch: match }),
  
  score: initialScore,
  setScore: (score) => set({ score }),
  
  updateScore: (winner) => {
    // This is a simplified scoring logic - will be enhanced later
    const state = get()
    const newScore = { ...state.score }
    
    if (winner === 'p1') {
      newScore.points.p1++
    } else {
      newScore.points.p2++
    }
    
    set({ score: newScore })
  },
  
  pointLog: [],
  addPoint: (point) => set((state) => ({
    pointLog: [...state.pointLog, point]
  })),
  
  removeLastPoint: () => set((state) => ({
    pointLog: state.pointLog.slice(0, -1)
  })),
  
  detailedLoggingEnabled: false,
  setDetailedLoggingEnabled: (enabled) => set({ detailedLoggingEnabled: enabled }),
  
  events: [],
  addEvent: (event) => set((state) => ({
    events: [...state.events, { ...event, timestamp: new Date().toISOString() }]
  })),
  
  isMatchComplete: false,
  setIsMatchComplete: (complete) => set({ isMatchComplete: complete }),
  
  resetMatch: () => set({
    currentMatch: null,
    score: initialScore,
    pointLog: [],
    events: [],
    isMatchComplete: false,
    detailedLoggingEnabled: false,
  }),
})) 