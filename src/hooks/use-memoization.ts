// @ts-nocheck
/**
 * React Hooks for Memoization
 * Provides React integration for advanced memoization utilities
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  getMemoizationMetrics,
  getFunctionCacheStats,
  getMemoizationRecommendations,
  clearMemoizationData,
  useMemoWithMetrics,
  useCallbackWithMetrics,
  useStaleMemo,
  MemoizationMetrics
} from '@/lib/utils/memoization'
// import { useMemoryContext } from '@/components/providers/memory-provider'
import { logger } from '@/lib/utils/logger'

export interface UseMemoizationOptions {
  enablePerformanceMonitoring?: boolean
  enableRecommendations?: boolean
  autoCleanup?: boolean
  reportingInterval?: number
  performanceThreshold?: number
}

export interface MemoizationAnalytics {
  metrics: MemoizationMetrics[]
  cacheStats: {
    totalFunctions: number
    totalCacheEntries: number
    cacheHitRate: number
    averageCacheSize: number
  }
  recommendations: string[]
  healthScore: number
}

/**
 * Hook for memoization analytics and monitoring
 */
export const useMemoizationAnalytics = (options: UseMemoizationOptions = {}): MemoizationAnalytics => {
  const {
    enablePerformanceMonitoring = true,
    enableRecommendations = true,
    reportingInterval = 10000, // 10 seconds
    performanceThreshold = 16 // One frame
  } = options

  const [metrics, setMetrics] = useState<MemoizationMetrics[]>([])
  const [cacheStats, setCacheStats] = useState({
    totalFunctions: 0,
    totalCacheEntries: 0,
    cacheHitRate: 0,
    averageCacheSize: 0
  })
  const [recommendations, setRecommendations] = useState<string[]>([])

  // const { registerCustomCleanup } = useMemoryContext()
  const registerCustomCleanup = (_fn: any, _priority?: any, _type?: any) => {}

  const updateAnalytics = useCallback(() => {
    if (enablePerformanceMonitoring) {
      setMetrics(getMemoizationMetrics())
      setCacheStats(getFunctionCacheStats())
    }
    
    if (enableRecommendations) {
      setRecommendations(getMemoizationRecommendations())
    }
  }, [enablePerformanceMonitoring, enableRecommendations])

  // Calculate health score
  const healthScore = useMemo(() => {
    if (metrics.length === 0) return 100

    let score = 100
    
    // Check memo hit rates
    const lowHitRateComponents = metrics.filter(m => {
      const totalComparisons = m.memoHits + m.memoMisses
      return totalComparisons > 10 && (m.memoHits / totalComparisons) < 0.5
    })
    score -= lowHitRateComponents.length * 10

    // Check render performance
    const slowComponents = metrics.filter(m => m.avgRenderTime > performanceThreshold)
    score -= slowComponents.length * 15

    // Check comparison performance
    const slowComparisonComponents = metrics.filter(m => m.slowComparisons > 5)
    score -= slowComparisonComponents.length * 5

    return Math.max(0, score)
  }, [metrics, performanceThreshold])

  // Periodic analytics updates
  useEffect(() => {
    if (enablePerformanceMonitoring || enableRecommendations) {
      updateAnalytics()
      
      const interval = setInterval(updateAnalytics, reportingInterval)
      
      registerCustomCleanup(() => {
        clearInterval(interval)
      }, 'medium', 'timer')

      return () => {
        // Cleanup handled by memory provider
      }
    }
  }, [enablePerformanceMonitoring, enableRecommendations, reportingInterval, updateAnalytics, registerCustomCleanup])

  // Development warnings
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && enableRecommendations) {
      if (recommendations.length > 0) {
        console.info('🎯 Memoization Recommendations:')
        recommendations.forEach((rec, index) => {
          console.info(`  ${index + 1}. ${rec}`)
        })
      }

      if (healthScore < 70) {
        console.warn('⚠️ Low memoization health score:', `${healthScore}%`)
      }
    }
  }, [recommendations, healthScore, enableRecommendations])

  return {
    metrics,
    cacheStats,
    recommendations,
    healthScore
  }
}

/**
 * Enhanced useMemo with automatic performance monitoring
 */
export const usePerformantMemo = <T>(
  factory: () => T,
  deps: React.DependencyList,
  name?: string
): T => {
  return useMemoWithMetrics(factory, deps, name)
}

/**
 * Enhanced useCallback with automatic performance monitoring
 */
export const usePerformantCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList,
  name?: string
): T => {
  return useCallbackWithMetrics(callback, deps, name)
}

/**
 * Hook for stale-while-revalidate memoization pattern
 */
export const useStaleWhileRevalidate = <T>(
  factory: () => T,
  deps: React.DependencyList,
  options: {
    staleTime?: number
    name?: string
  } = {}
) => {
  return useStaleMemo(factory, deps, options)
}

/**
 * Hook for selective prop memoization
 */
