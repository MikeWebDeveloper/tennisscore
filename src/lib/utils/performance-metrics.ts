/**
 * Performance monitoring utilities for tracking render times and component performance
 */

export interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private isEnabled: boolean = process.env.NODE_ENV === 'development'

  startTimer(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return
    
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    })
  }

  endTimer(name: string): number | null {
    if (!this.isEnabled) return null
    
    const metric = this.metrics.get(name)
    if (!metric) return null

    const endTime = performance.now()
    const duration = endTime - metric.startTime

    metric.endTime = endTime
    metric.duration = duration

    // Log slow operations
    if (duration > 100) {
      console.warn(`⚠️ Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, metric.metadata)
    }

    return duration
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values())
  }

  clearMetrics(): void {
    this.metrics.clear()
  }

  logMetrics(): void {
    if (!this.isEnabled) return
    
    const metrics = this.getMetrics()
    console.group('📊 Performance Metrics')
    metrics.forEach(metric => {
      if (metric.duration) {
        console.log(`${metric.name}: ${metric.duration.toFixed(2)}ms`, metric.metadata)
      }
    })
    console.groupEnd()
  }
}

export const performanceMonitor = new PerformanceMonitor()

// React hook for measuring component render time
export function usePerformanceTimer(name: string, metadata?: Record<string, any>) {
  const startTime = performance.now()
  
  return {
    end: () => {
      const duration = performance.now() - startTime
      if (duration > 50) { // Log components taking more than 50ms
        console.log(`🔍 Component render: ${name} took ${duration.toFixed(2)}ms`, metadata)
      }
      return duration
    }
  }
}

// Higher-order component for automatic performance monitoring
export function withPerformanceMonitoring<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  componentName: string
): React.ComponentType<T> {
  const WrappedComponent = (props: T) => {
    const timer = usePerformanceTimer(componentName, { props: Object.keys(props) })
    
    React.useEffect(() => {
      return timer.end
    })
    
    return React.createElement(Component, props)
  }
  
  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName})`
  return WrappedComponent
}