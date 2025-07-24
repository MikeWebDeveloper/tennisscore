/**
 * Advanced Memoization Utilities
 * Provides comprehensive memoization strategies for React components and functions:
 * - Smart component memoization
 * - Selective prop comparison
 * - Deep equality checks
 * - Performance monitoring
 * - Cache management
 */

import React, { memo, useMemo, useCallback, useRef, useState, DependencyList } from 'react'
import { logger } from './logger'

export interface MemoizationConfig {
  enablePerformanceMonitoring?: boolean
  enableDeepComparison?: boolean
  cacheSize?: number
  logSlowComparisons?: boolean
  comparisonThreshold?: number
}

export interface MemoizationMetrics {
  componentName: string
  renderCount: number
  memoHits: number
  memoMisses: number
  avgRenderTime: number
  slowComparisons: number
  lastRenderTime: number
  propsChanged: string[]
}

// Global memoization tracking
const memoizationMetrics = new Map<string, MemoizationMetrics>()
const functionCache = new Map<string, Map<string, any>>()

/**
 * Deep equality comparison with performance monitoring
 */
export const deepEqual = (a: unknown, b: unknown, path: string = '', depth: number = 0): boolean => {
  const startTime = performance.now()
  const maxDepth = 10 // Prevent infinite recursion

  if (depth > maxDepth) {
    logger.warn('Deep comparison exceeded max depth', { path, depth })
    return a === b
  }

  // Handle primitives and null/undefined
  if (a === b) return true
  if (a == null || b == null) return a === b
  if (typeof a !== typeof b) return false

  // Handle arrays
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false
    return a.every((item, index) => 
      deepEqual(item, b[index], `${path}[${index}]`, depth + 1)
    )
  }

  // Handle objects
  if (typeof a === 'object') {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    
    if (keysA.length !== keysB.length) return false
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false
      if (!deepEqual(a[key], b[key], `${path}.${key}`, depth + 1)) return false
    }
    
    return true
  }

  const executionTime = performance.now() - startTime
  if (executionTime > 5) { // Log slow comparisons
    logger.debug('Slow deep comparison detected', {
      path,
      executionTime,
      depth
    })
  }

  return false
}

/**
 * Shallow equality comparison for props
 */
export const shallowEqual = (objA: unknown, objB: unknown): boolean => {
  if (objA === objB) return true
  
  if (objA == null || objB == null) return objA === objB
  
  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)
  
  if (keysA.length !== keysB.length) return false
  
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key)) return false
    if ((objA as any)[key] !== (objB as any)[key]) return false
  }
  
  return true
}

/**
 * Selective prop comparison - ignore specific props or use custom comparators
 */
export const createSelectiveComparator = (options: {
  ignore?: string[]
  deep?: string[]
  custom?: Record<string, (a: any, b: any) => boolean>
} = {}) => {
  const { ignore = [], deep = [], custom = {} } = options
  
  return (prevProps: any, nextProps: any): boolean => {
    const prevKeys = Object.keys(prevProps).filter(key => !ignore.includes(key))
    const nextKeys = Object.keys(nextProps).filter(key => !ignore.includes(key))
    
    if (prevKeys.length !== nextKeys.length) return false
    
    for (const key of prevKeys) {
      const prevValue = prevProps[key]
      const nextValue = nextProps[key]
      
      // Use custom comparator if provided
      if (custom[key]) {
        if (!custom[key](prevValue, nextValue)) return false
        continue
      }
      
      // Use deep comparison for specified props
      if (deep.includes(key)) {
        if (!deepEqual(prevValue, nextValue)) return false
        continue
      }
      
      // Default shallow comparison
      if (prevValue !== nextValue) return false
    }
    
    return true
  }
}

/**
 * Enhanced memo with performance monitoring
 */