export const useSelectiveMemo = <T extends Record<string, unknown>>(
  obj: T,
  options: {
    ignore?: (keyof T)[]
    deep?: (keyof T)[]
    name?: string
  } = {}
): T => {
  const { ignore = [], name = 'selectiveMemo' } = options

  return useMemoWithMetrics(() => {
    // Create a new object with selective memoization
    const result = {} as T
    
    for (const [key, value] of Object.entries(obj)) {
      if (!ignore.includes(key as keyof T)) {
        result[key as keyof T] = value
      }
    }

    return result
  }, Object.values(obj), name)
}

/**
 * Hook for memoizing expensive calculations
 */
export const useExpensiveCalculation = <T, Args extends unknown[]>(
  calculation: (...args: Args) => T,
  args: Args,
  options: {
    name?: string
    threshold?: number
  } = {}
): T => {
  const { name = 'expensiveCalculation', threshold = 5 } = options

  return useMemoWithMetrics(() => {
    const startTime = performance.now()
    const result = calculation(...args)
    const executionTime = performance.now() - startTime

    if (executionTime > threshold) {
      logger.debug('Expensive calculation detected', {
        name,
        executionTime,
        args: args.length
      })
    }

    return result
  }, args, name)
}

/**
 * Hook for component performance monitoring
 */
export const useComponentPerformance = (componentName: string) => {
  const [renderCount, setRenderCount] = useState(0)
  const [renderTimes, setRenderTimes] = useState<number[]>([])

  useEffect(() => {
    const startTime = performance.now()
    setRenderCount(prev => prev + 1)

    return () => {
      const renderTime = performance.now() - startTime
      setRenderTimes(prev => [...prev.slice(-19), renderTime]) // Keep last 20 render times

      if (renderTime > 16) { // Longer than one frame
        logger.debug('Slow component render detected', {
          componentName,
          renderTime,
          renderCount: renderCount + 1
        })
      }
    }
  }, [componentName, renderCount])

  const avgRenderTime = renderTimes.length > 0 
    ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length 
    : 0

  const performanceInsights = useMemo(() => ({
    renderCount,
    avgRenderTime,
    lastRenderTime: renderTimes[renderTimes.length - 1] || 0,
    slowRenders: renderTimes.filter(time => time > 16).length,
    healthScore: Math.max(0, 100 - (avgRenderTime > 16 ? 30 : 0) - (renderTimes.filter(t => t > 50).length * 10))
  }), [renderCount, avgRenderTime, renderTimes])

  return performanceInsights
}

/**
 * Hook for automatic memoization cleanup
 */
export const useMemoizationCleanup = (options: {
  autoCleanupInterval?: number
  maxCacheSize?: number
} = {}) => {
  const { autoCleanupInterval = 5 * 60 * 1000, maxCacheSize = 1000 } = options // 5 minutes
  // const { registerCustomCleanup } = useMemoryContext()
  const registerCustomCleanup = (_fn: any, _priority?: any, _type?: any) => {}

  const cleanup = useCallback(() => {
    const cacheStats = getFunctionCacheStats()
    
    if (cacheStats.totalCacheEntries > maxCacheSize) {
      logger.info('Performing automatic memoization cleanup', {
        cacheSize: cacheStats.totalCacheEntries,
        maxSize: maxCacheSize
      })
      
      clearMemoizationData()
    }
  }, [maxCacheSize])

  useEffect(() => {
    const interval = setInterval(cleanup, autoCleanupInterval)
    
    registerCustomCleanup(() => {
      clearInterval(interval)
    }, 'low', 'timer')

    return () => {
      // Cleanup handled by memory provider
    }
  }, [autoCleanupInterval, cleanup, registerCustomCleanup])

  return { cleanup }
}

/**
 * Hook for memoization debugging in development
 */
export const useMemoizationDebug = (componentName: string, enabled = process.env.NODE_ENV === 'development') => {
  const analytics = useMemoizationAnalytics({ enablePerformanceMonitoring: enabled })

  useEffect(() => {
    if (!enabled) return

    const componentMetrics = analytics.metrics.find(m => m.componentName === componentName)
    
    if (componentMetrics) {
      console.groupCollapsed(`🎯 Memoization Debug: ${componentName}`)
      console.log('Render Count:', componentMetrics.renderCount)
      console.log('Memo Hits:', componentMetrics.memoHits)
      console.log('Memo Misses:', componentMetrics.memoMisses)
      console.log('Avg Render Time:', `${componentMetrics.avgRenderTime.toFixed(2)}ms`)
      console.log('Slow Comparisons:', componentMetrics.slowComparisons)
      console.log('Last Props Changed:', componentMetrics.propsChanged)
      console.groupEnd()
    }
  }, [enabled, componentName, analytics.metrics])

  return analytics
}

const memoizationHooksExports = {
  useMemoizationAnalytics,
  usePerformantMemo,
  usePerformantCallback,
  useStaleWhileRevalidate,
  useSelectiveMemo,
  useExpensiveCalculation,
  useComponentPerformance,
  useMemoizationCleanup,
  useMemoizationDebug
}

export default memoizationHooksExports