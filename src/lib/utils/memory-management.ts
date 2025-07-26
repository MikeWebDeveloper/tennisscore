/**
 * Memory Management Utilities
 * Provides comprehensive memory leak detection and management features:
 * - Memory leak detection
 * - Memory usage monitoring
 * - Cleanup utilities
 * - Resource management
 * - Performance optimization
 */

import { logger } from './logger'

export interface MemoryMetrics {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  timestamp: number
  memoryUsagePercent: number
  leakDetected: boolean
  leakSeverity: 'low' | 'medium' | 'high'
}

export interface MemoryLeakDetection {
  componentName: string
  leakType: 'event-listener' | 'timer' | 'subscription' | 'dom-reference' | 'closure'
  severity: 'low' | 'medium' | 'high'
  description: string
  stackTrace?: string
  memoryImpact: number
  timestamp: number
}

export interface CleanupFunction {
  id: string
  cleanup: () => void
  priority: 'low' | 'medium' | 'high'
  componentName?: string
  type: 'event' | 'timer' | 'subscription' | 'dom' | 'other'
}

// Global memory monitoring state
let memoryMonitor: MemoryMonitor | null = null
let isMonitoring = false

export class MemoryMonitor {
  private metrics: MemoryMetrics[] = []
  private cleanupFunctions: Map<string, CleanupFunction> = new Map()
  private leakDetections: MemoryLeakDetection[] = []
  private monitoringInterval: number | null = null
  private performanceObserver: PerformanceObserver | null = null
  private mutationObserver: MutationObserver | null = null
  private memoryThreshold = 0.8 // 80% of heap limit
  private leakThreshold = 50 * 1024 * 1024 // 50MB increase indicates potential leak

  constructor() {
    this.initialize()
  }

