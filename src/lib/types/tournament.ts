export interface TournamentPlayer {
  id: string
  name: string
  surname: string
  yearOfBirth: number
  ranking?: number
}

export interface Tournament {
  id: string
  name: string
  startDate: Date
  endDate: Date
  players: TournamentPlayer[]
  status: 'upcoming' | 'active' | 'completed'
} 