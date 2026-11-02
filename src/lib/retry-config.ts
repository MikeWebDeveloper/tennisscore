// Retry configuration for different operation types
export const RETRY_CONFIGS = {
  // Page reads - the loading skeleton shows while we wait; a 2 s budget turned
  // every slow Appwrite answer into an error page
  NAVIGATION: {
    maxRetries: 1,        // 1 retry (2 attempts total)
    baseDelay: 200,       // 200ms base delay
    maxTimeout: 8000,     // 8 second total timeout
    attemptTimeout: 3500  // a hung attempt is asked again instead of eating the budget
  },
  
  // Data mutations - moderate retry
  MUTATION: {
    maxRetries: 2,      // 2 retries (3 attempts total)
    baseDelay: 500,     // 500ms base delay
    maxTimeout: 5000,   // 5 second total timeout
    attemptTimeout: 5000
  },
  
  // Background operations - aggressive retry
  BACKGROUND: {
    maxRetries: 3,      // 3 retries (4 attempts total)
    baseDelay: 1000,    // 1 second base delay
    maxTimeout: 10000,  // 10 second total timeout
    attemptTimeout: 5000
  }
} as const

export type RetryConfig = typeof RETRY_CONFIGS[keyof typeof RETRY_CONFIGS]