  private initialize() {
    if (typeof window === 'undefined') return

    // Initialize performance observer for memory tracking
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'measure' && entry.name.includes('memory')) {
            this.analyzeMemoryMeasurement(entry)
          }
        })
      })
      
      this.performanceObserver.observe({ entryTypes: ['measure'] })
    }

    // Initialize DOM mutation observer for leak detection
    this.mutationObserver = new MutationObserver((mutations) => {
      this.analyzeDOMMutations(mutations)
    })

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true
    })

    logger.debug('Memory monitor initialized')
  }

  /**
   * Start memory monitoring
   */
  public startMonitoring(intervalMs: number = 5000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring()
    }

    this.monitoringInterval = window.setInterval(() => {
      this.collectMemoryMetrics()
      this.detectMemoryLeaks()
    }, intervalMs)

    isMonitoring = true
    logger.debug('Memory monitoring started')
  }

  /**
   * Stop memory monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    isMonitoring = false
    logger.debug('Memory monitoring stopped')
  }

  /**
   * Collect current memory metrics
   */
  private collectMemoryMetrics(): void {
    if (typeof window === 'undefined' || !('performance' in window)) return

    const memory = (performance as Record<string, any>).memory
    if (!memory) return

    const metrics: MemoryMetrics = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: Date.now(),
      memoryUsagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      leakDetected: false,
      leakSeverity: 'low'
    }

    // Detect memory leaks
    if (this.metrics.length > 0) {
      const lastMetric = this.metrics[this.metrics.length - 1]
      const memoryIncrease = metrics.usedJSHeapSize - lastMetric.usedJSHeapSize
      
      if (memoryIncrease > this.leakThreshold) {
        metrics.leakDetected = true
        metrics.leakSeverity = memoryIncrease > this.leakThreshold * 2 ? 'high' : 'medium'
        
        this.recordMemoryLeak({
          componentName: 'Unknown',
          leakType: 'closure',
          severity: metrics.leakSeverity,
          description: `Memory increased by ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
          memoryImpact: memoryIncrease,
          timestamp: Date.now()
        })
      }
    }

    this.metrics.push(metrics)

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }

    // Log warning if memory usage is high
    if (metrics.memoryUsagePercent > this.memoryThreshold * 100) {
      logger.warn('High memory usage detected', {
        usagePercent: metrics.memoryUsagePercent.toFixed(2),
        usedMB: (metrics.usedJSHeapSize / 1024 / 1024).toFixed(2),
        limitMB: (metrics.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
      })
    }
  }

  /**
   * Detect memory leaks based on patterns
   */
  private detectMemoryLeaks(): void {
    // Check for event listener leaks
    this.detectEventListenerLeaks()
    
    // Check for timer leaks
    this.detectTimerLeaks()
    
    // Check for DOM reference leaks
    this.detectDOMReferenceLeaks()
    
    // Check for subscription leaks
    this.detectSubscriptionLeaks()
  }

  /**
   * Detect event listener leaks
   */
  private detectEventListenerLeaks(): void {
    if (typeof window === 'undefined') return

    const eventListeners = (window as any).getEventListeners?.(document) || {}
    const listenerCount = Object.keys(eventListeners).reduce((count, eventType) => {
      return count + (eventListeners[eventType]?.length || 0)
    }, 0)

    if (listenerCount > 100) {
      this.recordMemoryLeak({
        componentName: 'Global',
        leakType: 'event-listener',
        severity: listenerCount > 500 ? 'high' : listenerCount > 200 ? 'medium' : 'low',
        description: `${listenerCount} event listeners detected on document`,
        memoryImpact: listenerCount * 1024, // Estimate 1KB per listener
        timestamp: Date.now()
      })
    }
  }

  /**
   * Detect timer leaks
   */
  private detectTimerLeaks(): void {
    // Check for excessive number of timers
    // This is a simplified check - real implementation would track timers
    const timerCount = this.cleanupFunctions.size
    
    if (timerCount > 50) {
      this.recordMemoryLeak({
        componentName: 'Global',
        leakType: 'timer',
        severity: timerCount > 200 ? 'high' : timerCount > 100 ? 'medium' : 'low',
        description: `${timerCount} active timers detected`,
        memoryImpact: timerCount * 512, // Estimate 512B per timer
        timestamp: Date.now()
      })
    }
  }

  /**
   * Detect DOM reference leaks
   */
  private detectDOMReferenceLeaks(): void {
    if (typeof document === 'undefined') return

    const nodeCount = document.getElementsByTagName('*').length
    
    if (nodeCount > 10000) {
      this.recordMemoryLeak({
        componentName: 'DOM',
        leakType: 'dom-reference',
        severity: nodeCount > 50000 ? 'high' : nodeCount > 25000 ? 'medium' : 'low',
        description: `${nodeCount} DOM nodes detected`,
        memoryImpact: nodeCount * 256, // Estimate 256B per DOM node
        timestamp: Date.now()
      })
    }
  }

  /**
   * Detect subscription leaks
   */
  private detectSubscriptionLeaks(): void {
    const subscriptionCount = Array.from(this.cleanupFunctions.values())
      .filter(cleanup => cleanup.type === 'subscription').length
    
    if (subscriptionCount > 20) {
      this.recordMemoryLeak({
        componentName: 'Global',
        leakType: 'subscription',
        severity: subscriptionCount > 100 ? 'high' : subscriptionCount > 50 ? 'medium' : 'low',
        description: `${subscriptionCount} active subscriptions detected`,
        memoryImpact: subscriptionCount * 1024, // Estimate 1KB per subscription
        timestamp: Date.now()
      })
    }
  }

  /**
   * Analyze performance measurements
   */
  private analyzeMemoryMeasurement(entry: PerformanceEntry): void {
    logger.debug('Memory measurement:', {
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime
    })
  }

  /**
   * Analyze DOM mutations for potential leaks
   */
  private analyzeDOMMutations(mutations: MutationRecord[]): void {
    let addedNodes = 0
    let removedNodes = 0

    mutations.forEach(mutation => {
      addedNodes += mutation.addedNodes.length
      removedNodes += mutation.removedNodes.length
    })

    // If we're adding many more nodes than removing, potential leak
    if (addedNodes > removedNodes * 2 && addedNodes > 50) {
      logger.debug('Potential DOM leak detected', {
        addedNodes,
        removedNodes,
        ratio: addedNodes / (removedNodes || 1)
      })
    }
  }

  /**
   * Record memory leak detection
   */
  private recordMemoryLeak(leak: MemoryLeakDetection): void {
    this.leakDetections.push(leak)
    
    // Keep only last 50 leak detections
    if (this.leakDetections.length > 50) {
      this.leakDetections = this.leakDetections.slice(-50)
    }

    logger.warn('Memory leak detected', leak)
  }

  /**
   * Register cleanup function
   */
  public registerCleanup(cleanupFn: CleanupFunction): void {
    this.cleanupFunctions.set(cleanupFn.id, cleanupFn)
  }

  /**
   * Unregister cleanup function
   */
  public unregisterCleanup(id: string): void {
    this.cleanupFunctions.delete(id)
  }

  /**
   * Execute cleanup function
   */
  public executeCleanup(id: string): void {
    const cleanupFn = this.cleanupFunctions.get(id)
    if (cleanupFn) {
      try {
        cleanupFn.cleanup()
        this.unregisterCleanup(id)
      } catch (error) {
        logger.error('Cleanup function failed', { id, error })
      }
    }
  }

  /**
   * Execute all cleanup functions
   */
  public executeAllCleanups(): void {
    const cleanups = Array.from(this.cleanupFunctions.values())
    
    // Sort by priority
    cleanups.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    cleanups.forEach(cleanup => {
      try {
        cleanup.cleanup()
      } catch (error) {
        logger.error('Cleanup function failed', { id: cleanup.id, error })
      }
    })

    this.cleanupFunctions.clear()
  }

  /**
   * Get current memory metrics
   */
  public getCurrentMetrics(): MemoryMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  /**
   * Get memory history
   */
  public getMemoryHistory(): MemoryMetrics[] {
    return [...this.metrics]
  }

  /**
   * Get leak detections
   */
  public getLeakDetections(): MemoryLeakDetection[] {
    return [...this.leakDetections]
  }

  /**
   * Get cleanup functions
   */
  public getCleanupFunctions(): CleanupFunction[] {
    return Array.from(this.cleanupFunctions.values())
  }

  /**
   * Force garbage collection (if available)
   */
  public forceGarbageCollection(): void {
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc()
      logger.debug('Forced garbage collection')
    } else {
      logger.debug('Garbage collection not available')
    }
  }

  /**
   * Get memory usage report
   */
  public getMemoryReport(): {
    current: MemoryMetrics | null
    leaks: MemoryLeakDetection[]
    cleanups: CleanupFunction[]
    recommendations: string[]
  } {
    const current = this.getCurrentMetrics()
    const leaks = this.getLeakDetections()
    const cleanups = this.getCleanupFunctions()
    const recommendations: string[] = []

    // Generate recommendations
    if (current && current.memoryUsagePercent > 80) {
      recommendations.push('Memory usage is high. Consider reducing component complexity.')
    }

    if (leaks.length > 0) {
      recommendations.push(`${leaks.length} memory leaks detected. Review cleanup procedures.`)
    }

    if (cleanups.length > 100) {
      recommendations.push('Large number of cleanup functions. Consider optimizing component lifecycle.')
    }

    const highSeverityLeaks = leaks.filter(leak => leak.severity === 'high')
    if (highSeverityLeaks.length > 0) {
      recommendations.push('High severity memory leaks detected. Immediate attention required.')
    }

    return {
      current,
      leaks,
      cleanups,
      recommendations
    }
  }

  /**
   * Clear all data
   */
  public clear(): void {
    this.metrics = []
    this.leakDetections = []
    this.cleanupFunctions.clear()
  }

  /**
   * Destroy monitor
   */
  public destroy(): void {
    this.stopMonitoring()
    this.executeAllCleanups()
    this.performanceObserver?.disconnect()
    this.mutationObserver?.disconnect()
    this.clear()
  }
}

/**
 * Get global memory monitor instance
 */
export const getMemoryMonitor = (): MemoryMonitor => {
  if (!memoryMonitor) {
    memoryMonitor = new MemoryMonitor()
  }
  return memoryMonitor
}

/**
 * Start memory monitoring
 */
export const startMemoryMonitoring = (intervalMs: number = 5000): void => {
  const monitor = getMemoryMonitor()
  monitor.startMonitoring(intervalMs)
}

/**
 * Stop memory monitoring
 */
export const stopMemoryMonitoring = (): void => {
  const monitor = getMemoryMonitor()
  monitor.stopMonitoring()
}

/**
 * Register cleanup function
 */
export const registerCleanup = (cleanupFn: Omit<CleanupFunction, 'id'> & { id?: string }): string => {
  const id = cleanupFn.id || `cleanup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const monitor = getMemoryMonitor()
  monitor.registerCleanup({ ...cleanupFn, id })
  return id
}

/**
 * Unregister cleanup function
 */
export const unregisterCleanup = (id: string): void => {
  const monitor = getMemoryMonitor()
  monitor.unregisterCleanup(id)
}

/**
 * Execute cleanup function
 */
export const executeCleanup = (id: string): void => {
  const monitor = getMemoryMonitor()
  monitor.executeCleanup(id)
}

/**
 * Get current memory metrics
 */
export const getCurrentMemoryMetrics = (): MemoryMetrics | null => {
  const monitor = getMemoryMonitor()
  return monitor.getCurrentMetrics()
}

/**
 * Get memory report
 */
export const getMemoryReport = () => {
  const monitor = getMemoryMonitor()
  return monitor.getMemoryReport()
}

/**
 * Force garbage collection
 */
export const forceGarbageCollection = (): void => {
  const monitor = getMemoryMonitor()
  monitor.forceGarbageCollection()
}

/**
 * Check if monitoring is active
 */
export const isMemoryMonitoringActive = (): boolean => {
  return isMonitoring
}

/**
 * Cleanup utilities
 */
export const cleanupUtils = {
  /**
   * Create cleanup function for event listeners
   */
  createEventListenerCleanup: (
    element: EventTarget,
    event: string,
    handler: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions
  ): string => {
    element.addEventListener(event, handler, options)
    
    return registerCleanup({
      cleanup: () => element.removeEventListener(event, handler, options),
      priority: 'medium',
      type: 'event'
    })
  },

  /**
   * Create cleanup function for timers
   */
  createTimerCleanup: (timerId: number, type: 'timeout' | 'interval' = 'timeout'): string => {
    return registerCleanup({
      cleanup: () => {
        if (type === 'timeout') {
          clearTimeout(timerId)
        } else {
          clearInterval(timerId)
        }
      },
      priority: 'high',
      type: 'timer'
    })
  },

  /**
   * Create cleanup function for subscriptions
   */
  createSubscriptionCleanup: (unsubscribe: () => void): string => {
    return registerCleanup({
      cleanup: unsubscribe,
      priority: 'high',
      type: 'subscription'
    })
  },

  /**
   * Create cleanup function for DOM elements
   */
  createDOMCleanup: (element: Element): string => {
    return registerCleanup({
      cleanup: () => {
        element.remove()
      },
      priority: 'low',
      type: 'dom'
    })
  },

  /**
   * Create cleanup function for observers
   */
  createObserverCleanup: (observer: { disconnect: () => void }): string => {
    return registerCleanup({
      cleanup: () => observer.disconnect(),
      priority: 'medium',
      type: 'other'
    })
  }
}