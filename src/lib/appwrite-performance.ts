import { databases, users } from '@/lib/appwrite-admin';
import { Database, Query, Models } from 'appwrite';

interface QueryPerformanceMetric {
  operation: string;
  collection?: string;
  duration: number;
  resultCount?: number;
  queryType: 'list' | 'get' | 'create' | 'update' | 'delete';
  timestamp: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

class AppwritePerformanceMonitor {
  private metrics: QueryPerformanceMetric[] = [];
  private readonly BATCH_SIZE = 20;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.startPeriodicFlush();
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushMetrics();
    }, this.FLUSH_INTERVAL);
  }

  public async measureDatabaseOperation<T>(
    operation: string,
    collection: string,
    queryType: QueryPerformanceMetric['queryType'],
    operation_fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation_fn();
      const duration = performance.now() - startTime;
      
      let resultCount: number | undefined;
      
      // Extract result count based on result type
      if (result && typeof result === 'object') {
        if ('documents' in result && Array.isArray((result as any).documents)) {
          resultCount = (result as any).documents.length;
        } else if ('total' in result && typeof (result as any).total === 'number') {
          resultCount = (result as any).total;
        } else if (Array.isArray(result)) {
          resultCount = result.length;
        }
      }

      this.collectMetric({
        operation,
        collection,
        duration,
        resultCount,
        queryType,
        timestamp: Date.now(),
        success: true,
        metadata: {
          ...metadata,
          resultType: typeof result,
        }
      });

      return result;
    } catch (error: any) {
      const duration = performance.now() - startTime;
      
      this.collectMetric({
        operation,
        collection,
        duration,
        queryType,
        timestamp: Date.now(),
        success: false,
        error: error.message || 'Unknown error',
        metadata
      });

      throw error;
    }
  }

  private collectMetric(metric: QueryPerformanceMetric): void {
    this.metrics.push(metric);
    
    if (this.metrics.length >= this.BATCH_SIZE) {
      this.flushMetrics();
    }
  }

  private async flushMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    try {
      // Send to performance monitoring endpoint
      await fetch('/api/performance/appwrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: metricsToSend,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.warn('Failed to send Appwrite performance metrics:', error);
      // Re-add metrics for retry
      this.metrics.unshift(...metricsToSend);
    }
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushMetrics();
  }
}

// Global performance monitor instance
const appwritePerformanceMonitor = new AppwritePerformanceMonitor();

// Enhanced Appwrite client wrapper with performance monitoring
export class MonitoredAppwriteClient {
  constructor(private client: Database) {}

  async listDocuments(
    databaseId: string,
    collectionId: string,
    queries?: string[],
    operation = 'listDocuments'
  ) {
    return appwritePerformanceMonitor.measureDatabaseOperation(
      operation,
      collectionId,
      'list',
      () => this.client.listDocuments(databaseId, collectionId, queries),
      {
        databaseId,
        queryCount: queries?.length || 0,
        queries: queries?.slice(0, 3), // Log first 3 queries for debugging
      }
    );
  }

  async getDocument(
    databaseId: string,
    collectionId: string,
    documentId: string,
    operation = 'getDocument'
  ) {
    return appwritePerformanceMonitor.measureDatabaseOperation(
      operation,
      collectionId,
      'get',
      () => this.client.getDocument(databaseId, collectionId, documentId),
      {
        databaseId,
        documentId,
      }
    );
  }

  async createDocument(
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: object,
    permissions?: string[],
    operation = 'createDocument'
  ) {
    return appwritePerformanceMonitor.measureDatabaseOperation(
      operation,
      collectionId,
      'create',
      () => this.client.createDocument(databaseId, collectionId, documentId, data, permissions),
      {
        databaseId,
        documentId,
        dataSize: JSON.stringify(data).length,
        permissionCount: permissions?.length || 0,
      }
    );
  }

  async updateDocument(
    databaseId: string,
    collectionId: string,
    documentId: string,
    data?: object,
    permissions?: string[],
    operation = 'updateDocument'
  ) {
    return appwritePerformanceMonitor.measureDatabaseOperation(
      operation,
      collectionId,
      'update',
      () => this.client.updateDocument(databaseId, collectionId, documentId, data, permissions),
      {
        databaseId,
        documentId,
        dataSize: data ? JSON.stringify(data).length : 0,
        permissionCount: permissions?.length || 0,
      }
    );
  }

