"use client"

import { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslations } from '@/i18n'

interface PerformanceMetric {
  timestamp: number
  metric: string
  value: number
  target: number
  passed: boolean
}

interface UIResponseMetrics {
  clickToRender: number
  renderToScreen: number
  totalResponse: number
  frameDrops: number
  memoryUsage: number
}

interface PerformanceReport {
  overall: 'excellent' | 'good' | 'poor' | 'critical'
  metrics: PerformanceMetric[]
  uiMetrics: UIResponseMetrics
  recommendations: string[]
  timestamp: number
}

/**
 * Real-time performance monitoring for tennis scoring app
 * Validates sub-100ms target and provides optimization insights
 */
export function usePerformanceMonitoring(enabled: boolean = true) {
  const t = useTranslations('common')
  const [report, setReport] = useState<PerformanceReport | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  
  // Performance measurement state
  const metricsRef = useRef<PerformanceMetric[]>([])
  const observerRef = useRef<PerformanceObserver | null>(null)
  const clickStartRef = useRef<number>(0)
  const renderStartRef = useRef<number>(0)

  // Web Vitals and custom metrics collection
  const collectWebVitals = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return

    // Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        let metric: PerformanceMetric | null = null

        switch (entry.entryType) {
          case 'measure':
            if (entry.name.startsWith('tennis-scoring-')) {
              metric = {
                timestamp: Date.now(),
                metric: entry.name,
                value: entry.duration,
                target: 100, // 100ms target
                passed: entry.duration < 100
              }
            }
            break

          case 'navigation':
            const navEntry = entry as PerformanceNavigationTiming
            metric = {
              timestamp: Date.now(),
              metric: 'page-load-time',
              value: navEntry.loadEventEnd - navEntry.fetchStart,
              target: 2000, // 2s target
              passed: (navEntry.loadEventEnd - navEntry.fetchStart) < 2000
            }
            break

          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              metric = {
                timestamp: Date.now(),
                metric: 'first-contentful-paint',
                value: entry.startTime,
                target: 1500, // 1.5s target
                passed: entry.startTime < 1500
              }
            }
            break
        }

        if (metric) {
          metricsRef.current.push(metric)
        }
      })
    })

    observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] })
    observerRef.current = observer

    return () => observer.disconnect()
  }, [enabled])

  // UI Response Time Measurement
  const measureUIResponse = useCallback(() => {
    if (!enabled) return { clickToRender: 0, renderToScreen: 0, totalResponse: 0, frameDrops: 0, memoryUsage: 0 }

    const clickToRender = renderStartRef.current - clickStartRef.current
    const renderToScreen = performance.now() - renderStartRef.current
    const totalResponse = clickToRender + renderToScreen

    // Memory usage (if available)
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0

    // Frame drops estimation
    const frameDrops = totalResponse > 16 ? Math.floor(totalResponse / 16) - 1 : 0

    return {
      clickToRender: Math.round(clickToRender),
      renderToScreen: Math.round(renderToScreen),
      totalResponse: Math.round(totalResponse),
      frameDrops,
      memoryUsage: Math.round(memoryUsage / 1024 / 1024) // MB
    }
  }, [enabled])

  // Start UI interaction measurement
  const startUIInteraction = useCallback((interactionName: string) => {
    if (!enabled) return

    clickStartRef.current = performance.now()
    performance.mark(`${interactionName}-start`)
  }, [enabled])

  // Complete UI interaction measurement
  const completeUIInteraction = useCallback((interactionName: string) => {
    if (!enabled) return

    renderStartRef.current = performance.now()
    performance.mark(`${interactionName}-end`)
    performance.measure(
      `tennis-scoring-${interactionName}`,
      `${interactionName}-start`,
      `${interactionName}-end`
    )

    // Update UI metrics
    const uiMetrics = measureUIResponse()
    
    // Generate recommendations
    const recommendations: string[] = []
    
    if (uiMetrics.totalResponse > 100) {
      recommendations.push('UI response time exceeds 100ms target - consider optimizations')
    }
    if (uiMetrics.frameDrops > 2) {
      recommendations.push('Frame drops detected - optimize animations and transitions')
    }
    if (uiMetrics.memoryUsage > 50) {
      recommendations.push('High memory usage detected - check for memory leaks')
    }

    // Determine overall performance rating
    let overall: PerformanceReport['overall'] = 'excellent'
    if (uiMetrics.totalResponse > 200) overall = 'critical'
    else if (uiMetrics.totalResponse > 150) overall = 'poor'
    else if (uiMetrics.totalResponse > 100) overall = 'good'

    // Update report
    setReport({
      overall,
      metrics: [...metricsRef.current],
      uiMetrics,
      recommendations,
      timestamp: Date.now()
    })
  }, [enabled, measureUIResponse])

  // Benchmark specific tennis scoring operations
  const benchmarkScoringOperation = useCallback(async (operation: () => Promise<void> | void) => {
    if (!enabled) return null

    const start = performance.now()
    startUIInteraction('scoring-operation')
    
    try {
      await operation()
      completeUIInteraction('scoring-operation')
      
      const duration = performance.now() - start
      return {
        duration: Math.round(duration),
        passed: duration < 100,
        rating: duration < 50 ? 'excellent' : duration < 100 ? 'good' : duration < 200 ? 'poor' : 'critical'
      }
    } catch (error) {
      console.error('Benchmark operation failed:', error)
      return null
    }
  }, [enabled, startUIInteraction, completeUIInteraction])

  // Performance monitoring lifecycle
  useEffect(() => {
    if (!enabled) return

    setIsMonitoring(true)
    const cleanup = collectWebVitals()

    return () => {
      setIsMonitoring(false)
      if (cleanup) cleanup()
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [enabled, collectWebVitals])

  // Export performance data for analysis
  const exportPerformanceData = useCallback(() => {
    if (!report) return null

    return {
      timestamp: new Date().toISOString(),
      report,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    }
  }, [report])

  return {
    // Current performance state
    report,
    isMonitoring,
    
    // Measurement methods
    startUIInteraction,
    completeUIInteraction,
    benchmarkScoringOperation,
    
    // Utilities
    exportPerformanceData,
    
    // Quick checks
    isPerformant: report?.overall === 'excellent' || report?.overall === 'good',
    needsOptimization: report?.overall === 'poor' || report?.overall === 'critical'
  }
}

// React component for performance dashboard
export function usePerformanceDashboard() {
  const { report, isMonitoring, isPerformant, needsOptimization } = usePerformanceMonitoring(true)
  
  const dashboardData = {
    status: isPerformant ? 'optimal' : needsOptimization ? 'needs-attention' : 'monitoring',
    latency: report?.uiMetrics.totalResponse || 0,
    target: 100,
    metrics: report?.metrics || [],
    recommendations: report?.recommendations || []
  }
  
  return {
    dashboardData,
    isMonitoring,
    hasData: !!report
  }
}