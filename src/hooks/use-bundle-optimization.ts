/**
 * Bundle Optimization Hook
 * Provides comprehensive bundle optimization features for React components
 */

'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
// import { usePathname } from 'next/navigation'
import { 
  dynamicImport,
  preloadCriticalChunks,
  getAllBundleAnalytics,
  webpackChunkUtils,
  monitorChunkPerformance,
  BundleAnalytics
} from '@/lib/utils/bundle-optimization'
import { logger } from '@/lib/utils/logger'

export interface BundleOptimizationState {
  loadedChunks: string[]
  loadingChunks: string[]
  failedChunks: string[]
  bundleSize: number
  analytics: Map<string, BundleAnalytics>
  isPreloading: boolean
  preloadProgress: number
}

export interface BundleOptimizationConfig {
  enablePreloading?: boolean
  enableMonitoring?: boolean
  enableAnalytics?: boolean
  preloadThreshold?: number
  maxConcurrentLoads?: number
}

export const useBundleOptimization = (config: BundleOptimizationConfig = {}) => {
  const {
    enablePreloading = true,
    enableMonitoring = true,
    enableAnalytics = true,
    preloadThreshold = 0.5
  } = config
  
  const [state, setState] = useState<BundleOptimizationState>({
    loadedChunks: [],
    loadingChunks: [],
    failedChunks: [],
    bundleSize: 0,
    analytics: new Map(),
    isPreloading: false,
    preloadProgress: 0
  })

  const loadingQueue = useRef<Map<string, Promise<unknown>>>(new Map())
  const performanceObserver = useRef<PerformanceObserver | null>(null)
  const intersectionObserver = useRef<IntersectionObserver | null>(null)

  // Initialize bundle monitoring
  useEffect(() => {
    if (!enableMonitoring) return

    const updateBundleState = () => {
      const loadedChunks = webpackChunkUtils.getLoadedChunks()
      const bundleSize = webpackChunkUtils.estimateBundleSize()
      const analytics = getAllBundleAnalytics()

      setState(prev => ({
        ...prev,
        loadedChunks,
        bundleSize,
        analytics
      }))
    }

    updateBundleState()

    // Performance monitoring
    if (typeof window !== 'undefined' && window.PerformanceObserver) {
      performanceObserver.current = new PerformanceObserver((list) => {
        if (!enableAnalytics) return

        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'resource' && entry.name.includes('_next/static')) {
            logger.debug('Bundle resource loaded:', {
              name: entry.name,
              duration: entry.duration,
              size: (entry as PerformanceResourceTiming).transferSize || 0
            })
          }
        })
      })

      performanceObserver.current.observe({
        entryTypes: ['resource', 'navigation']
      })
    }

    // Update state periodically
    const interval = setInterval(updateBundleState, 2000)

    return () => {
      clearInterval(interval)
      performanceObserver.current?.disconnect()
    }
  }, [enableMonitoring, enableAnalytics])

  // Preload critical chunks for route
  const preloadChunks = useCallback(async (route: string) => {
    if (!enablePreloading || state.isPreloading) return

    setState(prev => ({ ...prev, isPreloading: true, preloadProgress: 0 }))

    try {
      await preloadCriticalChunks(route)
      setState(prev => ({ ...prev, preloadProgress: 100 }))
      logger.debug(`Preloaded chunks for route: ${route}`)
    } catch (error) {
      logger.error(`Failed to preload chunks for route ${route}:`, error)
    } finally {
      setState(prev => ({ ...prev, isPreloading: false }))
    }
  }, [enablePreloading, state.isPreloading])

  // Load chunk dynamically
  const loadChunk = useCallback(async <T>(
    importFn: () => Promise<T>,
    chunkName: string,
    options: {
      priority?: 'high' | 'normal' | 'low'
      preload?: boolean
      timeout?: number
    } = {}
  ): Promise<T> => {
    const { priority = 'normal', preload = false, timeout = 10000 } = options

    // Check if already loading
    if (loadingQueue.current.has(chunkName)) {
      return loadingQueue.current.get(chunkName)! as T
    }

    setState(prev => ({
      ...prev,
      loadingChunks: [...prev.loadingChunks, chunkName]
    }))

    const loadPromise = Promise.race([
      dynamicImport(importFn, chunkName, {
        priority,
        preload
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Chunk ${chunkName} load timeout`)), timeout)
      )
    ])

    loadingQueue.current.set(chunkName, loadPromise)

    try {
      const result = await loadPromise
      
      setState(prev => ({
        ...prev,
        loadingChunks: prev.loadingChunks.filter(c => c !== chunkName),
        loadedChunks: [...prev.loadedChunks, chunkName]
      }))

      if (enableMonitoring) {
        monitorChunkPerformance(chunkName)
      }

      return result
    } catch (error) {
      setState(prev => ({
        ...prev,
        loadingChunks: prev.loadingChunks.filter(c => c !== chunkName),
        failedChunks: [...prev.failedChunks, chunkName]
      }))

      logger.error(`Failed to load chunk ${chunkName}:`, error)
      throw error
    } finally {
      loadingQueue.current.delete(chunkName)
    }
  }, [enableMonitoring])

  // Preload chunks on intersection
  const preloadOnIntersection = useCallback((
    element: Element,
    chunkNames: string[]
  ) => {
    if (!enablePreloading || !intersectionObserver.current) {
      intersectionObserver.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const chunks = (entry.target as HTMLElement).dataset.chunks?.split(',') || []
              chunks.forEach((chunk: string) => {
                if (!state.loadedChunks.includes(chunk)) {
                  loadChunk(
                    () => Promise.resolve({}),
                    chunk,
                    { priority: 'low', preload: true }
                  ).catch(() => {
                    // Ignore preload errors
                  })
                }
              })
            }
          })
        },
        { threshold: preloadThreshold }
      )
    }

    element.setAttribute('data-chunks', chunkNames.join(','))
    intersectionObserver.current.observe(element)
  }, [enablePreloading, loadChunk, preloadThreshold, state.loadedChunks])

  // Get chunk analytics
  const getChunkAnalytics = useCallback((chunkName: string) => {
    return state.analytics.get(chunkName) || null
  }, [state.analytics])

  // Get bundle health score
  const getBundleHealthScore = useCallback(() => {
    const analytics = Array.from(state.analytics.values())
    if (analytics.length === 0) return 100

    let score = 100
    
    analytics.forEach(chunk => {
      if (chunk.loadTime > 1000) score -= 10
      if (chunk.loadTime > 3000) score -= 20
      if (chunk.chunkSize > 500000) score -= 10
      if (chunk.chunkSize > 1000000) score -= 20
      score -= chunk.errors.length * 5
      if (chunk.cacheHit) score += 5
    })

    return Math.max(0, Math.min(100, score))
  }, [state.analytics])

  // Get optimization suggestions
  const getOptimizationSuggestions = useCallback(() => {
    const suggestions: string[] = []
    const analytics = Array.from(state.analytics.values())

    if (state.bundleSize > 1000000) {
      suggestions.push('Bundle size is large (>1MB). Consider implementing more code splitting.')
    }

    if (state.failedChunks.length > 0) {
      suggestions.push(`${state.failedChunks.length} chunks failed to load. Check network connectivity.`)
    }

    const slowChunks = analytics.filter(chunk => chunk.loadTime > 2000)
    if (slowChunks.length > 0) {
      suggestions.push(`${slowChunks.length} chunks are loading slowly. Consider preloading critical chunks.`)
    }

    const largeChunks = analytics.filter(chunk => chunk.chunkSize > 500000)
    if (largeChunks.length > 0) {
      suggestions.push(`${largeChunks.length} chunks are large (>500KB). Consider splitting them further.`)
    }

    const cacheHitRate = analytics.length > 0 
      ? analytics.filter(chunk => chunk.cacheHit).length / analytics.length 
      : 0

    if (cacheHitRate < 0.5) {
      suggestions.push('Low cache hit rate. Consider implementing better caching strategies.')
    }

    return suggestions
  }, [state.bundleSize, state.failedChunks, state.analytics])

  // Clear failed chunks
  const clearFailedChunks = useCallback(() => {
    setState(prev => ({ ...prev, failedChunks: [] }))
  }, [])

  // Retry failed chunks
  const retryFailedChunks = useCallback(async () => {
    const failed = [...state.failedChunks]
    clearFailedChunks()

    for (const chunkName of failed) {
      try {
        await loadChunk(
          () => Promise.resolve({}),
          chunkName,
          { priority: 'high' }
        )
      } catch (error) {
        logger.error(`Failed to retry chunk ${chunkName}:`, error)
      }
    }
  }, [state.failedChunks, clearFailedChunks, loadChunk])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intersectionObserver.current?.disconnect()
      performanceObserver.current?.disconnect()
    }
  }, [])

  return useMemo(() => {
    const bundleHealthScore = getBundleHealthScore()
    const optimizationSuggestions = getOptimizationSuggestions()
    
    return {
      // State
      ...state,
      
      // Methods
      loadChunk,
      preloadChunks,
      preloadOnIntersection,
      getChunkAnalytics,
      getBundleHealthScore,
      getOptimizationSuggestions,
      clearFailedChunks,
      retryFailedChunks,
      
      // Computed values
      bundleHealthScore,
      optimizationSuggestions,
      totalChunks: state.loadedChunks.length + state.loadingChunks.length + state.failedChunks.length,
      
      // Status
      isHealthy: bundleHealthScore > 80,
      hasFailures: state.failedChunks.length > 0,
      isLoading: state.loadingChunks.length > 0 || state.isPreloading
    }
  }, [
    state,
    loadChunk,
    preloadChunks,
    preloadOnIntersection,
    getChunkAnalytics,
    getBundleHealthScore,
    getOptimizationSuggestions,
    clearFailedChunks,
    retryFailedChunks
  ])
}

export default useBundleOptimization