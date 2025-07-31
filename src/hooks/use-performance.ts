/**
 * Performance monitoring hooks for React components
 * Provides real-time performance data and optimization recommendations
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { performanceMonitor, PerformanceSummary, measureInteractionLatency } from '@/lib/performance/web-vitals'

export interface ComponentPerformance {
  renderCount: number
  averageRenderTime: number
  slowRenders: number
  lastRenderTime: number
}

export interface InteractionPerformance {
  count: number
  averageLatency: number
  slowInteractions: number
  lastInteractionTime: number
}

/**
 * Hook to monitor Web Vitals in real-time
 */
export function useWebVitals() {
  const [summary, setSummary] = useState<PerformanceSummary>(() => 
    performanceMonitor.getSummary()
  )

  useEffect(() => {
    return performanceMonitor.subscribe(setSummary)
  }, [])

  return summary
}

/**
 * Hook to measure component render performance
 */
export function useRenderPerformance(componentName: string): ComponentPerformance {
  const [componentPerf, setComponentPerf] = useState<ComponentPerformance>({
    renderCount: 0,
    averageRenderTime: 0,
    slowRenders: 0,
    lastRenderTime: 0,
  })
  
  const renderTimes = useRef<number[]>([])
  const renderStart = useRef<number>(0)

  useEffect(() => {
    renderStart.current = performance.now()
  })

  useEffect(() => {
    if (renderStart.current) {
      const renderTime = performance.now() - renderStart.current
      renderTimes.current.push(renderTime)
      
      const isSlowRender = renderTime > 16 // More than 1 frame at 60fps
      
      setComponentPerf(prev => ({
        renderCount: prev.renderCount + 1,
        averageRenderTime: renderTimes.current.reduce((sum, time) => sum + time, 0) / renderTimes.current.length,
        slowRenders: prev.slowRenders + (isSlowRender ? 1 : 0),
        lastRenderTime: renderTime,
      }))

      if (isSlowRender && process.env.NODE_ENV === 'development') {
        console.warn(`🐌 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`)
      }
    }
  })

  return componentPerf
}

/**
 * Hook to measure user interaction latency
 */
export function useInteractionPerformance() {
  const [interactionPerf, setInteractionPerf] = useState<InteractionPerformance>({
    count: 0,
    averageLatency: 0,
    slowInteractions: 0,
    lastInteractionTime: 0,
  })
  
  const latencies = useRef<number[]>([])

  const measureInteraction = useCallback((name: string, fn: () => void | Promise<void>) => {
    return measureInteractionLatency(name, () => {
      const start = performance.now()
      
      const measure = () => {
        const latency = performance.now() - start
        latencies.current.push(latency)
        
        const isSlowInteraction = latency > 100
        
        setInteractionPerf(prev => ({
          count: prev.count + 1,
          averageLatency: latencies.current.reduce((sum, time) => sum + time, 0) / latencies.current.length,
          slowInteractions: prev.slowInteractions + (isSlowInteraction ? 1 : 0),
          lastInteractionTime: latency,
        }))
      }

      const result = fn()
      
      if (result instanceof Promise) {
        return result.finally(measure)
      } else {
        measure()
        return result
      }
    })
  }, [])

  return { performance: interactionPerf, measureInteraction }
}

/**
 * Hook to monitor tennis-specific performance metrics
 */
export function useTennisPerformance() {
  const [scoreLatency, setScoreLatency] = useState<number[]>([])
  const [matchUpdateLatency, setMatchUpdateLatency] = useState<number[]>([])
  const [realTimeLatency, setRealTimeLatency] = useState<number[]>([])

  const measureScore = useCallback((fn: () => void | Promise<void>) => {
    const start = performance.now()
    
    const measure = () => {
      const latency = performance.now() - start
      setScoreLatency(prev => [...prev.slice(-9), latency]) // Keep last 10 measurements
      
      if (latency > 50) {
        console.warn(`🎾 Slow scoring: ${latency.toFixed(2)}ms`)
      }
    }

    const result = fn()
    
    if (result instanceof Promise) {
      return result.finally(measure)
    } else {
      measure()
      return result
    }
  }, [])

  const measureMatchUpdate = useCallback((fn: () => void | Promise<void>) => {
    const start = performance.now()
    
    const measure = () => {
      const latency = performance.now() - start
      setMatchUpdateLatency(prev => [...prev.slice(-9), latency])
      
      if (latency > 100) {
        console.warn(`🎯 Slow match update: ${latency.toFixed(2)}ms`)
      }
    }

    const result = fn()
    
    if (result instanceof Promise) {
      return result.finally(measure)
    } else {
      measure()
      return result
    }
  }, [])

  const measureRealTime = useCallback((fn: () => void | Promise<void>) => {
    const start = performance.now()
    
    const measure = () => {
      const latency = performance.now() - start
      setRealTimeLatency(prev => [...prev.slice(-9), latency])
      
      if (latency > 200) {
        console.warn(`📡 Slow real-time update: ${latency.toFixed(2)}ms`)
      }
    }

    const result = fn()
    
    if (result instanceof Promise) {
      return result.finally(measure)
    } else {
      measure()
      return result
    }
  }, [])

  const averageScoreLatency = scoreLatency.length > 0 
    ? scoreLatency.reduce((sum, l) => sum + l, 0) / scoreLatency.length 
    : 0

  const averageMatchUpdateLatency = matchUpdateLatency.length > 0
    ? matchUpdateLatency.reduce((sum, l) => sum + l, 0) / matchUpdateLatency.length
    : 0

  const averageRealTimeLatency = realTimeLatency.length > 0
    ? realTimeLatency.reduce((sum, l) => sum + l, 0) / realTimeLatency.length
    : 0

  return {
    averageScoreLatency,
    averageMatchUpdateLatency, 
    averageRealTimeLatency,
    measureScore,
    measureMatchUpdate,
    measureRealTime,
    isPerformanceGood: averageScoreLatency < 50 && averageMatchUpdateLatency < 100 && averageRealTimeLatency < 200,
  }
}

/**
 * Hook for performance debugging in development
 */
export function usePerformanceDebug(enabled = process.env.NODE_ENV === 'development') {
  const webVitals = useWebVitals()
  
  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      console.group('📊 Performance Debug')
      console.log('Web Vitals Score:', webVitals.overallScore)
      console.log('LCP:', webVitals.lcp?.value, 'ms -', webVitals.lcp?.rating)
      console.log('FCP:', webVitals.fcp?.value, 'ms -', webVitals.fcp?.rating) 
      console.log('CLS:', webVitals.cls?.value, '-', webVitals.cls?.rating)
      console.log('INP:', webVitals.inp?.value, 'ms -', webVitals.inp?.rating)
      
      if (webVitals.recommendations.length > 0) {
        console.log('Recommendations:', webVitals.recommendations)
      }
      
      console.groupEnd()
    }, 10000) // Every 10 seconds

    return () => clearInterval(interval)
  }, [enabled, webVitals])

  return webVitals
}