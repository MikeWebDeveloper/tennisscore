/**
 * Modern Error Handling Utility
 * Inspired by Rust's Result type and Go's error handling patterns
 * Provides explicit error handling with better debugging and recovery
 */

export type ErrorType = 
  | 'NETWORK_ERROR'
  | 'AUTHENTICATION_ERROR' 
  | 'PERMISSION_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR'

export interface AppError {
  type: ErrorType
  message: string
  code?: string | number
  cause?: Error
  context?: Record<string, any>
  timestamp: Date
  retryable: boolean
  userId?: string
}

export class Result<T> {
  private constructor(
    private readonly success: boolean,
    private readonly value?: T,
    private readonly error?: AppError
  ) {}

  static ok<T>(value: T): Result<T> {
    return new Result<T>(true, value, undefined)
  }

  static err<T>(error: AppError): Result<T> {
    return new Result<T>(false, undefined, error)
  }

  isSuccess(): boolean {
    return this.success
  }

  isError(): boolean {
    return !this.success
  }

  getValue(): T | undefined {
    return this.value
  }

  getError(): AppError | undefined {
    return this.error
  }

  map<U>(fn: (value: T) => U): Result<U> {
    if (this.success) {
      return Result.ok(fn(this.value!))
    } else {
      return Result.err<U>(this.error!)
    }
  }

  flatMap<U>(fn: (value: T) => Result<U>): Result<U> {
    if (this.success) {
      return fn(this.value!)
    } else {
      return Result.err<U>(this.error!)
    }
  }

  unwrap(): T {
    if (this.success) {
      return this.value!
    } else {
      throw new Error(`Called unwrap on error result: ${this.error!.message}`)
    }
  }

  unwrapOr(defaultValue: T): T {
    return this.success ? this.value! : defaultValue
  }

  unwrapOrElse(fn: (error: AppError) => T): T {
    return this.success ? this.value! : fn(this.error!)
  }
}

/**
 * Error Handler for Appwrite Operations
 */
export class AppwriteErrorHandler {
  private static readonly NETWORK_ERROR_CODES = [
    'ECONNRESET',
    'ETIMEDOUT', 
    'ENOTFOUND',
    'ECONNREFUSED',
    'ENETUNREACH'
  ]

