import { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query'

/**
 * Type-safe wrappers for TanStack Query options
 */

// Common error type for the tennis app
export interface TennisAppError {
  message: string
  code?: string
  status?: number
}

// Custom query options type
export type TennisQueryOptions<
  TQueryFnData = unknown,
  TError = TennisAppError,
  TData = TQueryFnData,
  TQueryKey extends readonly unknown[] = readonly unknown[]
> = Omit<
  UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'queryKey' | 'queryFn'
>

// Custom mutation options type
export type TennisMutationOptions<
  TData = unknown,
  TError = TennisAppError,
  TVariables = void,
  TContext = unknown
> = UseMutationOptions<TData, TError, TVariables, TContext>

// Server action result type
export type ServerActionResult<T> = {
  success?: boolean
  data?: T
  error?: string
}

// Query function type for server actions
export type ServerActionQueryFn<TData, TVariables = void> = (
  variables: TVariables
) => Promise<ServerActionResult<TData>>

// Mutation function type for server actions
export type ServerActionMutationFn<TData, TVariables> = (
  variables: TVariables
) => Promise<ServerActionResult<TData>>