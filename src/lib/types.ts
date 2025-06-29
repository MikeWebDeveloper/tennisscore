import { Models } from "node-appwrite"

export interface User {
  $id: string
  name?: string
  email: string
}

export interface Player extends Models.Document {
  firstName: string
  lastName: string
  yearOfBirth?: number
  rating?: string
  club?: string
  playingHand?: 'right' | 'left'
  profilePictureId?: string
  profilePictureUrl?: string
  isMainPlayer?: boolean
  isAnonymous?: boolean
  userId: string
}

export interface Match extends Models.Document {
  playerOneId: string
  playerTwoId: string
  playerOne?: Player // Populated relationship (optional because it might not always be populated)
  playerTwo?: Player // Populated relationship (optional because it might not always be populated)
  matchDate: string
  matchFormat: string
  status: 'pending' | 'in-progress' | 'completed' | 'retired'
  winnerId?: string
  score: string
  pointLog?: string[]
  events?: string[]
  isDoubles: boolean
  playerThreeId?: string
  playerFourId?: string
  playerThree?: Player
  playerFour?: Player
  retirementReason?: string // Reason if match was retired
  detailLevel?: "points" | "simple" | "complex"
  
  // Timing fields
  startTime?: string // ISO timestamp when first point is awarded
  endTime?: string // ISO timestamp when match completes
  setDurations?: number[] // Duration of each completed set in milliseconds
  
  userId: string
}

export interface MatchFormat {
  sets: number
  gamesPerSet: number
  tiebreakAt: number
  finalSetTiebreak?: 'standard' | 'super' | 'none'
  noAd: boolean
  detailLevel?: "points" | "simple" | "complex"
}

export interface Score {
  sets: Array<{ player1: number; player2: number }>
  games: Array<{ player1: number; player2: number }>
  points: { player1: string; player2: string }
  currentSet: number
  currentGame: number
  isTiebreak: boolean
  tiebreakPoints?: { player1: number; player2: number }
  server: 1 | 2
}

export interface Point {
  pointWinner: 1 | 2
  serveResult: 'ace' | 'fault' | 'double-fault' | 'in-play'
  pointEndedBy: 'winner' | 'error'
  stroke?: 'forehand' | 'backhand' | 'volley' | 'overhead' | 'serve'
  timestamp: string
}

export interface DashboardStats {
  totalMatches: number
  winRate: number
  totalPlayers: number
  completedMatches: number
  inProgressMatches: number
}

// Detailed Point Tracking Types
export type ServeType = "first" | "second"
export type PointOutcome = "winner" | "unforced_error" | "forced_error" | "ace" | "double_fault"
export type ShotType = "forehand" | "backhand" | "volley" | "overhead" | "drop_shot" | "lob" | "serve"
export type CourtPosition = "deuce" | "ad" | "net" | "baseline"

export interface PointDetail {
  id: string
  timestamp: string
  pointNumber: number // Sequential point number in the match
  setNumber: number // Current set number (1-indexed)
  gameNumber: number // Current game number in the set (1-indexed)
  gameScore: string // Game score at start of point (e.g., "30-15")
  
  // Point Winner
  winner: "p1" | "p2" // Player who won the point
  server: "p1" | "p2" // Player who served
  
  // Serve Details
  serveType: ServeType
  serveOutcome: PointOutcome // What happened with the serve
  servePlacement?: "wide" | "body" | "t" // Serve placement
  serveSpeed?: number // Optional serve speed
  
  // Rally Details
  rallyLength: number // Number of shots in the rally (including serve)
  pointOutcome: PointOutcome // How the point ended
  lastShotType?: ShotType // Type of shot that ended the point
  lastShotPlayer?: "p1" | "p2" // Player who hit the last shot
  actionPlayer?: "p1" | "p2" // Player who performed the point-ending action
  
  // Context
  isBreakPoint: boolean // Was this a break point?
  isSetPoint: boolean // Was this a set point?
  isMatchPoint: boolean // Was this a match point?
  isGameWinning: boolean // Did this point win the game?
  isSetWinning: boolean // Did this point win the set?
  isMatchWinning: boolean // Did this point win the match?
  
  // Optional Additional Details
  notes?: string // Free text notes about the point
  courtPosition?: CourtPosition // Where the point was played
  atNet?: "p1" | "p2" | "both" // Which player was at the net
}

export interface DetailedPointLog {
  points: PointDetail[]
  stats: MatchStats
}

export interface MatchStats {
  player1: PlayerStats
  player2: PlayerStats
}

export interface PlayerStats {
  totalPointsWon: number
  winners: number
  aces: number
  doubleFaults: number
  unforcedErrors: number
  forcedErrors: number
  
  // Serve Stats
  firstServesAttempted: number
  firstServesMade: number
  firstServePointsWon: number
  secondServesMade: number
  secondServePointsWon: number
  
  // Break Point Stats
  breakPointsFaced: number
  breakPointsSaved: number
  breakPointsWon: number
  
  // Return Stats
  totalReturnPointsWon: number
  firstReturnPointsWon: number
  secondReturnPointsWon: number

  // Net Stats
  netPointsAttempted: number
  netPointsWon: number
} 