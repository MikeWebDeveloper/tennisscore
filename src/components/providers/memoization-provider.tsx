'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface MemoizationMetric {
  componentName: string
  memoHits: number
  memoMisses: number
  memoEvictions: number
  cacheSize: number
  avgRenderTime: number
  lastRender: number
  memoryUsage: number
  complexity: number
  mountTime: number
  updateCount: number
  renderCount: number
  childrenCount: number
  propsCount: number
  contextDependencies: string[]
  rerenderTriggers: string[]
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  slowComparisons: number
  propsChanged: string[]
}

interface CacheStats {
  hits: number
  misses: number
  evictions: number
  size: number
  maxSize: number
  totalCacheEntries: number
  totalFunctions: number
  averageCacheSize: number
  cacheHitRate: number
}

interface MemoizationContext {
  metrics: MemoizationMetric[]
  isEnabled: boolean
  performanceThreshold: number
  memoryThreshold: number
  recommendations: string[]
  totalComponents: number
  problematicComponents: number
  cacheStats: CacheStats
  healthScore: number
  enableMemoization: boolean
  enablePerformanceMonitoring: boolean
  clearMetrics: () => void
  enableTracking: () => void
  disableTracking: () => void
  toggleMemoization: () => void
  togglePerformanceMonitoring: () => void
  setPerformanceThreshold: (threshold: number) => void
  getMetricsForComponent: (name: string) => MemoizationMetric | null
  getTopProblematicComponents: () => MemoizationMetric[]
  exportMetrics: () => Record<string, any>
  resetBenchmarks: () => void
}

const MemoizationContext = createContext<MemoizationContext | undefined>(undefined)

export function MemoizationProvider({ children }: { children: React.ReactNode }) {
  const [metrics, setMetrics] = useState<MemoizationMetric[]>([])
  const [isEnabled, setIsEnabled] = useState(false)
  const [enableMemoization, setEnableMemoization] = useState(true)
  const [enablePerformanceMonitoring, setEnablePerformanceMonitoring] = useState(true)
  const [performanceThreshold, setPerformanceThreshold] = useState(16)

  const clearMetrics = useCallback(() => {
    setMetrics([])
  }, [])

  const enableTracking = useCallback(() => {
    setIsEnabled(true)
  }, [])

  const disableTracking = useCallback(() => {
    setIsEnabled(false)
  }, [])

  const getMetricsForComponent = useCallback((name: string) => {
    return metrics.find(m => m.componentName === name) || null
  }, [metrics])

  const getTopProblematicComponents = useCallback(() => {
    return metrics
      .filter(m => m.performanceGrade === 'D' || m.performanceGrade === 'F')
      .sort((a, b) => b.avgRenderTime - a.avgRenderTime)
      .slice(0, 5)
  }, [metrics])

  const exportMetrics = useCallback(() => {
    return {
      timestamp: Date.now(),
      metrics,
      summary: {
        total: metrics.length,
        problematic: metrics.filter(m => m.performanceGrade === 'D' || m.performanceGrade === 'F').length
      }
    }
  }, [metrics])

  const resetBenchmarks = useCallback(() => {
    // Reset performance benchmarks
  }, [])

  const toggleMemoization = useCallback(() => {
    setEnableMemoization(prev => !prev)
  }, [])

  const togglePerformanceMonitoring = useCallback(() => {
    setEnablePerformanceMonitoring(prev => !prev)
  }, [])

  const updatePerformanceThreshold = useCallback((threshold: number) => {
    setPerformanceThreshold(threshold)
  }, [])

  const contextValue: MemoizationContext = {
    metrics,
    isEnabled,
    performanceThreshold,
    memoryThreshold: 1024 * 1024,
    recommendations: [],
    totalComponents: metrics.length,
    problematicComponents: metrics.filter(m => m.performanceGrade === 'D' || m.performanceGrade === 'F').length,
    cacheStats: {
      hits: metrics.reduce((sum, m) => sum + m.memoHits, 0),
      misses: metrics.reduce((sum, m) => sum + m.memoMisses, 0),
      evictions: metrics.reduce((sum, m) => sum + m.memoEvictions, 0),
      size: metrics.reduce((sum, m) => sum + m.cacheSize, 0),
      maxSize: 1000,
      totalCacheEntries: metrics.length,
      totalFunctions: metrics.filter(m => m.componentName).length,
      averageCacheSize: metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.cacheSize, 0) / metrics.length : 0,
      cacheHitRate: (() => {
        const totalHits = metrics.reduce((sum, m) => sum + m.memoHits, 0)
        const totalMisses = metrics.reduce((sum, m) => sum + m.memoMisses, 0)
        const total = totalHits + totalMisses
        return total > 0 ? (totalHits / total) * 100 : 0
      })()
    },
    healthScore: metrics.length === 0 ? 100 : Math.round(
      (metrics.filter(m => m.performanceGrade === 'A' || m.performanceGrade === 'B').length / metrics.length) * 100
    ),
    enableMemoization,
    enablePerformanceMonitoring,
    clearMetrics,
    enableTracking,
    disableTracking,
    toggleMemoization,
    togglePerformanceMonitoring,
    setPerformanceThreshold: updatePerformanceThreshold,
    getMetricsForComponent,
    getTopProblematicComponents,
    exportMetrics,
    resetBenchmarks
  }

  return (
    <MemoizationContext.Provider value={contextValue}>
      {children}
    </MemoizationContext.Provider>
  )
}

export function useMemoizationContext() {
  const context = useContext(MemoizationContext)
  if (!context) {
    throw new Error('useMemoizationContext must be used within MemoizationProvider')
  }
  return context
}