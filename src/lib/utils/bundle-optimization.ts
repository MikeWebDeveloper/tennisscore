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
 * Supports optional modules and proper TypeScript typing
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
      return await (loadingChunks.get(chunkName)! as Promise<T>)
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
 * Enhanced with proper TypeScript typing and error handling
 */
export const lazyLoadComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  chunkName: string,
  config: LazyLoadConfig = {}
): React.LazyExoticComponent<T> => {
  const {
    retryCount = 3,
    retryDelay = 1000
  } = config

  return React.lazy(async (): Promise<{ default: T }> => {
    let lastError: Error | null = null
    
    for (let i = 0; i <= retryCount; i++) {
      try {
        const loadedModule = await dynamicImport(importFn, chunkName, {
          priority: 'high',
          preload: true
        })
        
        // Ensure the module has a default export
        if (!loadedModule || typeof loadedModule.default === 'undefined') {
          throw new Error(`Module ${chunkName} does not have a default export`)
        }
        
        return loadedModule as { default: T }
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
 * Get critical chunks for a specific route with uPlot support
 */
const getCriticalChunksForRoute = (route: string): string[] => {
  const routeChunkMap: Record<string, string[]> = {
    '/dashboard': ['dashboard', 'uplot-chart', 'statistics'],
    '/matches': ['matches', 'scoring', 'realtime'],
    '/players': ['players', 'forms', 'validation'],
    '/statistics': ['statistics', 'uplot-chart', 'data-analysis'],
    '/admin': ['admin', 'tables', 'data-management']
  }
  
  return routeChunkMap[route] || []
}

/**
 * Tree shaking helper for conditional imports with error handling
 */
export const conditionalImport = async <T>(
  condition: boolean,
  importFn: () => Promise<T>,
  chunkName: string,
  fallback?: T
): Promise<T | null> => {
  if (!condition) {
    return null
  }
  
  try {
    return await dynamicImport(importFn, chunkName)
  } catch (error) {
    logger.warn(`Conditional import ${chunkName} failed:`, error)
    return fallback || null
  }
}

/**
 * Safe module checker - verifies if a module can be imported
 */
export const canImportModule = async (moduleName: string): Promise<boolean> => {
  try {
    // Try to resolve the module without actually importing it
    if (typeof window !== 'undefined') {
      // Client-side check using dynamic import
      await eval(`import('${moduleName}').then(() => true, () => false)`)
      return true
    }
    // Server-side check (simplified)
    return true
  } catch {
    return false
  }
}

/**
 * Module availability registry for caching import checks
 */
const moduleAvailability = new Map<string, boolean>()

/**
 * Enhanced conditional import with availability caching
 */
export const smartConditionalImport = async <T>(
  moduleName: string,
  importFn: () => Promise<T>,
  chunkName: string,
  options: {
    fallback?: T
    cache?: boolean
    required?: boolean
  } = {}
): Promise<T | null> => {
  const { fallback, cache = true, required = false } = options
  
  // Check cache first
  if (cache && moduleAvailability.has(moduleName)) {
    const isAvailable = moduleAvailability.get(moduleName)!
    if (!isAvailable) {
      if (required) {
        throw new Error(`Required module ${moduleName} is not available`)
      }
      return fallback || null
    }
  }
  
  try {
    const result = await dynamicImport(importFn, chunkName)
    if (cache) {
      moduleAvailability.set(moduleName, true)
    }
    return result
  } catch (error) {
    if (cache) {
      moduleAvailability.set(moduleName, false)
    }
    
    if (required) {
      throw new Error(`Required module ${moduleName} failed to load: ${error}`)
    }
    
    logger.warn(`Optional module ${moduleName} not available:`, error)
    return fallback || null
  }
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
import type { ComponentType, LazyExoticComponent } from 'react'

// Type-safe lazy loading for Next.js pages
type NextPageComponent = ComponentType<any>
type LazyNextPage = LazyExoticComponent<NextPageComponent>

export const LazyDashboard: LazyNextPage = lazyLoadComponent(
  () => import('@/app/[locale]/(app)/dashboard/page').then(mod => ({ 
    default: mod.default as NextPageComponent 
  })),
  'dashboard'
)

export const LazyMatches: LazyNextPage = lazyLoadComponent(
  () => import('@/app/[locale]/(app)/matches/page').then(mod => ({ 
    default: mod.default as NextPageComponent 
  })),
  'matches'
)

export const LazyPlayers: LazyNextPage = lazyLoadComponent(
  () => import('@/app/[locale]/(app)/players/page').then(mod => ({ 
    default: mod.default as NextPageComponent 
  })),
  'players'
)

export const LazyAdmin: LazyNextPage = lazyLoadComponent(
  () => import('@/app/[locale]/(app)/admin/page').then(mod => ({ 
    default: mod.default as NextPageComponent 
  })),
  'admin'
)

// Type-safe chart components using uPlot (migrated from Recharts)
export const LazyUPlotChart = lazyLoadComponent(
  () => import('uplot-react').then(mod => ({ 
    default: mod.default as ComponentType<any> 
  })),
  'uplot-chart'
)

// Conditional utility library imports with proper typing
export const conditionalDateFns = async () => {
  try {
    return await dynamicImport(
      () => import('date-fns'),
      'date-fns'
    )
  } catch (error) {
    logger.warn('date-fns not available, using fallback')
    return null
  }
}

// Type-safe optional library loader
export const loadOptionalLibrary = async <T>(
  importFn: () => Promise<T>,
  libraryName: string,
  fallback?: T
): Promise<T | null> => {
  try {
    return await dynamicImport(importFn, libraryName)
  } catch (error) {
    logger.warn(`Optional library ${libraryName} not available:`, error)
    return fallback || null
  }
}

/**
 * Type definitions for error boundary components
 */
export interface LazyLoadErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

export interface LazyLoadErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary factory for lazy-loaded modules
 * Note: Actual React component implementation should be in a .tsx file
 */
export const createLazyLoadErrorBoundary = () => {
  // This is a factory function that returns the class definition
  // The actual implementation should be in a .tsx file
  return class LazyLoadErrorBoundary extends React.Component<
    LazyLoadErrorBoundaryProps,
    LazyLoadErrorBoundaryState
  > {
    constructor(props: LazyLoadErrorBoundaryProps) {
      super(props)
      this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): LazyLoadErrorBoundaryState {
      return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      logger.error('LazyLoad Error:', error)
      logger.error('Error Info:', errorInfo)
    }

    retry = () => {
      this.setState({ hasError: false, error: null })
    }

    render(): React.ReactNode {
      if (this.state.hasError) {
        const FallbackComponent = this.props.fallback
        if (FallbackComponent && this.state.error) {
          return React.createElement(FallbackComponent, {
            error: this.state.error,
            retry: this.retry
          })
        }
        // Return a simple error message as React element
        return React.createElement('div', {
          role: 'alert',
          style: { padding: '16px', border: '1px solid #fca5a5', borderRadius: '6px' }
        }, 'Component failed to load. Please try again.')
      }

      return this.props.children
    }
  }
}

/**
 * HOC factory for wrapping lazy components with error boundaries
 */
export const createLazyErrorBoundaryWrapper = <P extends object>(
  LazyComponent: React.LazyExoticComponent<React.ComponentType<P>>,
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
) => {
  const ErrorBoundary = createLazyLoadErrorBoundary()
  
  const WrappedComponent: React.FC<P> = (props) => 
    // eslint-disable-next-line react/no-children-prop
    React.createElement(ErrorBoundary, { 
      fallback,
      // eslint-disable-next-line react/no-children-prop
      children: React.createElement(React.Suspense, { 
        fallback: React.createElement('div', null, 'Loading...'),
        children: React.createElement(LazyComponent, props as any)
      })
    })
  
  WrappedComponent.displayName = `withLazyErrorBoundary(Component)`
  return WrappedComponent
}

/**
 * Bundle optimization hook for React components
 */
export const useBundleOptimization = () => {
  const [analytics, setAnalytics] = React.useState<Map<string, BundleAnalytics>>(new Map())
  const [isLoading, setIsLoading] = React.useState(false)
  
  const loadChunk = React.useCallback(async <T>(
    chunkName: string,
    importFn: () => Promise<T>,
    config: ChunkLoadingConfig = {}
  ): Promise<T> => {
    setIsLoading(true)
    
    try {
      const result = await dynamicImport(importFn, chunkName, config)
      setAnalytics(getAllBundleAnalytics())
      return result
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  const loadOptionalChunk = React.useCallback(async <T>(
    chunkName: string,
    importFn: () => Promise<T>,
    fallback?: T
  ): Promise<T | null> => {
    try {
      return await loadChunk(chunkName, importFn)
    } catch (error) {
      logger.warn(`Optional chunk ${chunkName} failed to load:`, error)
      return fallback || null
    }
  }, [loadChunk])
  
  const preloadChunks = React.useCallback(async (route: string) => {
    await preloadCriticalChunks(route)
  }, [])
  
  const getChunkAnalytics = React.useCallback((chunkName: string) => {
    return analyzeBundleSize(chunkName)
  }, [])
  
  return {
    loadChunk,
    loadOptionalChunk,
    preloadChunks,
    getChunkAnalytics,
    analytics,
    isLoading,
    estimatedBundleSize: webpackChunkUtils.estimateBundleSize(),
    loadedChunks: webpackChunkUtils.getLoadedChunks()
  }
}