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
  userId: string
  $createdAt: string
  $updatedAt: string
}

export interface Match {
  $id: string
  playerOneId: string
  playerTwoId: string
  matchDate: string
  matchFormat: string
  status: "In Progress" | "Completed"
  winnerId?: string
  score: string
  pointLog?: string
  userId: string
  $createdAt: string
  $updatedAt: string
}

export interface MatchFormat {
  sets: number
  noAd: boolean
}

export interface Score {
  sets: number[][]
  games: number[]
  points: number[]
}

export interface DashboardStats {
  totalMatches: number
  winRate: number
  totalPlayers: number
  completedMatches: number
  inProgressMatches: number
} 