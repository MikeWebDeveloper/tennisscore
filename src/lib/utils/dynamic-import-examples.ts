/**
 * Type-Safe Dynamic Import Examples for Next.js 15
 * 
 * This file demonstrates best practices for dynamic imports with TypeScript,
 * including error handling, optional modules, and proper component typing.
 */

import { logger } from './logger'
import { 
  dynamicImport, 
  lazyLoadComponent, 
  conditionalImport, 
  smartConditionalImport,
  createLazyErrorBoundaryWrapper
} from './bundle-optimization'
import type { ComponentType } from 'react'

// ============================================================================
// PATTERN 1: Type-Safe Page Component Loading
// ============================================================================

/**
 * Example: Loading Next.js page components with proper typing
 */
export const loadDashboardPage = async () => {
  try {
    const DashboardPage = await dynamicImport(
      () => import('@/app/[locale]/(app)/dashboard/page'),
      'dashboard-page'
    )
    return DashboardPage
  } catch (error) {
    logger.error('Failed to load dashboard page:', error)
    throw new Error('Dashboard page unavailable')
  }
}

// ============================================================================
// PATTERN 2: Conditional Chart Library Loading (uPlot vs Fallback)
// ============================================================================

/**
 * Example: Smart chart library loading with fallback
 */
export const loadChartLibrary = async () => {
  // Try to load the preferred chart library (uPlot)
  const uplotChart = await smartConditionalImport(
    'uplot-react',
    () => import('uplot-react'),
    'uplot-chart',
    { cache: true, required: false }
  )

  if (uplotChart) {
    logger.info('Using uPlot for charts')
    return uplotChart
  }

  // Fallback to a simple chart implementation
  logger.warn('uPlot not available, using fallback chart')
  return {
    default: ({ data, width = 400, height = 300 }: any) => {
      return `<div>Chart fallback: ${data?.length || 0} data points</div>`
    }
  }
}

// ============================================================================
// PATTERN 3: Optional Utility Library Loading
// ============================================================================

/**
 * Example: Loading date-fns with graceful degradation
 */
export const loadDateUtilities = async () => {
  const dateFns = await smartConditionalImport(
    'date-fns',
    () => import('date-fns'),
    'date-fns-utils',
    {
      cache: true,
      fallback: {} as any
    }
  )

  return (dateFns || {}) as any
}

// ============================================================================
// PATTERN 4: Component-Level Lazy Loading with Error Boundaries
// ============================================================================

/**
 * Example: Creating a lazy-loaded statistics component
 * Note: For JSX components, create this in a .tsx file
 */
export const createLazyStatisticsChart = () => {
  return createLazyErrorBoundaryWrapper(
    lazyLoadComponent(
      () => import('@/components/features/statistics/advanced-chart').then(mod => ({
        default: mod.AdvancedChart as ComponentType<{
          data: Array<{ x: number; y: number }>
          title?: string
          width?: number
          height?: number
        }>
      })),
      'statistics-chart'
    ),
    // Custom error fallback using React.createElement
    ({ error, retry }) => {
      const React = require('react')
      return React.createElement('div', {
        className: 'p-4 border-2 border-dashed border-gray-300 rounded-lg text-center'
      }, [
        React.createElement('p', { 
          key: 'title',
          className: 'text-gray-600 mb-2' 
        }, 'Chart failed to load'),
        React.createElement('p', { 
          key: 'error',
          className: 'text-sm text-red-500 mb-3' 
        }, error.message),
        React.createElement('button', {
          key: 'retry',
          onClick: retry,
          className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
        }, 'Retry Loading Chart')
      ])
    }
  )
}

// ============================================================================
// PATTERN 5: Feature-Flag Based Dynamic Loading
// ============================================================================

/**
 * Example: Load advanced features based on user permissions or feature flags
 */
