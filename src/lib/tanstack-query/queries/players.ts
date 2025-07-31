import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../query-keys'
import type { TennisQueryOptions } from '../types'
import type { Player } from '@/lib/types'

// Import existing server actions (maintaining backward compatibility)
import { 
  getPlayersByUser,
  getPlayerById, 
  getMainPlayer 
} from '@/lib/actions/players'

/**
 * Hook to fetch all players for the current user
 */
export function usePlayersQuery(
  options?: TennisQueryOptions<Player[]>
) {
  return useQuery({
    queryKey: queryKeys.players.list('current'), // Will be replaced with actual userId when auth is integrated
    queryFn: async () => await getPlayersByUser(),
    staleTime: 10 * 60 * 1000, // 10 minutes - player data changes less frequently
    ...options,
  })
}

/**
 * Hook to fetch a specific player by ID
 */
export function usePlayerQuery(
  playerId: string,
  options?: TennisQueryOptions<Player>
) {
  return useQuery({
    queryKey: queryKeys.players.detail(playerId),
    queryFn: async () => {
      const player = await getPlayerById(playerId)
      if (!player) throw new Error(`Player with ID ${playerId} not found`)
      return player
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - individual player data is even more stable
    enabled: !!playerId,
    ...options,
  })
}


/**
 * Hook to fetch the main player for the current user
 */
export function useMainPlayerQuery(
  options?: TennisQueryOptions<Player | null>
) {
  return useQuery({
    queryKey: queryKeys.players.main('current'), // Will be replaced with actual userId when auth is integrated
    queryFn: async () => await getMainPlayer(),
    staleTime: 15 * 60 * 1000, // 15 minutes - main player setting is stable
    ...options,
  })
}