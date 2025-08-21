/**
 * Advanced Query Optimization Utilities
 * Provides comprehensive query optimization features including:
 * - Query deduplication
 * - Intelligent pagination
 * - Query caching and invalidation
 * - Performance monitoring
 * - Batch operations
 */

import { logger } from './logger'

export interface QueryConfig {
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
  includes?: string[]
  excludes?: string[]
  cacheKey?: string
  cacheTTL?: number
  enableDeduplication?: boolean
  enableBatching?: boolean
  batchSize?: number
  priority?: 'high' | 'normal' | 'low'
}

export interface QueryResult<T> {
  data: T[]
  total: number
  hasMore: boolean
  nextOffset?: number
  previousOffset?: number
  pageSize: number
  currentPage: number
  totalPages: number
  executionTime: number
  cacheHit: boolean
  queryId: string
}

export interface QueryMetrics {
  queryId: string
  executionTime: number
  cacheHit: boolean
  resultCount: number
  filters: Record<string, any>
  timestamp: number
  deduplicationSavings: number
  batchOptimization: boolean
}

export interface BatchQuery {
  id: string
  query: () => Promise<any>
  config: QueryConfig
  resolve: (result: any) => void
  reject: (error: any) => void
  timestamp: number
  priority: 'high' | 'normal' | 'low'
}

// Global query management
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()
const queryMetrics = new Map<string, QueryMetrics>()
const activeQueries = new Map<string, Promise<any>>()
const queryBatch = new Map<string, BatchQuery[]>()
const batchTimer = new Map<string, ReturnType<typeof setTimeout>>()

export class QueryOptimizer {
  private maxCacheSize = 1000
  private defaultCacheTTL = 5 * 60 * 1000 // 5 minutes
  private batchDelay = 100 // 100ms batch window
  private maxBatchSize = 10
  private performanceThreshold = 1000 // 1 second

  constructor(config?: {
    maxCacheSize?: number
    defaultCacheTTL?: number
    batchDelay?: number
    maxBatchSize?: number
    performanceThreshold?: number
  }) {
    if (config) {
      this.maxCacheSize = config.maxCacheSize || this.maxCacheSize
      this.defaultCacheTTL = config.defaultCacheTTL || this.defaultCacheTTL
      this.batchDelay = config.batchDelay || this.batchDelay
      this.maxBatchSize = config.maxBatchSize || this.maxBatchSize
      this.performanceThreshold = config.performanceThreshold || this.performanceThreshold
    }
  }

  /**
   * Execute optimized query with deduplication and caching
   */
  async executeQuery<T>(
    queryFn: () => Promise<T[]>,
    config: QueryConfig = {}
  ): Promise<QueryResult<T>> {
    const startTime = performance.now()
    const queryId = this.generateQueryId(queryFn.toString(), config)
    
    // Check cache first
    const cacheResult = this.getCachedResult<T>(queryId)
    if (cacheResult) {
      return cacheResult
    }

    // Check for duplicate active queries
    if (config.enableDeduplication !== false) {
      const activeQuery = activeQueries.get(queryId)
      if (activeQuery) {
        logger.debug('Query deduplicated', { queryId })
        const result = await activeQuery
        return this.formatResult(result, config, startTime, true, queryId)
      }
    }

    // Execute query
    const queryPromise = config.enableBatching 
      ? this.executeBatchedQuery(queryFn, config, queryId)
      : queryFn()

    // Store active query for deduplication
    activeQueries.set(queryId, queryPromise)

    try {
      const rawResult = await queryPromise
      const result = this.formatResult(rawResult, config, startTime, false, queryId)
      
      // Cache result
      this.cacheResult(queryId, result, config)
      
      // Record metrics
      this.recordQueryMetrics(queryId, result, config)
      
      return result
    } catch (error) {
      logger.error('Query execution failed', { queryId, error })
      throw error
    } finally {
      activeQueries.delete(queryId)
    }
  }

  /**
   * Execute paginated query with optimizations
   */
  async executePaginatedQuery<T>(
    queryFn: (offset: number, limit: number) => Promise<T[]>,
    totalCountFn: () => Promise<number>,
    config: QueryConfig = {}
  ): Promise<QueryResult<T>> {
    const { limit = 20, offset = 0 } = config
    const startTime = performance.now()
    const queryId = this.generateQueryId(`paginated-${queryFn.toString()}`, config)

    // Check cache first
    const cacheResult = this.getCachedResult<T>(queryId)
    if (cacheResult) {
      return cacheResult
    }

    // Optimize pagination by batching total count with data query
    const [data, total] = await Promise.all([
      queryFn(offset, limit),
      totalCountFn()
    ])

    const result = this.formatPaginatedResult(
      data, 
      total, 
      config, 
      startTime, 
      false, 
      queryId
    )

    // Cache result
    this.cacheResult(queryId, result, config)

    // Record metrics
    this.recordQueryMetrics(queryId, result, config)

    return result
  }

