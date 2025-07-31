/**
 * Production Performance Monitoring & Analytics
 * Tracks real-world performance metrics and sends to monitoring services
 */

import { PerformanceData, PerformanceSummary } from '@/lib/performance/web-vitals'

export interface PerformanceAlert {
  severity: 'info' | 'warning' | 'error' | 'critical'
  metric: string
  value: number
  threshold: number
  timestamp: number
  url: string
  userAgent: string
}

export interface PerformanceSessionData {
  sessionId: string
  userId?: string
  device: DeviceInfo
  connection: ConnectionInfo
  metrics: PerformanceData[]
  errors: ErrorInfo[]
  timestamp: number
  duration: number
}

interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop'
  memory?: number
  cores?: number
  gpu?: string
}

interface ConnectionInfo {
  effectiveType: string
  downlink: number
  rtt: number
  saveData: boolean
}

interface ErrorInfo {
  message: string
  stack?: string
  timestamp: number
  url: string
}

class PerformanceTracker {
  private sessionId: string
  private startTime: number
  private alerts: PerformanceAlert[] = []
  private errors: ErrorInfo[] = []
  private isInitialized = false

  constructor() {
    this.sessionId = this.generateSessionId()
    this.startTime = Date.now()
    
    if (typeof window !== 'undefined') {
      this.init()
    }
  }

