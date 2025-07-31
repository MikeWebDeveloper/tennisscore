import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../query-keys'
import type { TennisQueryOptions } from '../types'
import type { Match } from '@/lib/types'

// Import existing server actions (maintaining backward compatibility)
import { 
  getAllMatches, 
  getMatchById,
  getMatchesByUser
} from '@/lib/actions/matches'

/**
 * Hook to fetch all matches for the current user
 */
export function useMatchesQuery(
  filters?: { status?: string; playerId?: string },
  options?: TennisQueryOptions<Match[]>
) {
  return useQuery({
    queryKey: queryKeys.matches.list('current', filters), // Will be replaced with actual userId when auth is integrated
    queryFn: async () => {
      const result = await getAllMatches()
      return result.matches
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - match list can change with new matches
    ...options,
  })
}

/**
 * Hook to fetch a specific match by ID
 */
export function useMatchQuery(
  matchId: string,
  options?: TennisQueryOptions<Match>
) {
  return useQuery({
    queryKey: queryKeys.matches.detail(matchId),
    queryFn: async () => {
      const match = await getMatchById(matchId)
      if (!match) throw new Error(`Match with ID ${matchId} not found`)
      return match
    },
    staleTime: 1 * 60 * 1000, // 1 minute - individual match can change during live scoring
    enabled: !!matchId,
    ...options,
  })
}

/**
 * Hook for live match updates (higher refresh rate)
 */
export function useLiveMatchQuery(
  matchId: string,
  options?: TennisQueryOptions<Match>
) {
  return useQuery({
    queryKey: queryKeys.matches.live(matchId),
    queryFn: async () => {
      const match = await getMatchById(matchId)
      if (!match) throw new Error(`Match with ID ${matchId} not found`)
      return match
    },
    staleTime: 10 * 1000, // 10 seconds - live matches need frequent updates
    refetchInterval: 15 * 1000, // 15 seconds - poll for updates
    refetchIntervalInBackground: true,
    enabled: !!matchId,
    ...options,
  })
}

/**
 * Hook to fetch recent matches for the current user
 */
export function useRecentMatchesQuery(
  limit: number = 10,
  options?: TennisQueryOptions<Match[]>
) {
  return useQuery({
    queryKey: queryKeys.matches.recent('current', limit), // Will be replaced with actual userId when auth is integrated
    queryFn: async () => {
      const matches = await getMatchesByUser()
      return matches.slice(0, limit)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - recent matches list is relatively stable
    ...options,
  })
}