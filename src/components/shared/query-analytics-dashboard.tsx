/**
 * Query Analytics Dashboard
 * Provides comprehensive query performance monitoring and optimization insights
 */

'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter
} from 'recharts'
import { 
  Activity,
  Clock,
  Database,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Zap,
  AlertTriangle
} from 'lucide-react'
import { useQueryAnalytics } from '@/hooks/use-optimized-query'
import { invalidateQueryCache } from '@/lib/utils/query-optimization'
import { logger } from '@/lib/utils/logger'

interface QueryAnalyticsDashboardProps {
  enableRealTime?: boolean
  enableExport?: boolean
  showAdvanced?: boolean
  refreshInterval?: number
}

export const QueryAnalyticsDashboard: React.FC<QueryAnalyticsDashboardProps> = ({
  showAdvanced = true
}) => {
  // Temporarily disable unused props to fix lint errors
  // const enableRealTime = true
  // const enableExport = true
  // const refreshInterval = 10000
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'slow' | 'cached' | 'failed'>('all')
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('1h')
  
  const { metrics, cacheStats, recommendations, updateAnalytics } = useQueryAnalytics()

  // Filter metrics based on selected filter
  const filteredMetrics = useMemo(() => {
    const now = Date.now()
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    }[timeRange]

    const timeFiltered = metrics.filter(m => 
      now - m.timestamp < timeRangeMs
    )

    switch (filterType) {
      case 'slow':
        return timeFiltered.filter(m => m.executionTime > 1000)
      case 'cached':
        return timeFiltered.filter(m => m.cacheHit)
      case 'failed':
        return timeFiltered.filter(m => m.executionTime === 0) // Failed queries
      default:
        return timeFiltered
    }
  }, [metrics, filterType, timeRange])

  // Calculate performance metrics
  const performanceStats = useMemo(() => {
    if (filteredMetrics.length === 0) {
      return {
        avgExecutionTime: 0,
        slowQueryCount: 0,
        cacheHitRate: 0,
        totalQueries: 0,
        deduplicationSavings: 0
      }
    }

    const totalExecutionTime = filteredMetrics.reduce((sum, m) => sum + m.executionTime, 0)
    const cacheHits = filteredMetrics.filter(m => m.cacheHit).length
    const slowQueries = filteredMetrics.filter(m => m.executionTime > 1000).length
    const deduplicationSavings = filteredMetrics.reduce((sum, m) => sum + m.deduplicationSavings, 0)

    return {
      avgExecutionTime: totalExecutionTime / filteredMetrics.length,
      slowQueryCount: slowQueries,
      cacheHitRate: (cacheHits / filteredMetrics.length) * 100,
      totalQueries: filteredMetrics.length,
      deduplicationSavings
    }
  }, [filteredMetrics])

  // Chart data for execution time over time
  const executionTimeData = useMemo(() => {
    return filteredMetrics
      .slice(-50) // Last 50 queries
      .map((metric, index) => ({
        index,
        time: new Date(metric.timestamp).toLocaleTimeString(),
        executionTime: metric.executionTime,
        cacheHit: metric.cacheHit ? 1 : 0,
        resultCount: metric.resultCount
      }))
  }, [filteredMetrics])

  // Query distribution data
  const queryDistributionData = useMemo(() => {
    const distribution = filteredMetrics.reduce((acc, metric) => {
      const bucket = metric.executionTime < 100 ? 'Fast (<100ms)' :
                    metric.executionTime < 500 ? 'Medium (100-500ms)' :
                    metric.executionTime < 1000 ? 'Slow (500ms-1s)' :
                    'Very Slow (>1s)'
      
      acc[bucket] = (acc[bucket] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value
    }))
  }, [filteredMetrics])

  // Cache performance data
  const cachePerformanceData = useMemo(() => {
    const cacheHits = filteredMetrics.filter(m => m.cacheHit).length
    const cacheMisses = filteredMetrics.length - cacheHits

    return [
      { name: 'Cache Hits', value: cacheHits },
      { name: 'Cache Misses', value: cacheMisses }
    ]
  }, [filteredMetrics])

  // Export analytics data
  const exportAnalytics = () => {
    const data = {
      timestamp: new Date().toISOString(),
      timeRange,
      filterType,
      metrics: filteredMetrics,
      cacheStats,
      performanceStats,
      recommendations
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `query-analytics-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    logger.info('Query analytics exported')
  }

  // Clear cache
  const clearCache = () => {
    invalidateQueryCache()
    updateAnalytics()
    logger.info('Query cache cleared')
  }

  // Format time
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  // Format number
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Query Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Performance monitoring and optimization insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={updateAnalytics}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearCache}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Clear Cache
          </Button>
          {enableExport && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportAnalytics}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filter:</span>
          <div className="flex gap-1">
            {(['all', 'slow', 'cached', 'failed'] as const).map((type) => (
              <Button
                key={type}
                variant={filterType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Time Range:</span>
          <div className="flex gap-1">
            {(['1h', '24h', '7d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(performanceStats.totalQueries)}</div>
            <p className="text-xs text-muted-foreground">
              {timeRange} time range
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(performanceStats.avgExecutionTime)}</div>
            <p className="text-xs text-muted-foreground">
              {performanceStats.slowQueryCount} slow queries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceStats.cacheHitRate.toFixed(1)}%</div>
            <Progress value={performanceStats.cacheHitRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Size</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats?.size || 0}</div>
            <p className="text-xs text-muted-foreground">
              / {cacheStats?.maxSize || 0} max
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deduplication</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceStats.deduplicationSavings}</div>
            <p className="text-xs text-muted-foreground">
              queries saved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Optimization Recommendations:</strong>
            <ul className="mt-2 space-y-1">
              {recommendations.map((rec, index) => (
                <li key={index} className="text-sm">• {rec}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="queries">Queries</TabsTrigger>
          {showAdvanced && <TabsTrigger value="advanced">Advanced</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Execution Time Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Query Execution Time Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={executionTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="executionTime" 
                      stroke="#8884d8" 
                      name="Execution Time (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Query Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Query Performance Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={queryDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {queryDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cache Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Cache Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={cachePerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Scatter Plot</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={executionTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="resultCount" name="Result Count" />
                  <YAxis dataKey="executionTime" name="Execution Time (ms)" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Queries" data={executionTimeData} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cache Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Cache Size:</span>
                  <span className="font-mono">{cacheStats?.size || 0} / {cacheStats?.maxSize || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Hit Rate:</span>
                  <span className="font-mono">{(cacheStats?.hitRate || 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Queries:</span>
                  <span className="font-mono">{cacheStats?.totalQueries || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Avg Execution Time:</span>
                  <span className="font-mono">{formatTime(cacheStats?.avgExecutionTime || 0)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Hit Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={executionTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="cacheHit" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      name="Cache Hit"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredMetrics.slice(-20).reverse().map((metric, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => setSelectedMetric(selectedMetric === metric.queryId ? null : metric.queryId)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        metric.executionTime > 1000 ? 'bg-red-500' :
                        metric.executionTime > 500 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium">{metric.queryId}</p>
                        <p className="text-sm text-muted-foreground">
                          {metric.resultCount} results
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {metric.cacheHit && (
                        <Badge variant="secondary" className="text-xs">
                          Cached
                        </Badge>
                      )}
                      {metric.batchOptimization && (
                        <Badge variant="outline" className="text-xs">
                          Batched
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {formatTime(metric.executionTime)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {showAdvanced && (
          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Query Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Performance Thresholds</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Fast Queries (&lt;100ms):</span>
                        <span className="font-mono text-green-600">
                          {filteredMetrics.filter(m => m.executionTime < 100).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medium Queries (100-500ms):</span>
                        <span className="font-mono text-yellow-600">
                          {filteredMetrics.filter(m => m.executionTime >= 100 && m.executionTime < 500).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Slow Queries (500ms-1s):</span>
                        <span className="font-mono text-orange-600">
                          {filteredMetrics.filter(m => m.executionTime >= 500 && m.executionTime < 1000).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Very Slow Queries (&gt;1s):</span>
                        <span className="font-mono text-red-600">
                          {filteredMetrics.filter(m => m.executionTime >= 1000).length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Optimization Impact</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Cache Hits:</span>
                        <span className="font-mono text-green-600">
                          {filteredMetrics.filter(m => m.cacheHit).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Deduplication Savings:</span>
                        <span className="font-mono text-blue-600">
                          {performanceStats.deduplicationSavings}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Batch Optimized:</span>
                        <span className="font-mono text-purple-600">
                          {filteredMetrics.filter(m => m.batchOptimization).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export default QueryAnalyticsDashboard