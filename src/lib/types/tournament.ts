export interface Tournament {
  $id: string
  $createdAt: string
  $updatedAt: string
  name: string
  description?: string
  format: 'singles' | 'doubles'
  maxParticipants: number
  tournamentDate: string
  status: 'draft' | 'active' | 'completed'
  bracketImageId?: string
  organizerId: string
  participants: string[] // Player IDs
  configuration: {
    googleSheetsEndpoint?: string
    // Extensible for future configurations
  }
}

export interface TournamentPlayer {
  id: string
  name: string
  surname: string
  yearOfBirth: number
  ranking?: number
  // Additional fields from Google Sheets
}

export interface TournamentMatch {
  $id: string
  $createdAt: string
  $updatedAt: string
  tournamentId: string
  round: string
  bracketPosition: number
  nextMatchId?: string
  // Inherits from existing Match interface
  player1Id: string
  player2Id?: string
  player1Name: string
  player2Name?: string
  format: 'singles' | 'doubles'
  sets: number
  noAd: boolean
  superTiebreak: boolean
  status: 'pending' | 'in_progress' | 'completed'
  winner?: string
  score?: string
}

export interface TournamentConfig {
  googleSheets: {
    endpoint: string
    apiKey?: string
    sheetId?: string
  }
  storage: {
    bucketId: string
    maxFileSize: number
  }
}

export interface TournamentError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export type TournamentStatus = 'draft' | 'active' | 'completed'
export type TournamentFormat = 'singles' | 'doubles'

export const TOURNAMENT_ERROR_CODES = {
  TOURNAMENT_NOT_FOUND: 'TOURNAMENT_NOT_FOUND',
  INVALID_TOURNAMENT_FORMAT: 'INVALID_TOURNAMENT_FORMAT',
  PLAYER_CAPACITY_EXCEEDED: 'PLAYER_CAPACITY_EXCEEDED',
  BRACKET_UPLOAD_FAILED: 'BRACKET_UPLOAD_FAILED',
  BRACKET_NOT_FOUND: 'BRACKET_NOT_FOUND',
  BRACKET_RETRIEVAL_FAILED: 'BRACKET_RETRIEVAL_FAILED',
  BRACKET_DELETION_FAILED: 'BRACKET_DELETION_FAILED',
  TOURNAMENT_STATUS_INVALID: 'TOURNAMENT_STATUS_INVALID',
  GOOGLE_SHEETS_CONNECTION_ERROR: 'GOOGLE_SHEETS_CONNECTION_ERROR',
  MATCH_CREATION_FAILED: 'MATCH_CREATION_FAILED',
} as const

export const TOURNAMENT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const

export const TOURNAMENT_FORMAT = {
  SINGLES: 'singles',
  DOUBLES: 'doubles',
} as const

export const MAX_TOURNAMENT_PARTICIPANTS = 64
export const MIN_TOURNAMENT_PARTICIPANTS = 2