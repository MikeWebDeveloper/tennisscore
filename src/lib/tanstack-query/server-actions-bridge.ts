import { useMutation, useQuery } from '@tanstack/react-query'
import { queryKeys } from './query-keys'
import type { 
  ServerActionResult, 
  ServerActionQueryFn, 
  ServerActionMutationFn,
  TennisQueryOptions,
  TennisMutationOptions,
  TennisAppError
} from './types'

/**
 * Bridge utilities for integrating Server Actions with TanStack Query
 * Provides type-safe wrappers that handle the Server Action result format
 */

/**
 * Creates a query function that works with Server Actions
 */
export function createServerActionQuery<TData, TVariables = void>(
  serverAction: ServerActionQueryFn<TData, TVariables>
) {
  return async (variables: TVariables): Promise<TData> => {
    const result = await serverAction(variables)
    
    if (result.error) {
      throw new Error(result.error) as TennisAppError
    }
    
    if (!result.success || result.data === undefined) {
      throw new Error('Server action failed') as TennisAppError
    }
    
    return result.data
  }
}

/**
 * Creates a mutation function that works with Server Actions
 */
export function createServerActionMutation<TData, TVariables>(
  serverAction: ServerActionMutationFn<TData, TVariables>
) {
  return async (variables: TVariables): Promise<TData> => {
    const result = await serverAction(variables)
    
    if (result.error) {
      throw new Error(result.error) as TennisAppError
    }
    
    if (!result.success || result.data === undefined) {
      throw new Error('Server action failed') as TennisAppError
    }
    
    return result.data
  }
}

/**
 * Hook for using Server Actions with TanStack Query queries
 */
export function useServerActionQuery<TData, TVariables = void>(
  queryKey: readonly unknown[],
  serverAction: ServerActionQueryFn<TData, TVariables>,
  variables: TVariables,
  options?: TennisQueryOptions<TData>
) {
  return useQuery({
    queryKey: [...queryKey, variables],
    queryFn: () => createServerActionQuery(serverAction)(variables),
    ...options,
  })
}

/**
 * Hook for using Server Actions with TanStack Query mutations
 */
export function useServerActionMutation<TData, TVariables>(
  serverAction: ServerActionMutationFn<TData, TVariables>,
  options?: TennisMutationOptions<TData, TennisAppError, TVariables>
) {
  return useMutation({
    mutationFn: createServerActionMutation(serverAction),
    ...options,
  })
}