  private static readonly RETRYABLE_ERROR_CODES = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
    'general_rate_limit_exceeded'
  ]

  static createError(
    error: unknown,
    context: Record<string, any> = {},
    userId?: string
  ): AppError {
    const timestamp = new Date()
    
    if (error instanceof Error) {
      return this.parseError(error, context, userId, timestamp)
    }
    
    return {
      type: 'UNKNOWN_ERROR',
      message: String(error),
      timestamp,
      retryable: false,
      context,
      userId
    }
  }

  private static parseError(
    error: Error,
    context: Record<string, any>,
    userId?: string,
    timestamp?: Date
  ): AppError {
    const message = error.message
    const cause = error.cause as any
    
    // Network errors
    if (this.isNetworkError(error, cause)) {
      return {
        type: 'NETWORK_ERROR',
        message: this.getNetworkErrorMessage(error, cause),
        code: cause?.code,
        cause: error,
        context,
        timestamp: timestamp || new Date(),
        retryable: true,
        userId
      }
    }

    // Appwrite specific errors
    if (this.isAppwriteError(error, cause)) {
      return this.parseAppwriteError(error, cause, context, userId, timestamp)
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('aborted')) {
      return {
        type: 'TIMEOUT_ERROR',
        message: 'Request timed out',
        cause: error,
        context,
        timestamp: timestamp || new Date(),
        retryable: true,
        userId
      }
    }

    // Default unknown error
    return {
      type: 'UNKNOWN_ERROR',
      message: message || 'An unknown error occurred',
      cause: error,
      context,
      timestamp: timestamp || new Date(),
      retryable: false,
      userId
    }
  }

  private static isNetworkError(error: Error, cause: any): boolean {
    return (
      this.NETWORK_ERROR_CODES.includes(cause?.code) ||
      error.message.includes('fetch failed') ||
      error.message.includes('network') ||
      error.message.includes('connection')
    )
  }

  private static isAppwriteError(error: Error, cause: any): boolean {
    return (
      cause?.type ||
      error.message.includes('appwrite') ||
      error.message.includes('unauthorized') ||
      error.message.includes('not found') ||
      error.message.includes('validation')
    )
  }

  private static getNetworkErrorMessage(error: Error, cause: any): string {
    const code = cause?.code
    const host = cause?.host
    
    switch (code) {
      case 'ECONNRESET':
        return `Connection to ${host || 'server'} was reset`
      case 'ETIMEDOUT':
        return `Connection to ${host || 'server'} timed out`
      case 'ENOTFOUND':
        return `Unable to reach ${host || 'server'}`
      case 'ECONNREFUSED':
        return `Connection to ${host || 'server'} was refused`
      case 'ENETUNREACH':
        return `Network is unreachable`
      default:
        return error.message || 'Network connection failed'
    }
  }

  private static parseAppwriteError(
    error: Error,
    cause: any,
    context: Record<string, any>,
    userId?: string,
    timestamp?: Date
  ): AppError {
    const type = cause?.type || 'unknown'
    const code = cause?.code || error.message

    switch (type) {
      case 'general_unauthorized_scope':
      case 'general_unauthorized':
        return {
          type: 'AUTHENTICATION_ERROR',
          message: 'Authentication required',
          code,
          cause: error,
          context,
          timestamp: timestamp || new Date(),
          retryable: false,
          userId
        }

      case 'general_forbidden_scope':
      case 'general_forbidden':
        return {
          type: 'PERMISSION_ERROR',
          message: 'Insufficient permissions',
          code,
          cause: error,
          context,
          timestamp: timestamp || new Date(),
          retryable: false,
          userId
        }

      case 'document_not_found':
      case 'general_not_found':
        return {
          type: 'NOT_FOUND_ERROR',
          message: 'Resource not found',
          code,
          cause: error,
          context,
          timestamp: timestamp || new Date(),
          retryable: false,
          userId
        }

      case 'general_rate_limit_exceeded':
        return {
          type: 'RATE_LIMIT_ERROR',
          message: 'Rate limit exceeded',
          code,
          cause: error,
          context,
          timestamp: timestamp || new Date(),
          retryable: true,
          userId
        }

      case 'general_argument_invalid':
      case 'general_invalid_argument':
        return {
          type: 'VALIDATION_ERROR',
          message: 'Invalid input provided',
          code,
          cause: error,
          context,
          timestamp: timestamp || new Date(),
          retryable: false,
          userId
        }

      default:
        return {
          type: 'UNKNOWN_ERROR',
          message: error.message || 'Appwrite operation failed',
          code,
          cause: error,
          context,
          timestamp: timestamp || new Date(),
          retryable: this.RETRYABLE_ERROR_CODES.includes(type),
          userId
        }
    }
  }

  static shouldRetry(error: AppError): boolean {
    return error.retryable
  }

  static getRetryDelay(error: AppError, attempt: number): number {
    const baseDelay = 1000 // 1 second
    const maxDelay = 30000 // 30 seconds
    
    if (error.type === 'RATE_LIMIT_ERROR') {
      return Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
    }
    
    if (error.type === 'NETWORK_ERROR') {
      return Math.min(baseDelay * Math.pow(1.5, attempt), maxDelay)
    }
    
    return baseDelay * Math.pow(2, attempt)
  }
}

/**
 * Wrapper for async operations with Result type
 */
export async function withResult<T>(
  operation: () => Promise<T>,
  context: Record<string, any> = {},
  userId?: string
): Promise<Result<T>> {
  try {
    const result = await operation()
    return Result.ok(result)
  } catch (error) {
    const appError = AppwriteErrorHandler.createError(error, context, userId)
    return Result.err(appError)
  }
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  context: Record<string, any> = {},
  userId?: string
): Promise<Result<T>> {
  let lastError: AppError | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await withResult(operation, context, userId)
    
    if (result.isSuccess()) {
      return result
    }

    const error = result.getError()!
    lastError = error

    // Don't retry if error is not retryable
    if (!AppwriteErrorHandler.shouldRetry(error)) {
      return result
    }

    // If this was the last attempt, return the error
    if (attempt === maxRetries) {
      return result
    }

    // Calculate delay and wait
    const delay = AppwriteErrorHandler.getRetryDelay(error, attempt)
    console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries + 1} in ${delay}ms...`)
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  return Result.err(lastError!)
}

// Export convenience functions
export const { ok, err } = Result 