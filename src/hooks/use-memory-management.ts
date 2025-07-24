/**
 * Memory Management Hook
 * Provides memory management features for React components
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  getMemoryMonitor,
  registerCleanup,
  unregisterCleanup,
  cleanupUtils,
  getCurrentMemoryMetrics,
  getMemoryReport,
  forceGarbageCollection,
  MemoryMetrics,
  MemoryLeakDetection,
  CleanupFunction
} from '@/lib/utils/memory-management'
import { logger } from '@/lib/utils/logger'

export interface UseMemoryManagementOptions {
  enableMonitoring?: boolean
  enableLeakDetection?: boolean
  enableAutoCleanup?: boolean
  componentName?: string
  monitoringInterval?: number
  leakThreshold?: number
}

export interface MemoryManagementState {
  currentMetrics: MemoryMetrics | null
  leakDetections: MemoryLeakDetection[]
  cleanupFunctions: CleanupFunction[]
  isMonitoring: boolean
  isHealthy: boolean
  memoryUsagePercent: number
  recommendations: string[]
}

export const useMemoryManagement = (options: UseMemoryManagementOptions = {}) => {
  const {
    enableMonitoring = true,
    enableAutoCleanup = true,
    componentName = 'Unknown',
    monitoringInterval = 5000,
    leakThreshold = 80
  } = options

  const [state, setState] = useState<MemoryManagementState>({
    currentMetrics: null,
    leakDetections: [],
    cleanupFunctions: [],
    isMonitoring: false,
    isHealthy: true,
    memoryUsagePercent: 0,
    recommendations: []
  })

  const cleanupIds = useRef<Set<string>>(new Set())
  const monitor = useRef(getMemoryMonitor())
  const monitoringTimer = useRef<number | null>(null)

  // Initialize monitoring
  useEffect(() => {
    if (enableMonitoring) {
      monitor.current.startMonitoring(monitoringInterval)
      
      // Update state periodically
      monitoringTimer.current = window.setInterval(() => {
        updateMemoryState()
      }, monitoringInterval)

      setState(prev => ({ ...prev, isMonitoring: true }))
    }

    return () => {
      if (monitoringTimer.current) {
        clearInterval(monitoringTimer.current)
      }
    }
  }, [enableMonitoring, monitoringInterval])

  // Update memory state
  const updateMemoryState = useCallback(() => {
    const report = getMemoryReport()
    const currentMetrics = getCurrentMemoryMetrics()
    
    setState(prev => ({
      ...prev,
      currentMetrics,
      leakDetections: report.leaks,
      cleanupFunctions: report.cleanups,
      isHealthy: (currentMetrics?.memoryUsagePercent || 0) < leakThreshold && report.leaks.length === 0,
      memoryUsagePercent: currentMetrics?.memoryUsagePercent || 0,
      recommendations: report.recommendations
    }))
  }, [leakThreshold])

  // Auto cleanup on component unmount
  useEffect(() => {
    return () => {
      if (enableAutoCleanup) {
        cleanupIds.current.forEach(id => {
          unregisterCleanup(id)
        })
        cleanupIds.current.clear()
      }
    }
  }, [enableAutoCleanup])

  // Register event listener with automatic cleanup
  const addEventListenerWithCleanup = useCallback((
    element: EventTarget,
    event: string,
    handler: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions
  ): string => {
    const id = cleanupUtils.createEventListenerCleanup(element, event, handler, options)
    cleanupIds.current.add(id)
    
    logger.debug('Event listener registered with cleanup', {
      componentName,
      event,
      id
    })
    
    return id
  }, [componentName])

  // Register timer with automatic cleanup
  const setTimeoutWithCleanup = useCallback((
    callback: () => void,
    delay: number
  ): string => {
    const timerId = window.setTimeout(callback, delay)
    const id = cleanupUtils.createTimerCleanup(timerId, 'timeout')
    cleanupIds.current.add(id)
    
    logger.debug('Timeout registered with cleanup', {
      componentName,
      delay,
      id
    })
    
    return id
  }, [componentName])

  // Register interval with automatic cleanup
  const setIntervalWithCleanup = useCallback((
    callback: () => void,
    interval: number
  ): string => {
    const timerId = window.setInterval(callback, interval)
    const id = cleanupUtils.createTimerCleanup(timerId, 'interval')
    cleanupIds.current.add(id)
    
    logger.debug('Interval registered with cleanup', {
      componentName,
      interval,
      id
    })
    
    return id
  }, [componentName])

  // Register subscription with automatic cleanup
  const subscribeWithCleanup = useCallback((
    unsubscribe: () => void
  ): string => {
    const id = cleanupUtils.createSubscriptionCleanup(unsubscribe)
    cleanupIds.current.add(id)
    
    logger.debug('Subscription registered with cleanup', {
      componentName,
      id
    })
    
    return id
  }, [componentName])

  // Register observer with automatic cleanup
  const observerWithCleanup = useCallback((
    observer: { disconnect: () => void }
  ): string => {
    const id = cleanupUtils.createObserverCleanup(observer)
    cleanupIds.current.add(id)
    
    logger.debug('Observer registered with cleanup', {
      componentName,
      id
    })
    
    return id
  }, [componentName])

  // Register custom cleanup function
  const registerCustomCleanup = useCallback((
    cleanup: () => void,
    priority: 'low' | 'medium' | 'high' = 'medium',
    type: 'event' | 'timer' | 'subscription' | 'dom' | 'other' = 'other'
  ): string => {
    const id = registerCleanup({
      cleanup,
      priority,
      componentName,
      type
    })
    
    cleanupIds.current.add(id)
    
    logger.debug('Custom cleanup registered', {
      componentName,
      priority,
      type,
      id
    })
    
    return id
  }, [componentName])

  // Unregister cleanup function
  const unregisterCleanupFunction = useCallback((id: string): void => {
    unregisterCleanup(id)
    cleanupIds.current.delete(id)
    
    logger.debug('Cleanup function unregistered', {
      componentName,
      id
    })
  }, [componentName])

  // Force garbage collection
  const triggerGarbageCollection = useCallback(() => {
    forceGarbageCollection()
    updateMemoryState()
    
    logger.debug('Garbage collection triggered', {
      componentName
    })
  }, [componentName, updateMemoryState])

  // Get memory health status
  const getMemoryHealth = useCallback(() => {
    const metrics = getCurrentMemoryMetrics()
    if (!metrics) return { status: 'unknown', score: 0 }

    let score = 100
    let status: 'healthy' | 'warning' | 'critical' | 'unknown' = 'healthy'

    // Check memory usage
    if (metrics.memoryUsagePercent > 90) {
      score -= 30
      status = 'critical'
    } else if (metrics.memoryUsagePercent > 70) {
      score -= 15
      status = 'warning'
    }

    // Check for memory leaks
    if (metrics.leakDetected) {
      score -= metrics.leakSeverity === 'high' ? 25 : metrics.leakSeverity === 'medium' ? 15 : 5
      if (status === 'healthy') {
        status = metrics.leakSeverity === 'high' ? 'critical' : 'warning'
      }
    }

    // Check cleanup function count
    const cleanupCount = cleanupIds.current.size
    if (cleanupCount > 50) {
      score -= 10
      if (status === 'healthy') status = 'warning'
    }

    return { status, score: Math.max(0, score) }
  }, [])

  // Get memory optimization suggestions
  const getOptimizationSuggestions = useCallback(() => {
    const suggestions: string[] = []
    const metrics = getCurrentMemoryMetrics()

    if (!metrics) return suggestions

    if (metrics.memoryUsagePercent > 80) {
      suggestions.push('Memory usage is high. Consider reducing component complexity or implementing lazy loading.')
    }

    if (metrics.leakDetected) {
      suggestions.push(`Memory leak detected (${metrics.leakSeverity} severity). Review cleanup procedures.`)
    }

    if (cleanupIds.current.size > 20) {
      suggestions.push('Large number of cleanup functions. Consider optimizing component lifecycle.')
    }

    if (state.leakDetections.length > 0) {
      const eventListenerLeaks = state.leakDetections.filter(leak => leak.leakType === 'event-listener')
      if (eventListenerLeaks.length > 0) {
        suggestions.push('Event listener leaks detected. Ensure proper removal of event listeners.')
      }

      const timerLeaks = state.leakDetections.filter(leak => leak.leakType === 'timer')
      if (timerLeaks.length > 0) {
        suggestions.push('Timer leaks detected. Ensure proper cleanup of setTimeout/setInterval.')
      }
    }

    return suggestions
  }, [state.leakDetections])

  // Memory usage warning
  useEffect(() => {
    if (state.memoryUsagePercent > leakThreshold) {
      logger.warn('High memory usage detected', {
        componentName,
        memoryUsagePercent: state.memoryUsagePercent,
        currentMetrics: state.currentMetrics
      })
    }
  }, [state.memoryUsagePercent, leakThreshold, componentName, state.currentMetrics])

  // Memory leak warning
  useEffect(() => {
    if (state.leakDetections.length > 0) {
      const recentLeaks = state.leakDetections.filter(
        leak => Date.now() - leak.timestamp < 10000 // Last 10 seconds
      )
      
      if (recentLeaks.length > 0) {
        logger.warn('Memory leaks detected', {
          componentName,
          leakCount: recentLeaks.length,
          leaks: recentLeaks
        })
      }
    }
  }, [state.leakDetections, componentName])

  return {
    // State
    ...state,
    
    // Cleanup utilities
    addEventListenerWithCleanup,
    setTimeoutWithCleanup,
    setIntervalWithCleanup,
    subscribeWithCleanup,
    observerWithCleanup,
    registerCustomCleanup,
    unregisterCleanupFunction,
    
    // Memory management
    triggerGarbageCollection,
    updateMemoryState,
    getMemoryHealth,
    getOptimizationSuggestions,
    
    // Computed values
    memoryHealth: getMemoryHealth(),
    optimizationSuggestions: getOptimizationSuggestions(),
    cleanupCount: cleanupIds.current.size,
    
    // Status
    hasMemoryLeaks: state.leakDetections.length > 0,
    hasHighMemoryUsage: state.memoryUsagePercent > leakThreshold,
    needsOptimization: state.recommendations.length > 0
  }
}

export default useMemoryManagement