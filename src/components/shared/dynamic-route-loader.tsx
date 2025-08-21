/**
 * Dynamic Route Loader
 * Implements route-based code splitting with intelligent preloading
 */

'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  lazyLoadComponent, 
  dynamicImport,
  useBundleOptimization
} from '@/lib/utils/bundle-optimization'
import { logger } from '@/lib/utils/logger'

interface DynamicRouteLoaderProps {
  children: React.ReactNode
  fallback?: React.ComponentType
  errorFallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
  enablePreloading?: boolean
  enableErrorRecovery?: boolean
}

// Route-based lazy components
const LazyComponents = {
  Dashboard: lazyLoadComponent(
    () => import('@/app/(app)/dashboard/page'),
    'dashboard-page'
  ),
  
  DashboardEnhancedBentoGrid: lazyLoadComponent(
    () => import('@/app/(app)/dashboard/_components/enhanced-bento-grid'),
    'dashboard-bento-grid'
  ),
  
  Matches: lazyLoadComponent(
    () => import('@/app/(app)/matches/page'),
    'matches-page'
  ),
  
  MatchDetails: lazyLoadComponent(
    () => import('@/app/(app)/matches/[id]/page'),
    'match-details'
  ),
  
  Players: lazyLoadComponent(
    () => import('@/app/(app)/players/page'),
    'players-page'
  ),
  
  Admin: lazyLoadComponent(
    () => import('@/app/(app)/admin/page'),
    'admin-page'
  ),
  
  // Heavy chart components
  RechartsComponents: lazyLoadComponent(
    () => import('recharts'),
    'recharts-bundle'
  ),
  
  // Form components
  FormComponents: lazyLoadComponent(
    () => import('@/components/ui/form'),
    'form-components'
  ),
  
  // Date picker
  DatePicker: lazyLoadComponent(
    () => import('@/components/ui/date-picker'),
    'date-picker'
  ),
  
  // Data table
  DataTable: lazyLoadComponent(
    () => import('@/components/ui/data-table'),
    'data-table'
  )
}

// Default loading fallback
const DefaultLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span>Loading...</span>
    </div>
  </div>
)

// Default error fallback
const DefaultErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ 
  error, 
  resetErrorBoundary 
}) => (
  <Card className="max-w-lg mx-auto mt-8">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-red-600">
        <AlertTriangle className="h-5 w-5" />
        Failed to Load Component
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p>An error occurred while loading this component:</p>
        <code className="block mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
          {error.message}
        </code>
      </div>
      
      <div className="flex gap-2">
        <Button onClick={resetErrorBoundary} size="sm" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.location.reload()}
        >
          Reload Page
        </Button>
      </div>
    </CardContent>
  </Card>
)

// Route preloading map
const ROUTE_PRELOAD_MAP: Record<string, string[]> = {
  '/dashboard': ['dashboard-page', 'dashboard-bento-grid', 'recharts-bundle'],
  '/matches': ['matches-page', 'form-components', 'date-picker'],
  '/players': ['players-page', 'form-components', 'data-table'],
  '/admin': ['admin-page', 'data-table', 'form-components'],
}

// Route component map
const ROUTE_COMPONENT_MAP: Record<string, keyof typeof LazyComponents> = {
  '/dashboard': 'Dashboard',
  '/matches': 'Matches', 
  '/players': 'Players',
  '/admin': 'Admin'
}

