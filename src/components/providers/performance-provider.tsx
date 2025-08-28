/**
 * Performance Provider
 * Coordinates all performance optimizations across the tennis scoring app
 */

"use client"

'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { performanceMonitor, PerformanceSummary } from '@/lib/performance/web-vitals'
import { performanceTracker } from '@/lib/monitoring/performance-tracker'
import { useTennisPerformance } from '@/hooks/use-performance-monitoring'

interface PerformanceContextType {
  webVitals: PerformanceSummary
  tennisMetrics: {
    averageScoreLatency: number
    averageMatchUpdateLatency: number
    averageRealTimeLatency: number
    isPerformanceGood: boolean
  }
  trackCustomMetric: (name: string, value: number, context?: Record<string, any>) => void
  measureScore: (fn: () => void | Promise<void>) => void | Promise<void>
  measureMatchUpdate: (fn: () => void | Promise<void>) => void | Promise<void>
  measureRealTime: (fn: () => void | Promise<void>) => void | Promise<void>
  isLoading: boolean
  hasErrors: boolean
}

const PerformanceContext = createContext<PerformanceContextType | null>(null)

interface PerformanceProviderProps {
  children: React.ReactNode
  enableTracking?: boolean
  enableDevelopmentLogging?: boolean
}

export function PerformanceProvider({ 
  children, 
  enableTracking = true,
  enableDevelopmentLogging = process.env.NODE_ENV === 'development'
}: PerformanceProviderProps) {
  const [webVitals, setWebVitals] = useState<PerformanceSummary>(() => 
    performanceMonitor.getSummary()
  )
  const [isLoading, setIsLoading] = useState(true)
  const [hasErrors, setHasErrors] = useState(false)

  const tennisPerf = useTennisPerformance()

  // Track custom metrics
  const trackCustomMetric = useCallback((name: string, value: number, context?: Record<string, any>) => {
    if (!enableTracking) return

    performanceTracker.trackCustomMetric(name, value, context)
    
    if (enableDevelopmentLogging) {
      console.log('📏 Custom Metric:', { name, value, context })
    }
  }, [enableTracking, enableDevelopmentLogging])

  // Initialize performance monitoring
  useEffect(() => {
    if (!enableTracking) {
      setIsLoading(false)
      return
    }

    let mounted = true

    // Subscribe to Web Vitals updates
    const unsubscribe = performanceMonitor.subscribe((summary) => {
      if (!mounted) return
      
      setWebVitals(summary)
      setIsLoading(false)
      
      // Check for performance issues
      const hasIssues = summary.recommendations.length > 0 || summary.overallScore < 75
      setHasErrors(hasIssues)
      
      if (enableDevelopmentLogging && hasIssues) {
        console.group('⚠️ Performance Issues Detected')
        console.log('Overall Score:', summary.overallScore)
        console.log('Recommendations:', summary.recommendations)
        console.groupEnd()
      }
    })

    // Track initial page load
    trackCustomMetric('page-load', performance.now(), {
      url: window.location.pathname,
      referrer: document.referrer,
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [enableTracking, enableDevelopmentLogging, trackCustomMetric])

  // Monitor tennis-specific performance
  useEffect(() => {
    if (!enableTracking || !enableDevelopmentLogging) return

    const interval = setInterval(() => {
      if (!tennisPerf.isPerformanceGood) {
        console.group('🎾 Tennis Performance Warning')
        console.log('Score Latency:', tennisPerf.averageScoreLatency.toFixed(2) + 'ms')
        console.log('Match Update Latency:', tennisPerf.averageMatchUpdateLatency.toFixed(2) + 'ms')
        console.log('Real-time Latency:', tennisPerf.averageRealTimeLatency.toFixed(2) + 'ms')
        console.groupEnd()
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [enableTracking, enableDevelopmentLogging, tennisPerf])

  const contextValue: PerformanceContextType = {
    webVitals,
    tennisMetrics: {
      averageScoreLatency: tennisPerf.averageScoreLatency,
      averageMatchUpdateLatency: tennisPerf.averageMatchUpdateLatency,
      averageRealTimeLatency: tennisPerf.averageRealTimeLatency,
      isPerformanceGood: tennisPerf.isPerformanceGood,
    },
    trackCustomMetric,
    measureScore: tennisPerf.measureScore,
    measureMatchUpdate: tennisPerf.measureMatchUpdate,
    measureRealTime: tennisPerf.measureRealTime,
    isLoading,
    hasErrors,
  }

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
      {enableDevelopmentLogging && <PerformanceDebugger />}
    </PerformanceContext.Provider>
  )
}

export function usePerformance() {
  const context = useContext(PerformanceContext)
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider')
  }
  return context
}

// Development performance debugger
function PerformanceDebugger() {
  const { webVitals, tennisMetrics, hasErrors } = usePerformance()
  const [isVisible, setIsVisible] = useState(false)

  // Toggle debugger with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '16px',
        color: '#fff',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        maxWidth: '300px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, color: hasErrors ? '#ef4444' : '#39ff14' }}>
          📊 Performance Debug
        </h4>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          ×
        </button>
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Overall Score: {webVitals.overallScore}/100</strong>
        <div style={{ 
          width: '100%', 
          height: '4px', 
          background: '#333', 
          borderRadius: '2px', 
          overflow: 'hidden',
          marginTop: '4px'
        }}>
          <div 
            style={{ 
              width: `${webVitals.overallScore}%`, 
              height: '100%', 
              background: webVitals.overallScore > 75 ? '#39ff14' : webVitals.overallScore > 50 ? '#f59e0b' : '#ef4444',
              transition: 'width 0.3s ease'
            }} 
          />
        </div>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div>LCP: {webVitals.lcp?.value.toFixed(0)}ms ({webVitals.lcp?.rating})</div>
        <div>INP: {webVitals.inp?.value.toFixed(0)}ms ({webVitals.inp?.rating})</div>
        <div>CLS: {webVitals.cls?.value.toFixed(3)} ({webVitals.cls?.rating})</div>
        <div>FCP: {webVitals.fcp?.value.toFixed(0)}ms ({webVitals.fcp?.rating})</div>
      </div>

      <div style={{ marginBottom: '8px', borderTop: '1px solid #333', paddingTop: '8px' }}>
        <strong>Tennis Metrics:</strong>
        <div>Score: {tennisMetrics.averageScoreLatency.toFixed(1)}ms</div>
        <div>Match: {tennisMetrics.averageMatchUpdateLatency.toFixed(1)}ms</div>
        <div>Real-time: {tennisMetrics.averageRealTimeLatency.toFixed(1)}ms</div>
      </div>

      {webVitals.recommendations.length > 0 && (
        <div style={{ borderTop: '1px solid #333', paddingTop: '8px' }}>
          <strong>Recommendations:</strong>
          <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
            {webVitals.recommendations.slice(0, 3).map((rec, index) => (
              <li key={index} style={{ marginBottom: '2px', fontSize: '10px' }}>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ fontSize: '10px', color: '#888', marginTop: '8px' }}>
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  )
}

// Higher-order component for performance tracking
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  const WrappedWithPerformance = React.memo((props: P) => {
    const { trackCustomMetric } = usePerformance()
    const renderStart = React.useRef<number>(0)

    React.useLayoutEffect(() => {
      if (renderStart.current) {
        const renderTime = performance.now() - renderStart.current
        trackCustomMetric(`component-render-${componentName}`, renderTime)
        
        if (renderTime > 16) {
          console.warn(`🐌 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`)
        }
      }
    })

    renderStart.current = performance.now()

    return <WrappedComponent {...props} />
  })

  WrappedWithPerformance.displayName = `withPerformanceTracking(${componentName})`
  return WrappedWithPerformance
}