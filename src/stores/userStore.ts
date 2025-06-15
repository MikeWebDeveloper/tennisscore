import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  $id: string
  email: string
  name?: string
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
  userId: string
  $createdAt: string
  $updatedAt: string
}

interface UserState {
  // User authentication state
  user: User | null
  setUser: (user: User | null) => void
  
  // Main player selection for dashboard
  mainPlayerId: string | null
  setMainPlayerId: (playerId: string | null) => void
  
  // User's players cache
  players: Player[]
  setPlayers: (players: Player[]) => void
  addPlayer: (player: Player) => void
  
  // UI state
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      
      mainPlayerId: null,
      setMainPlayerId: (playerId) => set({ mainPlayerId: playerId }),
      
      players: [],
      setPlayers: (players) => set({ players }),
      addPlayer: (player) => set((state) => ({
        players: [...state.players, player]
      })),
      
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'tennisscore-user-store',
      partialize: (state) => ({
        mainPlayerId: state.mainPlayerId,
        // Don't persist user data for security - it will be refetched
      }),
    }
  )
) 