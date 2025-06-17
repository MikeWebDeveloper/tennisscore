import { createAdminClient } from "@/lib/appwrite-server"

export async function checkAppwriteConnection(): Promise<{ healthy: boolean; error?: string }> {
  try {
    const { databases } = await createAdminClient()
    
    // Try a simple database operation to test connectivity
    await databases.list()
    
    return { healthy: true }
  } catch (error) {
    console.error("Appwrite connection check failed:", error)
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : "Unknown connection error" 
    }
  }
}

export async function retryAppwriteOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // Check if it's a retryable error
      if (isRetryableError(lastError) && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) // Exponential backoff
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      throw lastError
    }
  }
  
  throw lastError!
}

function isRetryableError(error: Error): boolean {
  const retryablePatterns = [
    'ECONNRESET',
    'ECONNREFUSED', 
    'ETIMEDOUT',
    'fetch failed',
    'network',
    'timeout',
    'socket hang up'
  ]
  
  return retryablePatterns.some(pattern => 
    error.message.toLowerCase().includes(pattern.toLowerCase())
  )
} 