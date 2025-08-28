/**
 * Web Vitals Performance Monitoring
 * Real browser performance measurement using official APIs
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals'

export interface PerformanceData {
  id: string
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  entries: PerformanceEntry[]
  navigationType: string
  url: string
  timestamp: number
}

export interface PerformanceSummary {
  lcp: PerformanceData | null
  cls: PerformanceData | null
  fcp: PerformanceData | null
  inp: PerformanceData | null
  ttfb: PerformanceData | null
  overallScore: number
  recommendations: string[]
}

// Performance thresholds based on Core Web Vitals
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  INP: { good: 200, poor: 500 },
  TTFB: { good: 800, poor: 1800 },
} as const

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS]
  if (!threshold) return 'good'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

function getNavigationType(): string {
  if (typeof window === 'undefined') return 'unknown'
  
  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  return navEntry?.type || 'unknown'
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceData> = new Map()
  private subscribers: ((summary: PerformanceSummary) => void)[] = []
  private initialized = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.init()
    }
  }

  private init() {
    if (this.initialized) return
    this.initialized = true

    // Core Web Vitals
    onLCP(this.handleMetric.bind(this))
    onCLS(this.handleMetric.bind(this))
    onFCP(this.handleMetric.bind(this))
    onINP(this.handleMetric.bind(this))
    onTTFB(this.handleMetric.bind(this))
  }

  private handleMetric(metric: Metric) {
    const performanceData: PerformanceData = {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: getRating(metric.name, metric.value),
      delta: metric.delta,
      entries: metric.entries,
      navigationType: getNavigationType(),
      url: window.location.href,
      timestamp: Date.now(),
    }

    this.metrics.set(metric.name, performanceData)
    this.notifySubscribers()

    // Send to analytics (optional)
    this.sendToAnalytics(performanceData)
  }

  private sendToAnalytics(data: PerformanceData) {
    // Send to your preferred analytics service
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Web Vital Measured:', {
        metric: data.name,
        value: data.value,
        rating: data.rating,
        url: data.url,
      })
    }

    // Example: Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', data.name, {
        custom_parameter_1: data.value,
        custom_parameter_2: data.rating,
      })
    }
  }

  public getSummary(): PerformanceSummary {
    const lcp = this.metrics.get('LCP') || null
    const cls = this.metrics.get('CLS') || null
    const fcp = this.metrics.get('FCP') || null
    const inp = this.metrics.get('INP') || null
    const ttfb = this.metrics.get('TTFB') || null

    const overallScore = this.calculateOverallScore([lcp, cls, fcp, inp, ttfb])
    const recommendations = this.generateRecommendations([lcp, cls, fcp, inp, ttfb])

    return {
      lcp,
      cls,
      fcp,
      inp,
      ttfb,
      overallScore,
      recommendations,
    }
  }

  private calculateOverallScore(metrics: (PerformanceData | null)[]): number {
    const validMetrics = metrics.filter(Boolean) as PerformanceData[]
    if (validMetrics.length === 0) return 0

    const scores: number[] = validMetrics.map(metric => {
      switch (metric.rating) {
        case 'good': return 100
        case 'needs-improvement': return 75
        case 'poor': return 25
        default: return 0
      }
    })

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  }

  private generateRecommendations(metrics: (PerformanceData | null)[]): string[] {
    const recommendations: string[] = []
    
    metrics.forEach(metric => {
      if (!metric) return
      
      if (metric.rating === 'poor' || metric.rating === 'needs-improvement') {
        switch (metric.name) {
          case 'LCP':
            recommendations.push('Optimize images and fonts loading')
            recommendations.push('Reduce server response time')
            recommendations.push('Remove render-blocking resources')
            break
          case 'INP':
            recommendations.push('Minimize JavaScript execution time')
            recommendations.push('Remove non-critical third-party scripts')
            recommendations.push('Use a web worker for heavy computations')
            break
          case 'CLS':
            recommendations.push('Reserve space for images and ads')
            recommendations.push('Avoid inserting content above existing content')
            recommendations.push('Use transform animations instead of properties that trigger layout')
            break
          case 'FCP':
            recommendations.push('Reduce render-blocking resources')
            recommendations.push('Minify CSS and JavaScript')
            recommendations.push('Remove unused CSS')
            break
          case 'TTFB':
            recommendations.push('Use a fast CDN')
            recommendations.push('Optimize server processing time')
            recommendations.push('Use service worker caching')
            break
        }
      }
    })

    return [...new Set(recommendations)] // Remove duplicates
  }

  public subscribe(callback: (summary: PerformanceSummary) => void) {
    this.subscribers.push(callback)
    
    // Immediately call with current data if available
    if (this.metrics.size > 0) {
      callback(this.getSummary())
    }

    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) {
        this.subscribers.splice(index, 1)
      }
    }
  }

  private notifySubscribers() {
    const summary = this.getSummary()
    this.subscribers.forEach(callback => callback(summary))
  }

  public getMetric(name: string): PerformanceData | null {
    return this.metrics.get(name) || null
  }

  public getAllMetrics(): PerformanceData[] {
    return Array.from(this.metrics.values())
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Convenience hooks for React components
export function useWebVitals() {
  const [summary, setSummary] = React.useState<PerformanceSummary>(() => 
    performanceMonitor.getSummary()
  )

  React.useEffect(() => {
    return performanceMonitor.subscribe(setSummary)
  }, [])

  return summary
}

// Additional performance utilities
export function measureInteractionLatency(name: string, fn: () => void | Promise<void>) {
  const start = performance.now()
  
  const measure = () => {
    const duration = performance.now() - start
    console.log(`🎯 ${name} completed in ${duration.toFixed(2)}ms`)
    
    if (duration > 100) {
      console.warn(`⚠️ Slow interaction detected: ${name} took ${duration.toFixed(2)}ms`)
    }
  }

  const result = fn()
  
  if (result instanceof Promise) {
    return result.finally(measure)
  } else {
    measure()
    return result
  }
}

export function measureComponentRender(componentName: string) {
  return (WrappedComponent: React.ComponentType<any>) => {
    const MeasuredComponent = React.memo((props: any) => {
      const renderStart = React.useRef<number>(0)
      
      React.useLayoutEffect(() => {
        if (renderStart.current) {
          const duration = performance.now() - renderStart.current
          if (duration > 16) { // More than 1 frame at 60fps
            console.warn(`🐌 Slow render: ${componentName} took ${duration.toFixed(2)}ms`)
          }
        }
      })
      
      renderStart.current = performance.now()
      
      return React.createElement(WrappedComponent, props)
    })

    MeasuredComponent.displayName = `measureComponentRender(${componentName})`
    return MeasuredComponent
  }
}

// Fix the React import issue
import React from 'react'