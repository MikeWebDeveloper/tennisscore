// Retry configuration for different operation types
export const RETRY_CONFIGS = {
  // Critical navigation calls - fail fast
  NAVIGATION: {
    maxRetries: 1,      // Only 1 retry (2 attempts total)
    baseDelay: 100,     // 100ms base delay
    maxTimeout: 2000    // 2 second total timeout
  },
  
  // Data mutations - moderate retry
  MUTATION: {
    maxRetries: 2,      // 2 retries (3 attempts total)
    baseDelay: 500,     // 500ms base delay
    maxTimeout: 5000    // 5 second total timeout
  },
  
  // Background operations - aggressive retry
  BACKGROUND: {
    maxRetries: 3,      // 3 retries (4 attempts total)
    baseDelay: 1000,    // 1 second base delay
    maxTimeout: 10000   // 10 second total timeout
  }
} as const

export type RetryConfig = typeof RETRY_CONFIGS[keyof typeof RETRY_CONFIGS]