  private init() {
    if (this.isInitialized) return
    this.isInitialized = true

    // Monitor performance metrics
    this.setupMetricMonitoring()
    
    // Monitor errors
    this.setupErrorMonitoring()
    
    // Monitor resource loading
    this.setupResourceMonitoring()
    
    // Monitor user interactions
    this.setupInteractionMonitoring()
    
    // Send data periodically
    this.setupDataTransmission()
  }

  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private setupMetricMonitoring() {
    // Monitor Core Web Vitals thresholds
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        this.processPerformanceEntry(entry)
      })
    })

    observer.observe({ entryTypes: ['measure', 'navigation', 'resource', 'paint'] })
  }

  private setupErrorMonitoring() {
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: window.location.href,
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled promise rejection: ${event.reason}`,
        timestamp: Date.now(),
        url: window.location.href,
      })
    })
  }

  private setupResourceMonitoring() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming
          
          // Alert on slow resources
          if (resourceEntry.duration > 3000) {
            this.createAlert({
              severity: 'warning',
              metric: 'slow-resource',
              value: resourceEntry.duration,
              threshold: 3000,
              timestamp: Date.now(),
              url: resourceEntry.name,
              userAgent: navigator.userAgent,
            })
          }
        }
      })
    })

    observer.observe({ entryTypes: ['resource'] })
  }

  private setupInteractionMonitoring() {
    let interactionStart: number
    
    ['click', 'keydown', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        interactionStart = performance.now()
      }, { passive: true })
    })

    // Monitor long tasks that could affect responsiveness
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // Long task threshold
            this.createAlert({
              severity: 'warning',
              metric: 'long-task',
              value: entry.duration,
              threshold: 50,
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent,
            })
          }
        })
      })

      observer.observe({ entryTypes: ['longtask'] })
    }
  }

  private setupDataTransmission() {
    // Send data every 30 seconds
    setInterval(() => {
      this.transmitData()
    }, 30000)

    // Send data before page unload
    window.addEventListener('beforeunload', () => {
      this.transmitData(true)
    })

    // Send data when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.transmitData()
      }
    })
  }

  private processPerformanceEntry(entry: PerformanceEntry) {
    // Process navigation timing
    if (entry.entryType === 'navigation') {
      const navEntry = entry as PerformanceNavigationTiming
      
      // Check TTFB
      if (navEntry.responseStart - navEntry.requestStart > 1000) {
        this.createAlert({
          severity: 'warning',
          metric: 'ttfb',
          value: navEntry.responseStart - navEntry.requestStart,
          threshold: 1000,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        })
      }
    }
  }

  private createAlert(alert: PerformanceAlert) {
    this.alerts.push(alert)
    
    // Immediate critical alerts
    if (alert.severity === 'critical') {
      this.sendCriticalAlert(alert)
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 Performance Alert:', alert)
    }
  }

  private trackError(error: ErrorInfo) {
    this.errors.push(error)
    
    if (process.env.NODE_ENV === 'development') {
      console.error('💥 Performance Error:', error)
    }
  }

  private getDeviceInfo(): DeviceInfo {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isTablet = /iPad|Android.*Tablet/i.test(navigator.userAgent)
    
    return {
      type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      memory: (navigator as any).deviceMemory,
      cores: navigator.hardwareConcurrency,
    }
  }

  private getConnectionInfo(): ConnectionInfo {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
    return {
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false,
    }
  }

  private async transmitData(isPageUnload = false) {
    const sessionData: PerformanceSessionData = {
      sessionId: this.sessionId,
      device: this.getDeviceInfo(),
      connection: this.getConnectionInfo(),
      metrics: [], // Would be populated by performanceMonitor
      errors: [...this.errors],
      timestamp: this.startTime,
      duration: Date.now() - this.startTime,
    }

    try {
      if (isPageUnload) {
        // Use sendBeacon for reliable transmission during page unload
        navigator.sendBeacon('/api/performance/session', JSON.stringify(sessionData))
      } else {
        await this.sendToAnalytics(sessionData)
      }
      
      // Clear sent data
      this.errors = []
      this.alerts = []
      
    } catch (error) {
      console.error('Failed to transmit performance data:', error)
    }
  }

  private async sendToAnalytics(data: PerformanceSessionData) {
    // Send to your analytics service
    try {
      await fetch('/api/performance/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    } catch (error) {
      // Fallback to local storage for offline scenarios
      this.storeOfflineData(data)
    }
  }

  private async sendCriticalAlert(alert: PerformanceAlert) {
    try {
      await fetch('/api/performance/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert),
      })
    } catch (error) {
      console.error('Failed to send critical alert:', error)
    }
  }

  private storeOfflineData(data: PerformanceSessionData) {
    try {
      const offlineData = localStorage.getItem('tennis-performance-offline') || '[]'
      const parsedData = JSON.parse(offlineData)
      parsedData.push(data)
      
      // Keep only last 10 sessions to avoid storage bloat
      localStorage.setItem('tennis-performance-offline', JSON.stringify(parsedData.slice(-10)))
    } catch (error) {
      console.error('Failed to store offline performance data:', error)
    }
  }

  public trackCustomMetric(name: string, value: number, context?: Record<string, any>) {
    const customMetric: PerformanceData = {
      id: `custom_${Date.now()}_${Math.random()}`,
      name,
      value,
      rating: 'good', // Would need custom thresholds
      delta: 0,
      entries: [],
      navigationType: 'custom',
      url: window.location.href,
      timestamp: Date.now(),
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('📏 Custom Metric:', { name, value, context })
    }

    // Send immediately for custom metrics
    this.sendToAnalytics({
      sessionId: this.sessionId,
      device: this.getDeviceInfo(),
      connection: this.getConnectionInfo(),
      metrics: [customMetric],
      errors: [],
      timestamp: Date.now(),
      duration: 0,
    })
  }

  public getSessionId(): string {
    return this.sessionId
  }

  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts]
  }

  public getErrors(): ErrorInfo[] {
    return [...this.errors]
  }
}

// Singleton instance
export const performanceTracker = new PerformanceTracker()

// React integration
export function usePerformanceTracking() {
  return {
    trackCustomMetric: performanceTracker.trackCustomMetric.bind(performanceTracker),
    sessionId: performanceTracker.getSessionId(),
    alerts: performanceTracker.getAlerts(),
    errors: performanceTracker.getErrors(),
  }
}