export const loadAdvancedFeatures = async (userPermissions: string[]) => {
  const features: Record<string, any> = {}

  // Load admin panel only for admin users
  if (userPermissions.includes('admin')) {
    features.adminPanel = await conditionalImport(
      true,
      () => import('@/components/admin/admin-panel'),
      'admin-panel'
    )
  }

  // Load analytics only if user has analytics permission
  if (userPermissions.includes('analytics')) {
    features.analytics = await conditionalImport(
      true,
      () => import('@/components/analytics/dashboard'),
      'analytics-dashboard'
    )
  }

  // Load export features conditionally
  const hasExportPermission = userPermissions.includes('export')
  features.export = await conditionalImport(
    hasExportPermission,
    () => import('@/lib/utils/export-utilities'),
    'export-utils',
    // Provide a fallback export function
    {} as any
  )

  return features
}

// ============================================================================
// PATTERN 6: Performance-Optimized Module Loading
// ============================================================================

/**
 * Example: Progressive enhancement with performance monitoring
 */
export const enhanceWithPerformanceFeatures = async () => {
  const startTime = performance.now()
  
  // Load web vitals for performance monitoring (optional)
  const webVitals = await smartConditionalImport(
    'web-vitals',
    () => import('web-vitals'),
    'web-vitals',
    { 
      cache: true,
      fallback: {} as any
    }
  )

  // Load animation library for enhanced UX (optional)
  const animations = await smartConditionalImport(
    'framer-motion',
    () => import('framer-motion'),
    'animations',
    { cache: true }
  )

  const loadTime = performance.now() - startTime
  logger.info(`Enhanced features loaded in ${loadTime.toFixed(2)}ms`, {
    webVitalsAvailable: !!webVitals,
    animationsAvailable: !!animations
  })

  return {
    webVitals,
    animations,
    loadTime
  }
}

// ============================================================================
// PATTERN 7: Hook-Based Dynamic Loading
// ============================================================================

/**
 * Example: React hook for dynamic feature loading
 */
import { useState, useEffect, useCallback } from 'react'

export const useDynamicFeatures = (featureFlags: string[]) => {
  const [features, setFeatures] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadFeatures = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const loadedFeatures: Record<string, any> = {}

      // Load features based on flags
      await Promise.allSettled(
        featureFlags.map(async (flag) => {
          switch (flag) {
            case 'advanced-charts':
              loadedFeatures.charts = await loadChartLibrary()
              break
            case 'date-utilities':
              loadedFeatures.dateUtils = await loadDateUtilities()
              break
            case 'performance-monitoring':
              loadedFeatures.performance = await enhanceWithPerformanceFeatures()
              break
          }
        })
      )

      setFeatures(loadedFeatures)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load features'))
    } finally {
      setLoading(false)
    }
  }, [featureFlags])

  useEffect(() => {
    loadFeatures()
  }, [loadFeatures])

  const retryLoading = useCallback(() => {
    loadFeatures()
  }, [loadFeatures])

  return {
    features,
    loading,
    error,
    retry: retryLoading
  }
}

// ============================================================================
// PATTERN 8: Server-Side Dynamic Import Guards
// ============================================================================

/**
 * Example: Safe server-side dynamic imports
 */
export const loadServerOnlyUtilities = async () => {
  // Only import server-side utilities on the server
  if (typeof window === 'undefined') {
    const serverUtils = await conditionalImport(
      true,
      () => import('@/lib/server-utilities'),
      'server-utils'
    )
    
    return serverUtils
  }

  // Return null or client-side alternatives
  return null
}

/**
 * Example: Client-side only imports
 */
export const loadClientOnlyFeatures = async () => {
  // Only load client-side features in the browser
  if (typeof window !== 'undefined') {
    const clientFeatures = await Promise.allSettled([
      conditionalImport(
        true,
        () => import('@/lib/browser-storage'),
        'browser-storage'
      ),
      conditionalImport(
        'serviceWorker' in navigator,
        () => import('@/lib/service-worker-utils'),
        'service-worker'
      )
    ])

    return {
      storage: clientFeatures[0].status === 'fulfilled' ? clientFeatures[0].value : null,
      serviceWorker: clientFeatures[1].status === 'fulfilled' ? clientFeatures[1].value : null
    }
  }

  return { storage: null, serviceWorker: null }
}

// ============================================================================
// Export all patterns for easy usage
// ============================================================================

export {
  // Core utilities
  dynamicImport,
  lazyLoadComponent,
  conditionalImport,
  smartConditionalImport,
  createLazyErrorBoundaryWrapper,
  createLazyLoadErrorBoundary
} from './bundle-optimization'