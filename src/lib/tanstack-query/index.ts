/**
 * TanStack Query v5 Foundation for Tennis Scoring App
 * 
 * This module provides the foundational layer for integrating TanStack Query
 * with the tennis app's existing Server Actions, maintaining backward compatibility
 * while providing modern caching and synchronization capabilities.
 */

// Core client and configuration
export { createQueryClient, getQueryClient } from './client'
export { QueryProvider } from '../../components/providers/query-provider'

// Query keys factory
export { queryKeys } from './query-keys'
export type { QueryKeys } from './query-keys'

// Type definitions
export type { 
  TennisAppError,
  TennisQueryOptions,
  TennisMutationOptions,
  ServerActionResult,
  ServerActionQueryFn,
  ServerActionMutationFn
} from './types'

// Server Actions bridge utilities
export {
  createServerActionQuery,
  createServerActionMutation,
  useServerActionQuery,
  useServerActionMutation
} from './server-actions-bridge'

// Player queries and mutations
export {
  usePlayersQuery,
  usePlayerQuery,
  useMainPlayerQuery
} from './queries/players'

export {
  useCreatePlayerMutation,
  useUpdatePlayerMutation,
  useDeletePlayerMutation
} from './mutations/players'

// Match queries and mutations
export {
  useMatchesQuery,
  useMatchQuery,
  useLiveMatchQuery,
  useRecentMatchesQuery
} from './queries/matches'

export {
  useCreateMatchMutation,
  useUpdateMatchScoreMutation,
  useDeleteMatchMutation
} from './mutations/matches'