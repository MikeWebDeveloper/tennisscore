/**
 * Core Web Vitals Monitoring
 * Tracks LCP (Largest Contentful Paint), INP (Interaction to Next Paint), and CLS (Cumulative Layout Shift)
 */

'use client'

export interface WebVitalMetric {
  name: 'LCP' | 'INP' | 'CLS' | 'FID' | 'TTFB' | 'FCP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache'
  timestamp: number
  url: string
  userAgent: string
}

export interface WebVitalsReport {
  metrics: WebVitalMetric[]
  aggregatedData: {
    avgLCP: number
    avgINP: number
    avgCLS: number
    avgFID: number
    avgTTFB: number
    avgFCP: number
  }
  performance: {
    score: number
    status: 'excellent' | 'good' | 'fair' | 'poor'
    recommendations: string[]
  }
  sessionInfo: {
    userAgent: string
    viewport: { width: number; height: number }
    connection: string
    deviceMemory?: number
    hardwareConcurrency: number
  }
}

class WebVitalsMonitor {
  private metrics: WebVitalMetric[] = []
  private observers: PerformanceObserver[] = []
  private isMonitoring = false
  private callbacks: ((metric: WebVitalMetric) => void)[] = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupObservers()
    }
  }

  private setupObservers(): void {
    // LCP Observer
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as PerformanceEntry
          
          if (lastEntry) {
            this.recordMetric({
              name: 'LCP',
              value: lastEntry.startTime,
              delta: lastEntry.startTime,
              id: this.generateId(),
              navigationType: this.getNavigationType(),
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent,
              rating: this.getRating('LCP', lastEntry.startTime)
            })
          }
        })
        
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
        this.observers.push(lcpObserver)
      } catch (error) {
        console.warn('LCP observer setup failed:', error)
      }

      // FCP Observer
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: PerformanceEntry) => {
            if (entry.name === 'first-contentful-paint') {
              this.recordMetric({
                name: 'FCP',
                value: entry.startTime,
                delta: entry.startTime,
                id: this.generateId(),
                navigationType: this.getNavigationType(),
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                rating: this.getRating('FCP', entry.startTime)
              })
            }
          })
        })
        
        fcpObserver.observe({ type: 'paint', buffered: true })
        this.observers.push(fcpObserver)
      } catch (error) {
        console.warn('FCP observer setup failed:', error)
      }

      // CLS Observer
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
              this.recordMetric({
                name: 'CLS',
                value: clsValue,
                delta: (entry as any).value,
                id: this.generateId(),
                navigationType: this.getNavigationType(),
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                rating: this.getRating('CLS', clsValue)
              })
            }
          })
        })
        
        clsObserver.observe({ type: 'layout-shift', buffered: true })
        this.observers.push(clsObserver)
      } catch (error) {
        console.warn('CLS observer setup failed:', error)
      }

      // INP Observer (modern browsers)
      if ('PerformanceEventTiming' in window) {
        try {
          let maxINP = 0
          const inpObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
              if ((entry as any).processingStart && (entry as any).processingEnd) {
                const duration = (entry as any).processingEnd - entry.startTime
                if (duration > maxINP) {
                  maxINP = duration
                  this.recordMetric({
                    name: 'INP',
                    value: duration,
                    delta: duration - maxINP,
                    id: this.generateId(),
                    navigationType: this.getNavigationType(),
                    timestamp: Date.now(),
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    rating: this.getRating('INP', duration)
                  })
                }
              }
            })
          })
          
          inpObserver.observe({ type: 'event', buffered: true })
          this.observers.push(inpObserver)
        } catch (error) {
          console.warn('INP observer setup failed:', error)
        }
      }
    }

    // TTFB measurement
    this.measureTTFB()
  }

  private measureTTFB(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as any
      if (navigation && navigation.responseStart) {
        const ttfb = navigation.responseStart - navigation.requestStart
        this.recordMetric({
          name: 'TTFB',
          value: ttfb,
          delta: ttfb,
          id: this.generateId(),
          navigationType: this.getNavigationType(),
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          rating: this.getRating('TTFB', ttfb)
        })
      }
    }
  }

  private recordMetric(metric: WebVitalMetric): void {
    this.metrics.push(metric)
    this.callbacks.forEach(callback => callback(metric))
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.info(`📊 Web Vital - ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`)
    }
  }

  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FCP: { good: 1800, poor: 3000 },
      CLS: { good: 0.1, poor: 0.25 },
      INP: { good: 200, poor: 500 },
      FID: { good: 100, poor: 300 },
      TTFB: { good: 800, poor: 1800 }
    }

    const threshold = thresholds[metricName as keyof typeof thresholds]
    if (!threshold) return 'good'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  private getNavigationType(): WebVitalMetric['navigationType'] {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as any
      return navigation?.type || 'navigate'
    }
    return 'navigate'
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  public startMonitoring(): void {
    this.isMonitoring = true
  }

  public stopMonitoring(): void {
    this.isMonitoring = false
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }

  public getMetrics(): WebVitalMetric[] {
    return [...this.metrics]
  }

  public getLatestMetrics(): Partial<Record<WebVitalMetric['name'], WebVitalMetric>> {
    const latest: Partial<Record<WebVitalMetric['name'], WebVitalMetric>> = {}
    
    this.metrics.forEach(metric => {
      if (!latest[metric.name] || metric.timestamp > latest[metric.name]!.timestamp) {
        latest[metric.name] = metric
      }
    })
    
    return latest
  }

  public generateReport(): WebVitalsReport {
    const latest = this.getLatestMetrics()
    
    const aggregatedData = {
      avgLCP: latest.LCP?.value || 0,
      avgINP: latest.INP?.value || 0,
      avgCLS: latest.CLS?.value || 0,
      avgFID: latest.FID?.value || 0,
      avgTTFB: latest.TTFB?.value || 0,
      avgFCP: latest.FCP?.value || 0
    }

    const score = this.calculatePerformanceScore(latest)
    const status = this.getPerformanceStatus(score)
    const recommendations = this.generateRecommendations(latest)

    const sessionInfo = {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: (navigator as any).connection?.effectiveType || 'unknown',
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency
    }

    return {
      metrics: this.metrics,
      aggregatedData,
      performance: {
        score,
        status,
        recommendations
      },
      sessionInfo
    }
  }

  private calculatePerformanceScore(metrics: Partial<Record<WebVitalMetric['name'], WebVitalMetric>>): number {
    let score = 100

    Object.values(metrics).forEach(metric => {
      if (metric) {
        switch (metric.rating) {
          case 'good':
            // No penalty
            break
          case 'needs-improvement':
            score -= 15
            break
          case 'poor':
            score -= 30
            break
        }
      }
    })

    return Math.max(0, score)
  }

  private getPerformanceStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 50) return 'fair'
    return 'poor'
  }

  private generateRecommendations(metrics: Partial<Record<WebVitalMetric['name'], WebVitalMetric>>): string[] {
    const recommendations: string[] = []

    if (metrics.LCP && metrics.LCP.rating !== 'good') {
      recommendations.push('Optimize Largest Contentful Paint by reducing server response times and optimizing images')
    }

    if (metrics.CLS && metrics.CLS.rating !== 'good') {
      recommendations.push('Reduce Cumulative Layout Shift by setting size attributes on images and avoiding dynamic content insertion')
    }

    if (metrics.INP && metrics.INP.rating !== 'good') {
      recommendations.push('Improve Interaction to Next Paint by optimizing JavaScript execution and reducing blocking tasks')
    }

    if (metrics.TTFB && metrics.TTFB.rating !== 'good') {
      recommendations.push('Reduce Time to First Byte by optimizing server performance and using CDN')
    }

    if (metrics.FCP && metrics.FCP.rating !== 'good') {
      recommendations.push('Improve First Contentful Paint by optimizing critical rendering path and reducing render-blocking resources')
    }

    return recommendations
  }

  public onMetric(callback: (metric: WebVitalMetric) => void): () => void {
    this.callbacks.push(callback)
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  public clearMetrics(): void {
    this.metrics = []
  }

  public recordCustomMetric(name: string, value: number, unit: string, metadata?: Record<string, unknown>): void {
    const metric: WebVitalMetric = {
      name: name as WebVitalMetric['name'],
      value,
      delta: value,
      rating: 'good', // Default rating for custom metrics
      id: this.generateId(),
      navigationType: this.getNavigationType(),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }
    
    this.recordMetric(metric)
  }

  public destroy(): void {
    this.stopMonitoring()
    this.clearMetrics()
  }
}

// Global instance
let webVitalsMonitor: WebVitalsMonitor | null = null

export const getWebVitalsMonitor = (): WebVitalsMonitor => {
  if (!webVitalsMonitor) {
    webVitalsMonitor = new WebVitalsMonitor()
  }
  return webVitalsMonitor
}

export const startWebVitalsMonitoring = (): WebVitalsMonitor => {
  const monitor = getWebVitalsMonitor()
  monitor.startMonitoring()
  return monitor
}

export const stopWebVitalsMonitoring = (): void => {
  if (webVitalsMonitor) {
    webVitalsMonitor.stopMonitoring()
  }
}

export default {
  getWebVitalsMonitor,
  startWebVitalsMonitoring,
  stopWebVitalsMonitoring
}