export const memoWithMetrics = <P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean,
  config: MemoizationConfig & { componentName?: string } = {}
): React.MemoExoticComponent<React.ComponentType<P>> => {
  const {
    enablePerformanceMonitoring = true,
    componentName = Component.displayName || Component.name || 'Anonymous',
    logSlowComparisons = true,
    comparisonThreshold = 1
  } = config

  // Initialize metrics
  if (!memoizationMetrics.has(componentName)) {
    memoizationMetrics.set(componentName, {
      componentName,
      renderCount: 0,
      memoHits: 0,
      memoMisses: 0,
      avgRenderTime: 0,
      slowComparisons: 0,
      lastRenderTime: 0,
      propsChanged: []
    })
  }

  const enhancedPropsComparator = (prevProps: P, nextProps: P): boolean => {
    const startTime = performance.now()
    const metrics = memoizationMetrics.get(componentName)!
    
    let areEqual = true
    const changedProps: string[] = []

    if (propsAreEqual) {
      areEqual = propsAreEqual(prevProps, nextProps)
    } else {
      // Default shallow comparison with change tracking
      const prevKeys = Object.keys(prevProps) as (keyof P)[]
      const nextKeys = Object.keys(nextProps) as (keyof P)[]
      
      if (prevKeys.length !== nextKeys.length) {
        areEqual = false
      } else {
        for (const key of prevKeys) {
          if (prevProps[key] !== nextProps[key]) {
            areEqual = false
            changedProps.push(String(key))
          }
        }
      }
    }

    const comparisonTime = performance.now() - startTime
    
    // Update metrics
    if (enablePerformanceMonitoring) {
      if (areEqual) {
        metrics.memoHits++
      } else {
        metrics.memoMisses++
        metrics.propsChanged = changedProps
      }
      
      if (comparisonTime > comparisonThreshold) {
        metrics.slowComparisons++
        if (logSlowComparisons) {
          logger.debug('Slow memo comparison', {
            componentName,
            comparisonTime,
            changedProps,
            areEqual
          })
        }
      }
    }

    return areEqual
  }

  const MemoizedComponent = memo(Component, enhancedPropsComparator)

  // Temporarily simplified to fix the "MemoizedComponent is not a function" error
  MemoizedComponent.displayName = `MemoWithMetrics(${componentName})`
  return MemoizedComponent
}

/**
 * Enhanced useMemo with performance monitoring
 */
export const useMemoWithMetrics = <T>(
  factory: () => T,
  deps: DependencyList | undefined,
  name?: string
): T => {
  const computationName = name || 'anonymous'
  const previousDeps = useRef<DependencyList | undefined>(deps)
  const computationCount = useRef(0)
  const totalComputationTime = useRef(0)

  return useMemo(() => {
    const startTime = performance.now()
    const result = factory()
    const computationTime = performance.now() - startTime
    
    computationCount.current++
    totalComputationTime.current += computationTime
    
    // Log slow computations
    if (computationTime > 5) {
      logger.debug('Slow useMemo computation', {
        name: computationName,
        computationTime,
        computationCount: computationCount.current,
        avgComputationTime: totalComputationTime.current / computationCount.current,
        depsChanged: !shallowEqual(previousDeps.current, deps)
      })
    }
    
    previousDeps.current = deps
    return result
  }, deps)
}

/**
 * Enhanced useCallback with performance monitoring
 */
export const useCallbackWithMetrics = <T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList,
  name?: string
): T => {
  const callbackName = name || 'anonymous'
  const callCount = useRef(0)
  const recreationCount = useRef(0)
  const previousDeps = useRef<DependencyList>(deps)

  return useCallback((...args: Parameters<T>) => {
    callCount.current++
    const startTime = performance.now()
    const result = callback(...args)
    const executionTime = performance.now() - startTime
    
    // Log slow callbacks
    if (executionTime > 5) {
      logger.debug('Slow callback execution', {
        name: callbackName,
        executionTime,
        callCount: callCount.current,
        recreationCount: recreationCount.current
      })
    }
    
    return result
  }, deps) as T
}

/**
 * Function memoization with LRU cache
 */
export const memoizeFunction = <Args extends any[], Return>(
  fn: (...args: Args) => Return,
  options: {
    keyGenerator?: (...args: Args) => string
    maxCacheSize?: number
    ttl?: number
  } = {}
): (...args: Args) => Return => {
  const {
    keyGenerator = (...args) => JSON.stringify(args),
    maxCacheSize = 100,
    ttl
  } = options

  const fnName = fn.name || 'anonymous'
  
  if (!functionCache.has(fnName)) {
    functionCache.set(fnName, new Map())
  }
  
  const cache = functionCache.get(fnName)!

  return (...args: Args): Return => {
    const key = keyGenerator(...args)
    
    // Check cache
    const cached = cache.get(key)
    if (cached) {
      const { value, timestamp } = cached
      
      // Check TTL
      if (!ttl || Date.now() - timestamp < ttl) {
        return value
      } else {
        cache.delete(key)
      }
    }

    // Compute value
    const startTime = performance.now()
    const value = fn(...args)
    const computationTime = performance.now() - startTime
    
    // Cache result
    cache.set(key, {
      value,
      timestamp: Date.now()
    })

    // Cleanup cache if too large
    if (cache.size > maxCacheSize) {
      const entries = Array.from(cache.entries())
      const toDelete = entries.slice(0, Math.floor(maxCacheSize * 0.2))
      toDelete.forEach(([k]) => cache.delete(k))
    }

    // Log slow computations
    if (computationTime > 10) {
      logger.debug('Slow function computation', {
        functionName: fnName,
        computationTime,
        cacheSize: cache.size,
        args: key
      })
    }

    return value
  }
}