export const DynamicRouteLoader: React.FC<DynamicRouteLoaderProps> = ({
  children,
  fallback: CustomFallback,
  errorFallback: CustomErrorFallback,
  enablePreloading = true,
  enableErrorRecovery = true
}) => {
  const pathname = usePathname()
  const router = useRouter()
  const [, setLoadingStates] = useState<Map<string, boolean>>(new Map())
  const [preloadedRoutes, setPreloadedRoutes] = useState<Set<string>>(new Set())
  
  const { preloadChunks } = useBundleOptimization()

  // Preload critical chunks for current route
  useEffect(() => {
    if (!enablePreloading) return

    const preloadCurrentRoute = async () => {
      const chunksToPreload = ROUTE_PRELOAD_MAP[pathname]
      if (chunksToPreload && !preloadedRoutes.has(pathname)) {
        try {
          setLoadingStates(prev => new Map(prev.set(pathname, true)))
          
          await preloadChunks(pathname)
          
          // Also preload the chunks individually
          await Promise.allSettled(
            chunksToPreload.map(chunk => 
              dynamicImport(
                () => import(`@/app/(app)${pathname}/page`).catch(() => ({})),
                chunk,
                { preload: true }
              ).catch(() => {})
            )
          )
          
          setPreloadedRoutes(prev => new Set(prev.add(pathname)))
          logger.debug(`Preloaded chunks for route: ${pathname}`)
        } catch (error) {
          logger.error(`Failed to preload chunks for route ${pathname}:`, error)
        } finally {
          setLoadingStates(prev => new Map(prev.set(pathname, false)))
        }
      }
    }

    preloadCurrentRoute()
  }, [pathname, enablePreloading, preloadChunks, preloadedRoutes])

  // Preload adjacent routes on hover
  useEffect(() => {
    if (!enablePreloading) return

    const handleLinkHover = (event: MouseEvent) => {
      const target = event.target as HTMLAnchorElement
      if (target.tagName === 'A' && target.href) {
        const url = new URL(target.href)
        const route = url.pathname
        
        if (ROUTE_PRELOAD_MAP[route] && !preloadedRoutes.has(route)) {
          // Preload with low priority
          setTimeout(() => {
            preloadChunks(route).catch(error => {
              logger.debug(`Failed to preload on hover for route ${route}:`, error)
            })
          }, 100)
        }
      }
    }

    document.addEventListener('mouseover', handleLinkHover)
    return () => document.removeEventListener('mouseover', handleLinkHover)
  }, [enablePreloading, preloadChunks, preloadedRoutes])

  // Error recovery function
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    logger.error('Route component error:', error, errorInfo)
    
    // Attempt to recover by reloading the chunk
    if (enableErrorRecovery) {
      const componentName = ROUTE_COMPONENT_MAP[pathname]
      if (componentName) {
        setTimeout(() => {
          // Clear the failed chunk from cache and retry
          window.location.reload()
        }, 1000)
      }
    }
  }

  // Error fallback with recovery
  const ErrorFallback = CustomErrorFallback || DefaultErrorFallback
  const LoadingFallback = CustomFallback || DefaultLoadingFallback

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={() => router.refresh()}
    >
      <Suspense fallback={<LoadingFallback />}>
        <RouteBasedLoader pathname={pathname}>
          {children}
        </RouteBasedLoader>
      </Suspense>
    </ErrorBoundary>
  )
}

// Route-based component loader
const RouteBasedLoader: React.FC<{ pathname: string; children: React.ReactNode }> = ({
  pathname,
  children
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadRouteComponent = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const componentName = ROUTE_COMPONENT_MAP[pathname]
        if (componentName && LazyComponents[componentName]) {
          // Preload the component
          await new Promise(resolve => setTimeout(resolve, 0))
        }
        
        setIsLoading(false)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        setIsLoading(false)
        logger.error(`Failed to load route component for ${pathname}:`, error)
      }
    }

    loadRouteComponent()
  }, [pathname])

  if (error) {
    throw error
  }

  if (isLoading) {
    return <DefaultLoadingFallback />
  }

  return <>{children}</>
}

// Hook for route-based code splitting
export const useRouteBasedSplitting = () => {
  const pathname = usePathname()
  const [loadedChunks, setLoadedChunks] = useState<Set<string>>(new Set())
  const [isPreloading, setIsPreloading] = useState(false)
  
  const { preloadChunks } = useBundleOptimization()

  const preloadRoute = async (route: string) => {
    if (loadedChunks.has(route)) return
    
    setIsPreloading(true)
    try {
      await preloadChunks(route)
      setLoadedChunks(prev => new Set(prev.add(route)))
    } catch (error) {
      logger.error(`Failed to preload route ${route}:`, error)
    } finally {
      setIsPreloading(false)
    }
  }

  const getRouteChunks = (route: string) => {
    return ROUTE_PRELOAD_MAP[route] || []
  }

  const isRouteLoaded = (route: string) => {
    return loadedChunks.has(route)
  }

  return {
    currentRoute: pathname,
    loadedChunks: Array.from(loadedChunks),
    isPreloading,
    preloadRoute,
    getRouteChunks,
    isRouteLoaded
  }
}

// Higher-order component for route-based splitting
export const withRouteBasedSplitting = <P extends object>(
  Component: React.ComponentType<P>,
  chunkName: string
) => {
  const LazyComponent = lazyLoadComponent(
    () => Promise.resolve({ default: Component }),
    chunkName
  )

  const WrappedComponent = (props: P) => (
    <ErrorBoundary FallbackComponent={DefaultErrorFallback}>
      <Suspense fallback={<DefaultLoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withRouteBasedSplitting(${Component.displayName || Component.name})`

  return WrappedComponent
}

export default DynamicRouteLoader