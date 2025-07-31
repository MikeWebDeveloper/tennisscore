import { QueryClient } from '@tanstack/react-query'

/**
 * Tennis-optimized QueryClient configuration
 * Based on research-recommended settings for sports applications
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Tennis matches can change rapidly during live scoring
        staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
        gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection
        
        // Network resilience for mobile tennis apps
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          if (error && typeof error === 'object' && 'status' in error) {
            const status = error.status as number
            if (status >= 400 && status < 500) return false
          }
          // Retry up to 3 times for network/server errors
          return failureCount < 3
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Background refetch for live match updates
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        
        // Conservative background refetch for match data
        refetchOnMount: 'always',
      },
      mutations: {
        // Tennis scoring mutations need immediate feedback
        retry: 1,
        retryDelay: 1000,
      },
    },
  })
}

// Singleton instance for the app
let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = createQueryClient()
    return browserQueryClient
  }
}