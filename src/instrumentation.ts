export async function register() {
  // OTel registration is disabled locally to avoid optional peer dependency issues.
  // In production on Vercel, prefer enabling platform OTel integration instead.
  
  // Add custom instrumentation for development
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('🔧 Instrumentation loaded - Development mode active')
    
    // Add global error handlers for server actions
    if (typeof globalThis !== 'undefined') {
      const originalError = console.error
      console.error = (...args) => {
        // Log server action errors with more context
        if (args[0] && typeof args[0] === 'string' && args[0].includes('Server Action')) {
          console.log('🚨 Server Action Error Detected:', {
            timestamp: new Date().toISOString(),
            error: args,
            stack: new Error().stack
          })
        }
        return originalError.apply(console, args)
      }
    }
  }
  
  // Performance monitoring setup
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).reportServerActionError = (action: string, error: Error) => {
      console.error(`🔥 Server Action "${action}" failed:`, {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
      
      // In production, you would send this to your monitoring service
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
        // Example: Sentry, DataDog, etc.
        // captureException(error, { tags: { serverAction: action } })
      }
    }
  }
}
