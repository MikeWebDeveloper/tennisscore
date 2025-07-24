/**
 * Simple logger utility for development and debugging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  data?: any
}

class Logger {
  private isDevelopment: boolean
  private logLevel: LogLevel

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex >= currentLevelIndex
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    if (data) {
      // Handle error objects and circular references
      let serializedData: string
      try {
        if (data instanceof Error) {
          serializedData = JSON.stringify({
            name: data.name,
            message: data.message,
            stack: data.stack,
            cause: data.cause
          }, null, 2)
        } else if (typeof data === 'object' && data !== null) {
          // Handle circular references and empty objects
          const seen = new WeakSet()
          serializedData = JSON.stringify(data, (key, value) => {
            if (typeof value === 'object' && value !== null) {
              if (seen.has(value)) {
                return '[Circular Reference]'
              }
              seen.add(value)
            }
            return value
          }, 2)
        } else {
          serializedData = JSON.stringify(data, null, 2)
        }
      } catch (serializeError) {
        serializedData = `[Error serializing data: ${serializeError.message}]`
      }
      
      return `${prefix} ${message} ${serializedData}`
    }
    
    return `${prefix} ${message}`
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug') && this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, data))
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, data))
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data))
    }
  }

  error(message: string, data?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data))
    }
  }

  // Log to external service in production (placeholder)
  logToService(entry: LogEntry): void {
    if (!this.isDevelopment) {
      // In production, you might want to send logs to a service
      // like LogRocket, Sentry, or a custom logging endpoint
      // For now, we'll just use console
      console.log('PRODUCTION LOG:', entry)
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Convenience functions
export const log = logger.info.bind(logger)
export const debug = logger.debug.bind(logger)
export const warn = logger.warn.bind(logger)
export const error = logger.error.bind(logger)