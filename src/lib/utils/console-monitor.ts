/**
 * Comprehensive Console Monitoring System
 * Real-time browser behavior monitoring and error detection
 */

'use client'

export interface ConsoleLog {
  type: 'log' | 'warn' | 'error' | 'debug' | 'info'
  message: string
  timestamp: number
  url: string
  stack?: string
  metadata?: Record<string, unknown>
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'performance' | 'network' | 'react' | 'bundle' | 'user' | 'unknown'
}

export interface ConsoleReport {
  logs: ConsoleLog[]
  summary: {
    totalErrors: number
    totalWarnings: number
    criticalIssues: number
    performanceIssues: number
    networkIssues: number
    reactIssues: number
  }
  recommendations: string[]
}

class ConsoleMonitor {
  private logs: ConsoleLog[] = []
  private originalConsole: Record<string, (...args: unknown[]) => void> = {}
  private isMonitoring = false
  private callbacks: Array<(log: ConsoleLog) => void> = []
  private maxLogs = 1000 // Prevent memory leaks

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMonitoring()
    }
  }

  private initializeMonitoring(): void {
    if (this.isMonitoring) return

    // Store original console methods
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
      info: console.info
    }

    // Override console methods
    console.log = (...args) => {
      this.captureLog('log', args)
      this.originalConsole.log.apply(console, args)
    }

    console.warn = (...args) => {
      this.captureLog('warn', args)
      this.originalConsole.warn.apply(console, args)
    }

    console.error = (...args) => {
      this.captureLog('error', args)
      this.originalConsole.error.apply(console, args)
    }

    console.debug = (...args) => {
      this.captureLog('debug', args)
      this.originalConsole.debug.apply(console, args)
    }

    console.info = (...args) => {
      this.captureLog('info', args)
      this.originalConsole.info.apply(console, args)
    }

    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureLog('error', [event.message], {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
    })

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureLog('error', [`Unhandled Promise Rejection: ${event.reason}`], {
        reason: event.reason,
        stack: event.reason?.stack
      })
    })

    // React error boundary integration
    this.monitorReactErrors()

    this.isMonitoring = true
  }

  private monitorReactErrors(): void {
    // Monitor React hydration errors
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              if (element.textContent?.includes('Hydration failed') || 
                  element.textContent?.includes('React error')) {
                this.captureLog('error', ['React hydration or rendering error detected'], {
                  element: element.outerHTML,
                  category: 'react'
                })
              }
            }
          })
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  private captureLog(
    type: ConsoleLog['type'], 
    args: unknown[], 
    metadata?: Record<string, unknown>
  ): void {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ')

    const log: ConsoleLog = {
      type,
      message,
      timestamp: Date.now(),
      url: window.location.href,
      stack: metadata?.stack as string,
      metadata,
      severity: this.determineSeverity(type, message),
      category: this.categorizeLog(message)
    }

    this.logs.push(log)
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Notify callbacks
    this.callbacks.forEach(callback => callback(log))

    // Auto-react to critical issues
    if (log.severity === 'critical') {
      this.reactToCriticalIssue(log)
    }
  }

  private determineSeverity(type: ConsoleLog['type'], message: string): ConsoleLog['severity'] {
    if (type === 'error') {
      if (message.includes('Failed to initialize') || 
          message.includes('Cannot read properties') ||
          message.includes('TypeError') ||
          message.includes('ReferenceError')) {
        return 'critical'
      }
      return 'high'
    }
    
    if (type === 'warn') {
      if (message.includes('deprecated') || 
          message.includes('performance') ||
          message.includes('memory')) {
        return 'medium'
      }
      return 'low'
    }
    
    return 'low'
  }

  private categorizeLog(message: string): ConsoleLog['category'] {
    if (message.includes('performance') || 
        message.includes('LCP') || 
        message.includes('CLS') ||
        message.includes('monitoring')) {
      return 'performance'
    }
    
    if (message.includes('fetch') || 
        message.includes('network') ||
        message.includes('Failed to load') ||
        message.includes('HTTP')) {
      return 'network'
    }
    
    if (message.includes('React') || 
        message.includes('hydration') ||
        message.includes('component') ||
        message.includes('useState') ||
        message.includes('useEffect')) {
      return 'react'
    }
    
    if (message.includes('chunk') || 
        message.includes('bundle') ||
        message.includes('webpack') ||
        message.includes('import')) {
      return 'bundle'
    }
    
    return 'unknown'
  }

  private reactToCriticalIssue(log: ConsoleLog): void {
    // Auto-retry for network issues
    if (log.category === 'network' && log.message.includes('Failed to load')) {
      console.warn('🔄 Critical network issue detected - considering retry logic')
    }
    
    // Performance degradation
    if (log.category === 'performance' && log.message.includes('slow')) {
      console.warn('⚡ Performance degradation detected - considering optimization')
    }
    
    // React errors
    if (log.category === 'react') {
      console.warn('⚛️ React error detected - checking component state')
    }
  }

  public getLogs(): ConsoleLog[] {
    return [...this.logs]
  }

  public getLogsByCategory(category: ConsoleLog['category']): ConsoleLog[] {
    return this.logs.filter(log => log.category === category)
  }

  public getLogsBySeverity(severity: ConsoleLog['severity']): ConsoleLog[] {
    return this.logs.filter(log => log.severity === severity)
  }

  public generateReport(): ConsoleReport {
    const errors = this.logs.filter(log => log.type === 'error')
    const warnings = this.logs.filter(log => log.type === 'warn')
    const critical = this.logs.filter(log => log.severity === 'critical')
    
    const summary = {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      criticalIssues: critical.length,
      performanceIssues: this.getLogsByCategory('performance').length,
      networkIssues: this.getLogsByCategory('network').length,
      reactIssues: this.getLogsByCategory('react').length
    }

    const recommendations = this.generateRecommendations(summary)

    return {
      logs: this.logs,
      summary,
      recommendations
    }
  }

  private generateRecommendations(summary: ConsoleReport['summary']): string[] {
    const recommendations: string[] = []

    if (summary.criticalIssues > 0) {
      recommendations.push('🚨 Critical issues detected - immediate attention required')
    }

    if (summary.performanceIssues > 2) {
      recommendations.push('⚡ Multiple performance issues - consider optimization')
    }

    if (summary.networkIssues > 1) {
      recommendations.push('🌐 Network issues detected - check connectivity and retries')
    }

    if (summary.reactIssues > 0) {
      recommendations.push('⚛️ React issues detected - review component lifecycle')
    }

    if (summary.totalErrors === 0 && summary.totalWarnings === 0) {
      recommendations.push('✅ Console health looks good!')
    }

    return recommendations
  }

  public onLog(callback: (log: ConsoleLog) => void): () => void {
    this.callbacks.push(callback)
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  public clearLogs(): void {
    this.logs = []
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) return

    // Restore original console methods
    Object.entries(this.originalConsole).forEach(([method, fn]) => {
      (console as unknown as Record<string, unknown>)[method] = fn
    })

    this.isMonitoring = false
  }

  public startMonitoring(): void {
    if (!this.isMonitoring) {
      this.initializeMonitoring()
    }
  }
}

// Global console monitor instance
let globalConsoleMonitor: ConsoleMonitor | null = null

export const getConsoleMonitor = (): ConsoleMonitor => {
  if (!globalConsoleMonitor) {
    globalConsoleMonitor = new ConsoleMonitor()
  }
  return globalConsoleMonitor
}

export const startConsoleMonitoring = (): ConsoleMonitor => {
  const monitor = getConsoleMonitor()
  monitor.startMonitoring()
  return monitor
}

export const stopConsoleMonitoring = (): void => {
  if (globalConsoleMonitor) {
    globalConsoleMonitor.stopMonitoring()
  }
}

const consoleMonitorExports = {
  getConsoleMonitor,
  startConsoleMonitoring,
  stopConsoleMonitoring
}

export default consoleMonitorExports