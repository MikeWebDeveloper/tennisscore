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
  userId: string
}

export interface MatchFormat {
  sets: number
  gamesPerSet: number
  tiebreakAt: number
  finalSetTiebreak?: 'standard' | 'super' | 'none'
  noAd: boolean
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
  totalPointsPlayed: number
  totalPointsWon: number
  pointWinPercentage: number
  servicePointsWon: number
  returnPointsWon: number
  winners: number
  unforcedErrors: number
  forcedErrors: number
  aces: number
  doubleFaults: number
  firstServesMade: number
  firstServesAttempted: number
  firstServePercentage: number
  firstServePointsWon: number
  firstServePointsPlayed: number
  firstServeWinPercentage: number
  secondServesMade: number
  secondServesAttempted: number
  secondServePercentage: number
  secondServePointsWon: number
  secondServePointsPlayed: number
  secondServeWinPercentage: number
  firstReturnPointsWon: number
  firstReturnPointsPlayed: number
  firstReturnWinPercentage: number
  secondReturnPointsWon: number
  secondReturnPointsPlayed: number
  secondReturnWinPercentage: number
  totalReturnPointsWon: number
  totalReturnPointsPlayed: number
  totalReturnWinPercentage: number
  breakPointsWon: number
  breakPointsPlayed: number
  breakPointsSaved: number
  breakPointsFaced: number
  breakPointConversionPercentage: number
  breakPointSavePercentage: number
  forehandWinners: number
  forehandErrors: number
  backhandWinners: number
  backhandErrors: number
  volleyWinners: number
  volleyErrors: number
  netPointsWon: number
  netPointsPlayed: number
  netPointWinPercentage: number
} 