  /**
   * Execute batch query operations
   */
  private async executeBatchedQuery<T>(
    queryFn: () => Promise<T[]>,
    config: QueryConfig,
    queryId: string
  ): Promise<T[]> {
    const batchKey = this.generateBatchKey(config)
    
    return new Promise((resolve, reject) => {
      const batch = queryBatch.get(batchKey) || []
      
      batch.push({
        id: queryId,
        query: queryFn,
        config,
        resolve,
        reject,
        timestamp: Date.now(),
        priority: config.priority || 'normal'
      })

      queryBatch.set(batchKey, batch)

      // Clear existing timer
      if (batchTimer.has(batchKey)) {
        clearTimeout(batchTimer.get(batchKey)!)
      }

      // Set new timer or execute immediately if batch is full
      if (batch.length >= this.maxBatchSize) {
        this.executeBatch(batchKey)
      } else {
        const timer = setTimeout(() => {
          this.executeBatch(batchKey)
        }, this.batchDelay)
        
        batchTimer.set(batchKey, timer)
      }
    })
  }

  /**
   * Execute batched queries
   */
  private async executeBatch(batchKey: string): Promise<void> {
    const batch = queryBatch.get(batchKey)
    if (!batch || batch.length === 0) return

    // Clear batch and timer
    queryBatch.delete(batchKey)
    batchTimer.delete(batchKey)

    // Sort by priority
    batch.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    // Execute all queries in parallel
    const results = await Promise.allSettled(
      batch.map(item => item.query())
    )

    // Resolve or reject each query
    results.forEach((result, index) => {
      const batchItem = batch[index]
      if (result.status === 'fulfilled') {
        batchItem.resolve(result.value)
      } else {
        batchItem.reject(result.reason)
      }
    })

    logger.debug('Batch executed', {
      batchKey,
      queryCount: batch.length,
      successCount: results.filter(r => r.status === 'fulfilled').length
    })
  }

  /**
   * Generate unique query ID
   */
  private generateQueryId(queryString: string, config: QueryConfig): string {
    const configHash = JSON.stringify({
      ...config,
      cacheTTL: undefined, // Exclude TTL from hash
      enableDeduplication: undefined,
      enableBatching: undefined
    })
    
    return `query-${this.hashString(queryString + configHash)}`
  }

  /**
   * Generate batch key for grouping similar queries
   */
  private generateBatchKey(config: QueryConfig): string {
    return `batch-${this.hashString(JSON.stringify({
      sortBy: config.sortBy,
      sortOrder: config.sortOrder,
      filters: config.filters
    }))}`
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Get cached result
   */
  private getCachedResult<T>(queryId: string): QueryResult<T> | null {
    const cached = queryCache.get(queryId)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > cached.ttl) {
      queryCache.delete(queryId)
      return null
    }

    logger.debug('Cache hit', { queryId })
    return {
      ...cached.data,
      cacheHit: true,
      executionTime: 0
    }
  }

