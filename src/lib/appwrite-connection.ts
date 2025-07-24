// Fast-failing connection utilities for development
export function getConnectionConfig() {
  const isDev = process.env.NODE_ENV === 'development'
  
  return {
    maxRetries: isDev ? 0 : 3,
    baseDelay: isDev ? 50 : 1000,
    timeout: isDev ? 3000 : 10000, // 3s in dev, 10s in prod
  }
}

// Wrapper for fetch with timeout
export async function fetchWithTimeout(
  url: string | RequestInfo,
  options: RequestInit & { timeout?: number } = {}
) {
  const { timeout = getConnectionConfig().timeout } = options
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }
    throw error
  }
}

// Create a patched fetch for Appwrite SDK in development
export function createPatchedFetch() {
  const isDev = process.env.NODE_ENV === 'development'
  
  if (!isDev) {
    return fetch // Use default fetch in production
  }
  
  // In development, wrap fetch with fast timeout
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    
    // Only apply timeout to Appwrite endpoints
    if (url.includes('appwrite.io')) {
      try {
        return await fetchWithTimeout(url, {
          ...init,
          timeout: 3000 // 3 second timeout in dev
        })
      } catch (error: any) {
        // If it's a connection error, fail immediately
        if (error.message?.includes('timeout') || 
            error.code === 'ECONNRESET' || 
            error.code === 'ETIMEDOUT') {
          console.log('⚡ Fast-failing Appwrite connection in dev mode')
          throw error
        }
        throw error
      }
    }
    
    // Non-Appwrite URLs use normal fetch
    return fetch(input, init)
  }
}