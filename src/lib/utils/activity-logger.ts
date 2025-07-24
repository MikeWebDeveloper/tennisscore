/**
 * Activity Logger - Tracks user actions and application events
 * Provides comprehensive logging for debugging, analytics, and user experience improvements
 */

export interface ActivityLogEntry {
  id: string
  timestamp: Date
  type: 'user_action' | 'system_event' | 'error' | 'performance' | 'navigation'
  category: string
  action: string
  details?: Record<string, any>
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
  duration?: number
  success?: boolean
  error?: string
}

export interface ActivityLoggerConfig {
  enabled: boolean
  maxEntries: number
  persistToStorage: boolean
  sendToServer: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

class ActivityLogger {
  private logs: ActivityLogEntry[] = []
  private config: ActivityLoggerConfig
  private sessionId: string

  constructor(config: Partial<ActivityLoggerConfig> = {}) {
    this.config = {
      enabled: true,
      maxEntries: 1000,
      persistToStorage: true,
      sendToServer: false,
      logLevel: 'info',
      ...config
    }
    
    this.sessionId = this.generateSessionId()
    this.loadFromStorage()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getCurrentUrl(): string {
    if (typeof window !== 'undefined') {
      return window.location.href
    }
    return 'unknown'
  }

  private getUserAgent(): string {
    if (typeof window !== 'undefined') {
      return window.navigator.userAgent
    }
    return 'unknown'
  }

  private shouldLog(level: string): boolean {
    if (!this.config.enabled) return false
    
    const levels = { debug: 0, info: 1, warn: 2, error: 3 }
    return levels[level as keyof typeof levels] >= levels[this.config.logLevel]
  }

  private addLog(entry: Omit<ActivityLogEntry, 'id' | 'timestamp' | 'sessionId' | 'userAgent' | 'url'>): void {
    if (!this.shouldLog('info')) return

    const logEntry: ActivityLogEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date(),
      sessionId: this.sessionId,
      userAgent: this.getUserAgent(),
      url: this.getCurrentUrl()
    }

    this.logs.push(logEntry)

    // Keep only the latest entries
    if (this.logs.length > this.config.maxEntries) {
      this.logs = this.logs.slice(-this.config.maxEntries)
    }

    // Persist to storage
    if (this.config.persistToStorage) {
      this.saveToStorage()
    }

    // Send to server if configured
    if (this.config.sendToServer) {
      this.sendToServer(logEntry)
    }

    // Console output for debugging
    if (this.config.logLevel === 'debug') {
      console.log('Activity Log:', logEntry)
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return
    
    try {
      const data = JSON.stringify({
        logs: this.logs.slice(-100), // Keep only last 100 entries in storage
        sessionId: this.sessionId,
        lastUpdated: new Date().toISOString()
      })
      localStorage.setItem('tennisscore_activity_logs', data)
    } catch (error) {
      console.warn('Failed to save activity logs to storage:', error)
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return
    
    try {
      const data = localStorage.getItem('tennisscore_activity_logs')
      if (data) {
        const parsed = JSON.parse(data)
        if (parsed.sessionId === this.sessionId) {
          this.logs = parsed.logs || []
        }
      }
    } catch (error) {
      console.warn('Failed to load activity logs from storage:', error)
    }
  }

  private async sendToServer(logEntry: ActivityLogEntry): Promise<void> {
    try {
      // This would be implemented to send logs to your analytics server
      // For now, we'll just log to console
      console.log('Sending activity log to server:', logEntry)
    } catch (error) {
      console.warn('Failed to send activity log to server:', error)
    }
  }

  // Public API methods

  /**
   * Log a user action
   */
  logUserAction(
    category: string,
    action: string,
    details?: Record<string, any>,
    userId?: string
  ): void {
    this.addLog({
      type: 'user_action',
      category,
      action,
      details,
      userId,
      success: true
    })
  }

  /**
   * Log a system event
   */
  logSystemEvent(
    category: string,
    action: string,
    details?: Record<string, any>
  ): void {
    this.addLog({
      type: 'system_event',
      category,
      action,
      details,
      success: true
    })
  }

  /**
   * Log an error
   */
  logError(
    category: string,
    action: string,
    error: string,
    details?: Record<string, any>
  ): void {
    this.addLog({
      type: 'error',
      category,
      action,
      error,
      details,
      success: false
    })
  }

  /**
   * Log performance metrics
   */
  logPerformance(
    category: string,
    action: string,
    duration: number,
    details?: Record<string, any>
  ): void {
    this.addLog({
      type: 'performance',
      category,
      action,
      duration,
      details,
      success: true
    })
  }

  /**
   * Log navigation events
   */
  logNavigation(
    from: string,
    to: string,
    duration?: number
  ): void {
    this.addLog({
      type: 'navigation',
      category: 'navigation',
      action: 'page_navigation',
      details: { from, to },
      duration,
      success: true
    })
  }

  /**
   * Get all logs
   */
  getLogs(): ActivityLogEntry[] {
    return [...this.logs]
  }

  /**
   * Get logs by type
   */
  getLogsByType(type: ActivityLogEntry['type']): ActivityLogEntry[] {
    return this.logs.filter(log => log.type === type)
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: string): ActivityLogEntry[] {
    return this.logs.filter(log => log.category === category)
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 10): ActivityLogEntry[] {
    return this.logs.slice(-count)
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = []
    if (this.config.persistToStorage) {
      localStorage.removeItem('tennisscore_activity_logs')
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify({
      logs: this.logs,
      sessionId: this.sessionId,
      exportedAt: new Date().toISOString()
    }, null, 2)
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalActions: number
    errors: number
    averageDuration: number
    mostActiveCategory: string
    sessionDuration: number
  } {
    const now = new Date()
    const sessionStart = this.logs[0]?.timestamp || now
    const sessionDuration = now.getTime() - sessionStart.getTime()

    const categoryCounts = this.logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostActiveCategory = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown'

    const performanceLogs = this.logs.filter(log => log.duration !== undefined)
    const averageDuration = performanceLogs.length > 0
      ? performanceLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / performanceLogs.length
      : 0

    return {
      totalActions: this.logs.length,
      errors: this.logs.filter(log => log.type === 'error').length,
      averageDuration,
      mostActiveCategory,
      sessionDuration
    }
  }
}

// Create a singleton instance
export const activityLogger = new ActivityLogger()

// Convenience functions for common actions
export const logUserAction = (category: string, action: string, details?: Record<string, any>, userId?: string) => {
  activityLogger.logUserAction(category, action, details, userId)
}

export const logSystemEvent = (category: string, action: string, details?: Record<string, any>) => {
  activityLogger.logSystemEvent(category, action, details)
}

export const logError = (category: string, action: string, error: string, details?: Record<string, any>) => {
  activityLogger.logError(category, action, error, details)
}

export const logPerformance = (category: string, action: string, duration: number, details?: Record<string, any>) => {
  activityLogger.logPerformance(category, action, duration, details)
}

export const logNavigation = (from: string, to: string, duration?: number) => {
  activityLogger.logNavigation(from, to, duration)
}

export default activityLogger 