/**
 * React Query-style stale-while-revalidate memoization
 */
export const useStaleMemo = <T>(
  factory: () => T,
  deps: DependencyList,
  options: {
    staleTime?: number
    name?: string
  } = {}
): { data: T; isStale: boolean; revalidate: () => void } => {
  const { staleTime = 5000, name = 'anonymous' } = options
  
  const valueRef = useRef<T | undefined>(undefined)
  const timestampRef = useRef<number>(0)
  const depsRef = useRef<DependencyList>(deps)
  const [, forceRender] = useState({})

  const isStale = useMemo(() => {
    const now = Date.now()
    const depsChanged = !shallowEqual(depsRef.current, deps)
    const timeStale = now - timestampRef.current > staleTime
    
    return depsChanged || timeStale || valueRef.current === undefined
  }, [deps, staleTime])

  const revalidate = useCallback(() => {
    const startTime = performance.now()
    valueRef.current = factory()
    timestampRef.current = Date.now()
    depsRef.current = deps
    
    const computationTime = performance.now() - startTime
    if (computationTime > 5) {
      logger.debug('Slow stale memo revalidation', {
        name,
        computationTime
      })
    }
    
    forceRender({})
  }, [factory, deps, name])

  // Initial computation or revalidation
  if (isStale) {
    revalidate()
  }

  return {
    data: valueRef.current!,
    isStale,
    revalidate
  }
}

/**
 * Get memoization metrics for performance analysis
 */
export const getMemoizationMetrics = (): MemoizationMetrics[] => {
  return Array.from(memoizationMetrics.values())
}

/**
 * Get function cache statistics
 */
export const getFunctionCacheStats = (): {
  totalFunctions: number
  totalCacheEntries: number
  cacheHitRate: number
  averageCacheSize: number
} => {
  const functions = Array.from(functionCache.values())
  const totalFunctions = functions.length
  const totalCacheEntries = functions.reduce((sum, cache) => sum + cache.size, 0)
  const averageCacheSize = totalFunctions > 0 ? totalCacheEntries / totalFunctions : 0

  return {
    totalFunctions,
    totalCacheEntries,
    cacheHitRate: 0, // Would need to track this separately
    averageCacheSize
  }
}

/**
 * Clear all memoization data
 */
export const clearMemoizationData = (): void => {
  memoizationMetrics.clear()
  functionCache.clear()
}

/**
 * Get performance recommendations based on metrics
 */
export const getMemoizationRecommendations = (): string[] => {
  const recommendations: string[] = []
  const metrics = getMemoizationMetrics()

  // Check for components with low memo hit rates
  const lowHitRateComponents = metrics.filter(m => {
    const totalComparisons = m.memoHits + m.memoMisses
    return totalComparisons > 10 && (m.memoHits / totalComparisons) < 0.5
  })

  if (lowHitRateComponents.length > 0) {
    recommendations.push(`${lowHitRateComponents.length} components have low memo hit rates. Consider reviewing prop dependencies.`)
  }

  // Check for slow rendering components
  const slowComponents = metrics.filter(m => m.avgRenderTime > 16)
  if (slowComponents.length > 0) {
    recommendations.push(`${slowComponents.length} components have slow render times. Consider optimization.`)
  }

  // Check for components with many slow comparisons
  const slowComparisonComponents = metrics.filter(m => m.slowComparisons > 5)
  if (slowComparisonComponents.length > 0) {
    recommendations.push(`${slowComparisonComponents.length} components have slow prop comparisons. Consider shallow comparison or selective memoization.`)
  }

  // Check function cache efficiency
  const cacheStats = getFunctionCacheStats()
  if (cacheStats.averageCacheSize > 50) {
    recommendations.push('Function caches are growing large. Consider implementing TTL or reducing cache size.')
  }

  return recommendations
}

const memoizationDefault = {
  memoWithMetrics,
  useMemoWithMetrics,
  useCallbackWithMetrics,
  memoizeFunction,
  useStaleMemo,
  deepEqual,
  shallowEqual,
  createSelectiveComparator,
  getMemoizationMetrics,
  getFunctionCacheStats,
  getMemoizationRecommendations,
  clearMemoizationData
}

export default memoizationDefault