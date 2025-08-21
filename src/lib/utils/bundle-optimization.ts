/**
 * Bundle Optimization Utilities
 * Provides comprehensive bundle size optimization features including:
 * - Dynamic imports for code splitting
 * - Lazy loading for heavy components
 * - Bundle analysis utilities
 * - Tree shaking optimization
 * - Chunk splitting strategies
 */

import { logger } from './logger'

export interface BundleAnalytics {
  chunkSize: number
  loadTime: number
  cacheHit: boolean
  dependencies: string[]
  errors: string[]
}

export interface LazyLoadConfig {
  threshold?: number
  rootMargin?: string
  retryCount?: number
  retryDelay?: number
  enablePreload?: boolean
  enableErrorBoundary?: boolean
}

export interface ChunkLoadingConfig {
  maxConcurrent?: number
  priority?: 'high' | 'normal' | 'low'
  preload?: boolean
  prefetch?: boolean
}

// Global bundle analytics
const bundleAnalytics: Map<string, BundleAnalytics> = new Map()
const loadingChunks: Map<string, Promise<unknown>> = new Map()

/**
 * Enhanced dynamic import with error handling and retry logic
 */
export const dynamicImport = async <T = unknown>(
  importFn: () => Promise<T>,
  chunkName: string,
  config: ChunkLoadingConfig = {}
): Promise<T> => {
  const {
    preload = false,
    prefetch = false
  } = config

  const startTime = performance.now()
  
  try {
    // Check if chunk is already loading
    if (loadingChunks.has(chunkName)) {
      logger.debug(`Chunk ${chunkName} already loading, waiting...`)
      return await loadingChunks.get(chunkName)! as Promise<T>
    }

    // Create loading promise
    const loadingPromise = importFn()
    loadingChunks.set(chunkName, loadingPromise)

    // Add priority hints
    if (preload && typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'script'
      link.href = `/_next/static/chunks/${chunkName}.js`
      document.head.appendChild(link)
    }

    if (prefetch && typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = `/_next/static/chunks/${chunkName}.js`
      document.head.appendChild(link)
    }

    const result = await loadingPromise
    const loadTime = performance.now() - startTime

    // Record analytics
    bundleAnalytics.set(chunkName, {
      chunkSize: 0, // Would need webpack plugin to get actual size
      loadTime,
      cacheHit: loadTime < 50, // Assume cache hit if very fast
      dependencies: [],
      errors: []
    })

    logger.debug(`Chunk ${chunkName} loaded in ${loadTime.toFixed(2)}ms`)
    
    // Clean up loading promise
    loadingChunks.delete(chunkName)
    
    return result
  } catch (error) {
    logger.error(`Failed to load chunk ${chunkName}:`, error)
    
    // Record error analytics
    const existing = bundleAnalytics.get(chunkName) || {
      chunkSize: 0,
      loadTime: performance.now() - startTime,
      cacheHit: false,
      dependencies: [],
      errors: []
    }
    
    existing.errors.push(error instanceof Error ? error.message : 'Unknown error')
    bundleAnalytics.set(chunkName, existing)
    
    loadingChunks.delete(chunkName)
    throw error
  }
}

/**
 * Lazy load component with suspense and error boundary
 */