  async deleteDocument(
    databaseId: string,
    collectionId: string,
    documentId: string,
    operation = 'deleteDocument'
  ) {
    return appwritePerformanceMonitor.measureDatabaseOperation(
      operation,
      collectionId,
      'delete',
      () => this.client.deleteDocument(databaseId, collectionId, documentId),
      {
        databaseId,
        documentId,
      }
    );
  }
}

// Create monitored database client
export const monitoredDatabases = new MonitoredAppwriteClient(databases);

// Specialized monitoring functions for common TennisScore operations
export async function measureMatchStatistics<T>(
  matchId: string,
  operation: () => Promise<T>
): Promise<T> {
  return appwritePerformanceMonitor.measureDatabaseOperation(
    'calculateMatchStatistics',
    'matches',
    'get',
    operation,
    {
      matchId,
      operationType: 'statistics_calculation',
    }
  );
}

export async function measurePlayerQueries<T>(
  operation: string,
  operation_fn: () => Promise<T>,
  playerId?: string
): Promise<T> {
  return appwritePerformanceMonitor.measureDatabaseOperation(
    operation,
    'players',
    'list',
    operation_fn,
    {
      playerId,
      operationType: 'player_query',
    }
  );
}

export async function measureRealTimeSubscription<T>(
  subscriptionType: string,
  operation_fn: () => Promise<T>
): Promise<T> {
  return appwritePerformanceMonitor.measureDatabaseOperation(
    `realtime_${subscriptionType}`,
    'subscriptions',
    'list',
    operation_fn,
    {
      subscriptionType,
      operationType: 'realtime_subscription',
    }
  );
}

// Query optimization helper with performance insights
export class QueryOptimizer {
  private static performanceThresholds = {
    list: 500, // 500ms for list operations
    get: 200,  // 200ms for get operations
    create: 300, // 300ms for create operations
    update: 300, // 300ms for update operations
    delete: 200, // 200ms for delete operations
  };

  static analyzeQueryPerformance(metrics: QueryPerformanceMetric[]): {
    slowQueries: QueryPerformanceMetric[];
    averageByType: Record<string, number>;
    recommendations: string[];
  } {
    const slowQueries = metrics.filter(
      metric => metric.duration > (this.performanceThresholds[metric.queryType] || 500)
    );

    const averageByType = metrics.reduce((acc, metric) => {
      const key = `${metric.collection}_${metric.queryType}`;
      if (!acc[key]) {
        acc[key] = { total: 0, count: 0 };
      }
      acc[key].total += metric.duration;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const averageResults = Object.entries(averageByType).reduce((acc, [key, value]) => {
      acc[key] = value.total / value.count;
      return acc;
    }, {} as Record<string, number>);

    const recommendations = this.generateRecommendations(slowQueries, averageResults);

    return {
      slowQueries,
      averageByType: averageResults,
      recommendations,
    };
  }

  private static generateRecommendations(
    slowQueries: QueryPerformanceMetric[],
    averages: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    // Check for frequently slow operations
    const operationCounts = slowQueries.reduce((acc, query) => {
      const key = `${query.collection}_${query.operation}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(operationCounts).forEach(([operation, count]) => {
      if (count > 5) {
        recommendations.push(`Consider optimizing "${operation}" - ${count} slow queries detected`);
      }
    });

    // Check for operations with high result counts but long duration
    slowQueries.forEach(query => {
      if (query.resultCount && query.resultCount > 100 && query.duration > 1000) {
        recommendations.push(
          `Large result set in ${query.collection}.${query.operation} (${query.resultCount} results in ${query.duration}ms) - consider pagination`
        );
      }
    });

    // Check for operations that should be cached
    Object.entries(averages).forEach(([operation, avgDuration]) => {
      if (avgDuration > 1000 && operation.includes('list')) {
        recommendations.push(`Consider caching for "${operation}" (avg: ${avgDuration.toFixed(0)}ms)`);
      }
    });

    return recommendations;
  }
}

export { appwritePerformanceMonitor };