export interface User {
  $id: string
  name?: string
  email: string
  $createdAt: string
  $updatedAt: string
}

export interface Player {
  $id: string
  firstName: string
  lastName: string
  yearOfBirth?: number
  rating?: string
  profilePictureId?: string
  isMainPlayer?: boolean
  isAnonymous?: boolean
  userId: string
}

export interface Match {
  $id: string
  playerOneId: string
  playerTwoId: string
  playerThreeId?: string   // For doubles
  playerFourId?: string    // For doubles
  matchDate: string
  matchFormat: string
  status: "In Progress" | "Completed"
  winnerId?: string
  score: string
  pointLog?: string[]
  userId: string
  $createdAt: string
  $updatedAt: string
}

export interface MatchFormat {
  sets: 1 | 3 | 5 // Best of 1, 3, or 5 sets
  noAd: boolean // No-advantage scoring
  tiebreak: boolean // Tiebreak at 6-6
  finalSetTiebreak: boolean // Tiebreak in final set
  finalSetTiebreakAt?: number // Points for final set tiebreak (e.g., 10)
  shortSets?: boolean // First to 4 games (for practice)
  detailLevel?: "points" | "simple" | "complex" // Level of detail for point tracking
}

export interface Score {
  sets: Array<[number, number]>;
  games: [number, number];
  points: [number, number];
  isTiebreak?: boolean;
  tiebreakPoints?: [number, number];
}

export interface TennisScore extends Score {
  server: "p1" | "p2"
  gameNumber: number
  setNumber: number
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