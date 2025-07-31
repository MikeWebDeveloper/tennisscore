import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../query-keys'
import { useServerActionMutation } from '../server-actions-bridge'
import type { TennisMutationOptions } from '../types'
import type { Player } from '@/lib/types'

// Import existing server actions (maintaining backward compatibility)
import { 
  createPlayer, 
  updatePlayer, 
  deletePlayer
} from '@/lib/actions/players'

/**
 * Hook to create a new player
 */
export function useCreatePlayerMutation(
  options?: TennisMutationOptions<Player, unknown, FormData>
) {
  const queryClient = useQueryClient()

  return useServerActionMutation(
    async (formData: FormData) => await createPlayer(formData),
    {
      onSuccess: (data) => {
        // Invalidate players list to refetch with new player
        queryClient.invalidateQueries({ queryKey: queryKeys.players.lists() })
        
        // If this is set as main player, invalidate main player query
        const isMainPlayer = data.isMainPlayer
        if (isMainPlayer) {
          queryClient.invalidateQueries({ queryKey: queryKeys.players.main('current') })
        }
      },
      ...options,
    }
  )
}

/**
 * Hook to update an existing player
 */
export function useUpdatePlayerMutation(
  options?: TennisMutationOptions<Player, unknown, { playerId: string; formData: FormData }>
) {
  const queryClient = useQueryClient()

  return useServerActionMutation(
    async ({ playerId, formData }: { playerId: string; formData: FormData }) => 
      await updatePlayer(playerId, formData),
    {
      onSuccess: (data, variables) => {
        // Update the specific player in cache
        queryClient.setQueryData(
          queryKeys.players.detail(variables.playerId),
          data
        )
        
        // Invalidate players list to reflect changes
        queryClient.invalidateQueries({ queryKey: queryKeys.players.lists() })
        
        // If main player status changed, invalidate main player query
        queryClient.invalidateQueries({ queryKey: queryKeys.players.main('current') })
        
        // Invalidate any matches that include this player
        queryClient.invalidateQueries({ queryKey: queryKeys.matches.lists() })
      },
      ...options,
    }
  )
}

/**
 * Hook to delete a player
 */
export function useDeletePlayerMutation(
  options?: TennisMutationOptions<void, unknown, string>
) {
  const queryClient = useQueryClient()

  return useServerActionMutation(
    async (playerId: string) => await deletePlayer(playerId),
    {
      onSuccess: (_, playerId) => {
        // Remove player from cache
        queryClient.removeQueries({ queryKey: queryKeys.players.detail(playerId) })
        
        // Invalidate players list
        queryClient.invalidateQueries({ queryKey: queryKeys.players.lists() })
        
        // Invalidate main player in case the deleted player was main
        queryClient.invalidateQueries({ queryKey: queryKeys.players.main('current') })
        
        // Invalidate matches as they might reference this player
        queryClient.invalidateQueries({ queryKey: queryKeys.matches.lists() })
      },
      ...options,
    }
  )
}


