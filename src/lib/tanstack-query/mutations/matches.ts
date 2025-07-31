import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../query-keys'
import { useServerActionMutation } from '../server-actions-bridge'
import type { TennisMutationOptions } from '../types'
import type { Match, MatchFormat } from '@/lib/types'

// Import existing server actions (maintaining backward compatibility)
import { 
  createMatch, 
  updateMatchScore, 
  deleteMatch
} from '@/lib/actions/matches'

interface CreateMatchData {
  playerOneId: string
  playerTwoId: string
  playerThreeId?: string
  playerFourId?: string
  tournamentName?: string
  matchFormat: MatchFormat & { detailLevel: "points" | "simple" | "complex" | "detailed" }
}

/**
 * Hook to create a new match
 */
export function useCreateMatchMutation(
  options?: TennisMutationOptions<Match, unknown, CreateMatchData>
) {
  const queryClient = useQueryClient()

  return useServerActionMutation(
    async (matchData: CreateMatchData) => await createMatch(matchData),
    {
      onSuccess: (data) => {
        // Invalidate matches list to include new match
        queryClient.invalidateQueries({ queryKey: queryKeys.matches.lists() })
        
        // Invalidate recent matches
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.matches.all, 
          predicate: (query) => query.queryKey.includes('recent')
        })
        
        // Add the new match to cache
        queryClient.setQueryData(
          queryKeys.matches.detail(data.$id),
          data
        )
      },
      ...options,
    }
  )
}

/**
 * Hook to update match score
 */
export function useUpdateMatchScoreMutation(
  options?: TennisMutationOptions<Match, unknown, { matchId: string; scoreUpdate: any }>
) {
  const queryClient = useQueryClient()

  return useServerActionMutation(
    async ({ matchId, scoreUpdate }: { matchId: string; scoreUpdate: any }) => 
      await updateMatchScore(matchId, scoreUpdate),
    {
      onSuccess: (data, variables) => {
        // Update the specific match in cache
        queryClient.setQueryData(
          queryKeys.matches.detail(variables.matchId),
          data
        )
        
        // Update live match cache if exists
        queryClient.setQueryData(
          queryKeys.matches.live(variables.matchId),
          data
        )
        
        // Invalidate matches list to reflect updated match
        queryClient.invalidateQueries({ queryKey: queryKeys.matches.lists() })
        
        // Invalidate recent matches if this match is recent
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.matches.all, 
          predicate: (query) => query.queryKey.includes('recent')
        })
      },
      ...options,
    }
  )
}


/**
 * Hook to delete a match
 */
export function useDeleteMatchMutation(
  options?: TennisMutationOptions<void, unknown, string>
) {
  const queryClient = useQueryClient()

  return useServerActionMutation(
    async (matchId: string) => await deleteMatch(matchId),
    {
      onSuccess: (_, matchId) => {
        // Remove match from all caches
        queryClient.removeQueries({ queryKey: queryKeys.matches.detail(matchId) })
        queryClient.removeQueries({ queryKey: queryKeys.matches.live(matchId) })
        
        // Invalidate matches list
        queryClient.invalidateQueries({ queryKey: queryKeys.matches.lists() })
        
        // Invalidate recent matches
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.matches.all, 
          predicate: (query) => query.queryKey.includes('recent')
        })
        
        // Invalidate statistics as deleting a match affects stats
        queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all })
      },
      ...options,
    }
  )
}