export const lazyLoadComponent = <T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  chunkName: string,
  config: LazyLoadConfig = {}
): React.LazyExoticComponent<T> => {
  const {
    retryCount = 3,
    retryDelay = 1000
  } = config

  return React.lazy(async () => {
    let lastError: Error | null = null
    
    for (let i = 0; i <= retryCount; i++) {
      try {
        const loadedModule = await dynamicImport(importFn, chunkName, {
          priority: 'high',
          preload: true
        })
        
        return loadedModule
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (i < retryCount) {
          logger.warn(`Chunk ${chunkName} failed to load, retrying ${i + 1}/${retryCount}...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, i)))
        }
      }
    }
    
    throw lastError || new Error(`Failed to load chunk ${chunkName} after ${retryCount} retries`)
  })
}

/**
 * Pre-load critical chunks based on route
 */
export const preloadCriticalChunks = async (route: string): Promise<void> => {
  const criticalChunks = getCriticalChunksForRoute(route)
  
  const preloadPromises = criticalChunks.map(async (chunk) => {
    try {
      if (typeof window !== 'undefined') {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'script'
        link.href = `/_next/static/chunks/${chunk}.js`
        document.head.appendChild(link)
      }
    } catch (error) {
      logger.error(`Failed to preload chunk ${chunk}:`, error)
    }
  })
  
  await Promise.allSettled(preloadPromises)
  logger.debug(`Preloaded ${criticalChunks.length} critical chunks for route: ${route}`)
}

/**
 * Get critical chunks for a specific route
 */
const getCriticalChunksForRoute = (route: string): string[] => {
  const routeChunkMap: Record<string, string[]> = {
    '/dashboard': ['dashboard', 'charts', 'statistics'],
    '/matches': ['matches', 'scoring', 'realtime'],
    '/players': ['players', 'forms', 'validation'],
    '/admin': ['admin', 'tables', 'data-management']
  }
  
  return routeChunkMap[route] || []
}

/**
 * Tree shaking helper for conditional imports
 */
export const conditionalImport = async <T>(
  condition: boolean,
  importFn: () => Promise<T>,
  chunkName: string
): Promise<T | null> => {
  if (!condition) {
    return null
  }
  
  return await dynamicImport(importFn, chunkName)
}

/**
 * Bundle size analyzer for development
 */
export const analyzeBundleSize = (chunkName: string): BundleAnalytics | null => {
  return bundleAnalytics.get(chunkName) || null
}

/**
 * Get all bundle analytics
 */
export const getAllBundleAnalytics = (): Map<string, BundleAnalytics> => {
  return new Map(bundleAnalytics)
}

/**
 * Clear bundle analytics
 */
export const clearBundleAnalytics = (): void => {
  bundleAnalytics.clear()
  loadingChunks.clear()
}

/**
 * Progressive loading utility for large datasets
 */
export class ProgressiveLoader<T> {
  private items: T[] = []
  private batchSize: number
  private currentBatch: number = 0
  private isLoading: boolean = false
  private loadingPromise: Promise<T[]> | null = null
  
  constructor(
    private loadFn: (offset: number, limit: number) => Promise<T[]>,
    batchSize: number = 20
  ) {
    this.batchSize = batchSize
  }
  
  async loadNext(): Promise<T[]> {
    if (this.isLoading) {
      return this.loadingPromise || []
    }
    
    this.isLoading = true
    this.loadingPromise = this.loadBatch()
    
    try {
      const newItems = await this.loadingPromise
      this.items.push(...newItems)
      this.currentBatch++
      return newItems
    } finally {
      this.isLoading = false
      this.loadingPromise = null
    }
  }
  
  private async loadBatch(): Promise<T[]> {
    const offset = this.currentBatch * this.batchSize
    return await this.loadFn(offset, this.batchSize)
  }
  
  getItems(): T[] {
    return [...this.items]
  }
  
  hasMore(): boolean {
    return !this.isLoading && this.items.length % this.batchSize === 0
  }
  
  reset(): void {
    this.items = []
    this.currentBatch = 0
    this.isLoading = false
    this.loadingPromise = null
  }
}

/**
 * Webpack chunk loading utilities
 */
export const webpackChunkUtils = {
  /**
   * Check if chunk is already loaded
   */
  isChunkLoaded: (chunkName: string): boolean => {
    if (typeof window === 'undefined') return false
    
    // Check if chunk is in webpack runtime
    const webpackChunk = (window as { __webpack_require__?: { cache?: Record<string, unknown> } }).__webpack_require__
    if (webpackChunk && webpackChunk.cache) {
      return Object.keys(webpackChunk.cache).some(key => 
        key.includes(chunkName)
      )
    }
    
    return false
  },
  
  /**
   * Get loaded chunk names
   */
  getLoadedChunks: (): string[] => {
    if (typeof window === 'undefined') return []
    
    const webpackChunk = (window as { __webpack_require__?: { cache?: Record<string, unknown> } }).__webpack_require__
    if (webpackChunk && webpackChunk.cache) {
      return Object.keys(webpackChunk.cache)
    }
    
    return []
  },
  
  /**
   * Estimate bundle size from script tags
   */
  estimateBundleSize: (): number => {
    if (typeof window === 'undefined') return 0
    
    const scripts = document.querySelectorAll('script[src*="_next/static"]')
    let totalSize = 0
    
    scripts.forEach(script => {
      const src = script.getAttribute('src')
      if (src) {
        // Estimate based on typical chunk sizes
        if (src.includes('framework')) totalSize += 150000 // ~150KB
        else if (src.includes('main')) totalSize += 50000   // ~50KB
        else if (src.includes('polyfills')) totalSize += 30000 // ~30KB
        else totalSize += 20000 // ~20KB for other chunks
      }
    })
    
    return totalSize
  }
}

/**
 * Performance monitoring for chunks
 */
export const monitorChunkPerformance = (chunkName: string): void => {
  if (typeof window === 'undefined') return
  
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    
    entries.forEach((entry) => {
      if (entry.name.includes(chunkName)) {
        logger.debug(`Chunk ${chunkName} performance:`, {
          duration: entry.duration,
          startTime: entry.startTime,
          entryType: entry.entryType
        })
      }
    })
  })
  
  observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] })
}

/**
 * React lazy loading utilities
 */
import React from 'react'

export const LazyDashboard = lazyLoadComponent(
  () => import('@/app/[locale]/(app)/dashboard/page'),
  'dashboard'
)

export const LazyMatches = lazyLoadComponent(
  () => import('@/app/[locale]/(app)/matches/page'),
  'matches'
)

export const LazyPlayers = lazyLoadComponent(
  () => import('@/app/[locale]/(app)/players/page'),
  'players'
)

export const LazyAdmin = lazyLoadComponent(
  () => import('@/app/[locale]/(app)/admin/page'),
  'admin'
)

// Heavy chart components
export const LazyRechartsBarChart = lazyLoadComponent(
  () => import('recharts').then(mod => ({ default: mod.BarChart as any })),
  'recharts-bar'
)

export const LazyRechartsLineChart = lazyLoadComponent(
  () => import('recharts').then(mod => ({ default: mod.LineChart as any })),
  'recharts-line'
)

export const LazyRechartsRadarChart = lazyLoadComponent(
  () => import('recharts').then(mod => ({ default: mod.RadarChart as any })),
  'recharts-radar'
)

// Heavy utility libraries
export const LazyLodash = dynamicImport(
  () => import('lodash'),
  'lodash'
)

export const LazyDateFns = dynamicImport(
  () => import('date-fns'),
  'date-fns'
)

/**
 * Bundle optimization hook for React components
 */
export const useBundleOptimization = () => {
  const [analytics, setAnalytics] = React.useState<Map<string, BundleAnalytics>>(new Map())
  const [isLoading, setIsLoading] = React.useState(false)
  
  const loadChunk = React.useCallback(async (
    chunkName: string,
    importFn: () => Promise<unknown>,
    config: ChunkLoadingConfig = {}
  ) => {
    setIsLoading(true)
    
    try {
      const result = await dynamicImport(importFn, chunkName, config)
      setAnalytics(getAllBundleAnalytics())
      return result
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  const preloadChunks = React.useCallback(async (route: string) => {
    await preloadCriticalChunks(route)
  }, [])
  
  const getChunkAnalytics = React.useCallback((chunkName: string) => {
    return analyzeBundleSize(chunkName)
  }, [])
  
  return {
    loadChunk,
    preloadChunks,
    getChunkAnalytics,
    analytics,
    isLoading,
    estimatedBundleSize: webpackChunkUtils.estimateBundleSize(),
    loadedChunks: webpackChunkUtils.getLoadedChunks()
  }
}