  /**
   * Cache query result
   */
  private cacheResult<T>(queryId: string, result: QueryResult<T>, config: QueryConfig): void {
    const ttl = config.cacheTTL || this.defaultCacheTTL
    
    // Clean cache if it's getting too large
    if (queryCache.size >= this.maxCacheSize) {
      this.cleanCache()
    }

    queryCache.set(queryId, {
      data: result,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Clean old cache entries
   */
  private cleanCache(): void {
    const now = Date.now()
    let cleanedCount = 0
    
    for (const [key, value] of queryCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        queryCache.delete(key)
        cleanedCount++
      }
    }

    // If still too large, remove oldest entries
    if (queryCache.size >= this.maxCacheSize) {
      const entries = Array.from(queryCache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toRemove = entries.slice(0, Math.floor(this.maxCacheSize * 0.3))
      toRemove.forEach(([key]) => queryCache.delete(key))
      cleanedCount += toRemove.length
    }

    logger.debug('Cache cleaned', { cleanedCount, cacheSize: queryCache.size })
  }

  /**
   * Format query result
   */
  private formatResult<T>(
    data: T[],
    config: QueryConfig,
    startTime: number,
    cacheHit: boolean,
    queryId: string
  ): QueryResult<T> {
    const executionTime = performance.now() - startTime
    const { limit = 20, offset = 0 } = config
    
    return {
      data,
      total: data.length,
      hasMore: data.length === limit,
      nextOffset: data.length === limit ? offset + limit : undefined,
      previousOffset: offset > 0 ? Math.max(0, offset - limit) : undefined,
      pageSize: limit,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(data.length / limit),
      executionTime,
      cacheHit,
      queryId
    }
  }

  /**
   * Format paginated result
   */
  private formatPaginatedResult<T>(
    data: T[],
    total: number,
    config: QueryConfig,
    startTime: number,
    cacheHit: boolean,
    queryId: string
  ): QueryResult<T> {
    const executionTime = performance.now() - startTime
    const { limit = 20, offset = 0 } = config
    
    return {
      data,
      total,
      hasMore: offset + data.length < total,
      nextOffset: offset + data.length < total ? offset + limit : undefined,
      previousOffset: offset > 0 ? Math.max(0, offset - limit) : undefined,
      pageSize: limit,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit),
      executionTime,
      cacheHit,
      queryId
    }
  }

  /**
   * Record query metrics
   */
  private recordQueryMetrics<T>(
    queryId: string,
    result: QueryResult<T>,
    config: QueryConfig
  ): void {
    const metrics: QueryMetrics = {
      queryId,
      executionTime: result.executionTime,
      cacheHit: result.cacheHit,
      resultCount: result.data.length,
      filters: config.filters || {},
      timestamp: Date.now(),
      deduplicationSavings: activeQueries.has(queryId) ? 1 : 0,
      batchOptimization: config.enableBatching || false
    }

    queryMetrics.set(queryId, metrics)

    // Keep only last 100 metrics
    if (queryMetrics.size > 100) {
      const entries = Array.from(queryMetrics.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      const toRemove = entries.slice(0, 10)
      toRemove.forEach(([key]) => queryMetrics.delete(key))
    }

    // Log slow queries
    if (result.executionTime > this.performanceThreshold) {
      logger.warn('Slow query detected', {
        queryId,
        executionTime: result.executionTime,
        resultCount: result.data.length,
        config
      })
    }
  }

  /**
   * Get query metrics
   */
  getQueryMetrics(): QueryMetrics[] {
    return Array.from(queryMetrics.values())
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number
    maxSize: number
    hitRate: number
    totalQueries: number
    avgExecutionTime: number
  } {
    const metrics = this.getQueryMetrics()
    const totalQueries = metrics.length
    const cacheHits = metrics.filter(m => m.cacheHit).length
    const avgExecutionTime = metrics.length > 0 
      ? metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length
      : 0

    return {
      size: queryCache.size,
      maxSize: this.maxCacheSize,
      hitRate: totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 0,
      totalQueries,
      avgExecutionTime
    }
  }

  /**
   * Invalidate cache entries
   */
  invalidateCache(pattern?: string): void {
    if (!pattern) {
      queryCache.clear()
      logger.debug('All cache entries cleared')
      return
    }

    let invalidatedCount = 0
    for (const key of queryCache.keys()) {
      if (key.includes(pattern)) {
        queryCache.delete(key)
        invalidatedCount++
      }
    }

    logger.debug('Cache invalidated', { pattern, invalidatedCount })
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = []
    const metrics = this.getQueryMetrics()
    const cacheStats = this.getCacheStats()

    // Check cache hit rate
    if (cacheStats.hitRate < 50) {
      recommendations.push('Low cache hit rate. Consider increasing cache TTL or improving query patterns.')
    }

    // Check slow queries
    const slowQueries = metrics.filter(m => m.executionTime > this.performanceThreshold)
    if (slowQueries.length > 0) {
      recommendations.push(`${slowQueries.length} slow queries detected. Consider optimizing filters or using pagination.`)
    }

    // Check batch optimization usage
    const batchOptimizedQueries = metrics.filter(m => m.batchOptimization)
    if (batchOptimizedQueries.length < metrics.length * 0.3) {
      recommendations.push('Consider enabling batch optimization for better performance.')
    }

    // Check deduplication savings
    const deduplicationSavings = metrics.reduce((sum, m) => sum + m.deduplicationSavings, 0)
    if (deduplicationSavings > 0) {
      recommendations.push(`Query deduplication saved ${deduplicationSavings} redundant queries.`)
    }

    return recommendations
  }

  /**
   * Clear all data
   */
  clear(): void {
    queryCache.clear()
    queryMetrics.clear()
    activeQueries.clear()
    queryBatch.clear()
    batchTimer.forEach(timer => clearTimeout(timer))
    batchTimer.clear()
  }
}

// Global optimizer instance
const globalOptimizer = new QueryOptimizer()

/**
 * Execute optimized query
 */
export const executeOptimizedQuery = <T>(
  queryFn: () => Promise<T[]>,
  config: QueryConfig = {}
): Promise<QueryResult<T>> => {
  return globalOptimizer.executeQuery(queryFn, config)
}

/**
 * Execute optimized paginated query
 */
export const executeOptimizedPaginatedQuery = <T>(
  queryFn: (offset: number, limit: number) => Promise<T[]>,
  totalCountFn: () => Promise<number>,
  config: QueryConfig = {}
): Promise<QueryResult<T>> => {
  return globalOptimizer.executePaginatedQuery(queryFn, totalCountFn, config)
}

/**
 * Get query metrics
 */
export const getQueryMetrics = (): QueryMetrics[] => {
  return globalOptimizer.getQueryMetrics()
}

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return globalOptimizer.getCacheStats()
}

/**
 * Invalidate cache
 */
export const invalidateQueryCache = (pattern?: string): void => {
  globalOptimizer.invalidateCache(pattern)
}

/**
 * Get optimization recommendations
 */
export const getQueryOptimizationRecommendations = (): string[] => {
  return globalOptimizer.getOptimizationRecommendations()
}

/**
 * Clear all query data
 */
export const clearQueryData = (): void => {
  globalOptimizer.clear()
}

export default globalOptimizer