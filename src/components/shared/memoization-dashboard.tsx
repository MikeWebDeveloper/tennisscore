/**
 * Memoization Dashboard
 * Provides comprehensive memoization performance monitoring and optimization insights
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
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  Cpu
} from 'lucide-react'
import { useMemoizationContext } from '@/components/providers/memoization-provider'
import { clearMemoizationData } from '@/lib/utils/memoization'
import { logger } from '@/lib/utils/logger'

interface MemoizationDashboardProps {
  enableRealTime?: boolean
  enableExport?: boolean
  showAdvanced?: boolean
  refreshInterval?: number
}

export const MemoizationDashboard: React.FC<MemoizationDashboardProps> = ({
  showAdvanced = true
}) => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'slow' | 'efficient' | 'problematic'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'hitRate' | 'renderTime' | 'renderCount'>('hitRate')
  
  const {
    metrics,
    cacheStats,
    recommendations,
    healthScore,
    enableMemoization,
    enablePerformanceMonitoring,
    performanceThreshold,
    toggleMemoization,
    togglePerformanceMonitoring,
    setPerformanceThreshold
  } = useMemoizationContext()

  // Filter and sort metrics
  const filteredMetrics = useMemo(() => {
    let filtered = metrics

    // Apply filters
    switch (filterType) {
      case 'slow':
        filtered = metrics.filter(m => m.avgRenderTime > performanceThreshold)
        break
      case 'efficient':
        filtered = metrics.filter(m => {
          const totalComparisons = m.memoHits + m.memoMisses
          return totalComparisons > 5 && (m.memoHits / totalComparisons) > 0.8
        })
        break
      case 'problematic':
        filtered = metrics.filter(m => {
          const totalComparisons = m.memoHits + m.memoMisses
          return totalComparisons > 10 && (m.memoHits / totalComparisons) < 0.5
        })
        break
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.componentName.localeCompare(b.componentName)
        case 'hitRate':
          const aHitRate = a.memoHits / (a.memoHits + a.memoMisses) || 0
          const bHitRate = b.memoHits / (b.memoHits + b.memoMisses) || 0
          return bHitRate - aHitRate
        case 'renderTime':
          return b.avgRenderTime - a.avgRenderTime
        case 'renderCount':
          return b.renderCount - a.renderCount
        default:
          return 0
      }
    })
  }, [metrics, filterType, sortBy, performanceThreshold])

  // Performance insights
  const performanceInsights = useMemo(() => {
    if (metrics.length === 0) {
      return {
        totalComponents: 0,
        avgHitRate: 0,
        avgRenderTime: 0,
        slowComponents: 0,
        efficientComponents: 0,
        totalRenders: 0
      }
    }

    const totalRenders = metrics.reduce((sum, m) => sum + m.renderCount, 0)
    const totalHits = metrics.reduce((sum, m) => sum + m.memoHits, 0)
    const totalMisses = metrics.reduce((sum, m) => sum + m.memoMisses, 0)
    const totalRenderTime = metrics.reduce((sum, m) => sum + (m.avgRenderTime * m.renderCount), 0)
    
    const avgHitRate = totalHits + totalMisses > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 0
    const avgRenderTime = totalRenders > 0 ? totalRenderTime / totalRenders : 0
    const slowComponents = metrics.filter(m => m.avgRenderTime > performanceThreshold).length
    const efficientComponents = metrics.filter(m => {
      const hitRate = m.memoHits / (m.memoHits + m.memoMisses) || 0
      return hitRate > 0.8 && m.renderCount > 5
    }).length

    return {
      totalComponents: metrics.length,
      avgHitRate,
      avgRenderTime,
      slowComponents,
      efficientComponents,
      totalRenders
    }
  }, [metrics, performanceThreshold])

  // Chart data
  const hitRateData = useMemo(() => {
    return filteredMetrics.map(metric => {
      const hitRate = metric.memoHits / (metric.memoHits + metric.memoMisses) || 0
      return {
        name: metric.componentName.length > 15 
          ? metric.componentName.substring(0, 15) + '...' 
          : metric.componentName,
        hitRate: hitRate * 100,
        renderTime: metric.avgRenderTime,
        renderCount: metric.renderCount
      }
    }).slice(0, 10) // Top 10 components
  }, [filteredMetrics])

  const renderTimeDistribution = useMemo(() => {
    const buckets = {
      'Fast (≤8ms)': 0,
      'Good (8-16ms)': 0,
      'Slow (16-32ms)': 0,
      'Very Slow (>32ms)': 0
    }

    metrics.forEach(metric => {
      if (metric.avgRenderTime <= 8) buckets['Fast (≤8ms)']++
      else if (metric.avgRenderTime <= 16) buckets['Good (8-16ms)']++
      else if (metric.avgRenderTime <= 32) buckets['Slow (16-32ms)']++
      else buckets['Very Slow (>32ms)']++
    })

    return Object.entries(buckets).map(([name, value]) => ({ name, value }))
  }, [metrics])

  const scatterData = useMemo(() => {
    return filteredMetrics.map(metric => ({
      x: metric.renderCount,
      y: metric.avgRenderTime,
      hitRate: metric.memoHits / (metric.memoHits + metric.memoMisses) || 0,
      name: metric.componentName
    }))
  }, [filteredMetrics])

  // Export analytics
  const exportAnalytics = () => {
    const data = {
      timestamp: new Date().toISOString(),
      healthScore,
      performanceInsights,
      metrics: filteredMetrics,
      cacheStats,
      recommendations,
      configuration: {
        enableMemoization,
        enablePerformanceMonitoring,
        performanceThreshold
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `memoization-analytics-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    logger.info('Memoization analytics exported')
  }

  // Clear all memoization data
  const clearData = () => {
    clearMemoizationData()
    logger.info('Memoization data cleared')
  }

  const formatTime = (ms: number): string => {
    return `${ms.toFixed(2)}ms`
  }

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Memoization Dashboard</h2>
          <p className="text-muted-foreground">
            Component memoization performance and optimization insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={enableMemoization ? 'default' : 'outline'}
            size="sm" 
            onClick={toggleMemoization}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            {enableMemoization ? 'Enabled' : 'Disabled'}
          </Button>
          <Button 
            variant={enablePerformanceMonitoring ? 'default' : 'outline'}
            size="sm" 
            onClick={togglePerformanceMonitoring}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Monitoring
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Clear Data
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

      {/* Health Score Alert */}
      {healthScore < 70 && (
        <Alert variant={healthScore < 50 ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Performance Alert:</strong> Memoization health score is {healthScore}%. 
            {recommendations.length > 0 && (
              <span> Consider: {recommendations[0]}</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filter:</span>
          <div className="flex gap-1">
            {(['all', 'slow', 'efficient', 'problematic'] as const).map((type) => (
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
          <BarChart3 className="h-4 w-4" />
          <span className="text-sm font-medium">Sort by:</span>
          <div className="flex gap-1">
            {(['name', 'hitRate', 'renderTime', 'renderCount'] as const).map((sort) => (
              <Button
                key={sort}
                variant={sortBy === sort ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy(sort)}
              >
                {sort === 'hitRate' ? 'Hit Rate' :
                 sort === 'renderTime' ? 'Render Time' :
                 sort === 'renderCount' ? 'Renders' :
                 'Name'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthScore}%</div>
            <Progress value={healthScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Components</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceInsights.totalComponents}</div>
            <p className="text-xs text-muted-foreground">
              {performanceInsights.efficientComponents} efficient
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Hit Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceInsights.avgHitRate.toFixed(1)}%</div>
            <Progress value={performanceInsights.avgHitRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Render Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(performanceInsights.avgRenderTime)}</div>
            <p className="text-xs text-muted-foreground">
              {performanceInsights.slowComponents} slow
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Renders</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceInsights.totalRenders}</div>
            <p className="text-xs text-muted-foreground">
              across all components
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Size</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats.totalCacheEntries}</div>
            <p className="text-xs text-muted-foreground">
              {cacheStats.totalFunctions} functions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Optimization Recommendations:</strong>
            <ul className="mt-2 space-y-1">
              {recommendations.slice(0, 3).map((rec, index) => (
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
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          {showAdvanced && <TabsTrigger value="advanced">Advanced</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Hit Rate Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Component Hit Rate Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hitRateData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hitRate" fill="#8884d8" name="Hit Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Render Time Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Render Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={renderTimeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {renderTimeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Scatter */}
            <Card>
              <CardHeader>
                <CardTitle>Performance vs Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart data={scatterData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" name="Render Count" />
                    <YAxis dataKey="y" name="Avg Render Time (ms)" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Components" data={scatterData} fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Component Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredMetrics.map((metric, index) => {
                  const hitRate = metric.memoHits / (metric.memoHits + metric.memoMisses) || 0
                  const isSelected = selectedComponent === metric.componentName
                  
                  return (
                    <div 
                      key={index} 
                      className={`p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedComponent(isSelected ? null : metric.componentName)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            hitRate > 0.8 ? 'bg-green-500' :
                            hitRate > 0.5 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`} />
                          <div>
                            <p className="font-medium">{metric.componentName}</p>
                            <p className="text-sm text-muted-foreground">
                              {metric.renderCount} renders • {formatTime(metric.avgRenderTime)} avg
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={hitRate > 0.8 ? 'default' : hitRate > 0.5 ? 'secondary' : 'destructive'}>
                            {(hitRate * 100).toFixed(1)}% hit rate
                          </Badge>
                          {metric.slowComparisons > 5 && (
                            <Badge variant="outline" className="text-orange-600">
                              Slow comparisons
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Memo Hits:</span>
                            <p className="font-mono">{metric.memoHits}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Memo Misses:</span>
                            <p className="font-mono">{metric.memoMisses}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Render:</span>
                            <p className="font-mono">{formatTime(metric.lastRenderTime)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Slow Comparisons:</span>
                            <p className="font-mono">{metric.slowComparisons}</p>
                          </div>
                          {metric.propsChanged.length > 0 && (
                            <div className="col-span-full">
                              <span className="text-muted-foreground">Last Changed Props:</span>
                              <p className="font-mono text-xs">{metric.propsChanged.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Thresholds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Current Threshold:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={performanceThreshold}
                      onChange={(e) => setPerformanceThreshold(Number(e.target.value))}
                      className="w-20"
                    />
                    <span className="font-mono w-12">{performanceThreshold}ms</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Fast Components (≤{performanceThreshold/2}ms):</span>
                    <span className="font-mono text-green-600">
                      {metrics.filter(m => m.avgRenderTime <= performanceThreshold/2).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Good Components (≤{performanceThreshold}ms):</span>
                    <span className="font-mono text-blue-600">
                      {metrics.filter(m => m.avgRenderTime <= performanceThreshold && m.avgRenderTime > performanceThreshold/2).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Slow Components (&gt;{performanceThreshold}ms):</span>
                    <span className="font-mono text-red-600">
                      {metrics.filter(m => m.avgRenderTime > performanceThreshold).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Memoization Efficiency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>High Efficiency ({'>'}80% hit rate):</span>
                    <span className="font-mono text-green-600">
                      {metrics.filter(m => {
                        const hitRate = m.memoHits / (m.memoHits + m.memoMisses) || 0
                        return hitRate > 0.8
                      }).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium Efficiency (50-80%):</span>
                    <span className="font-mono text-yellow-600">
                      {metrics.filter(m => {
                        const hitRate = m.memoHits / (m.memoHits + m.memoMisses) || 0
                        return hitRate > 0.5 && hitRate <= 0.8
                      }).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Low Efficiency ({'<'}50%):</span>
                    <span className="font-mono text-red-600">
                      {metrics.filter(m => {
                        const hitRate = m.memoHits / (m.memoHits + m.memoMisses) || 0
                        return hitRate <= 0.5
                      }).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Function Cache Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Functions:</span>
                  <span className="font-mono">{cacheStats.totalFunctions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Cache Entries:</span>
                  <span className="font-mono">{cacheStats.totalCacheEntries}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average Cache Size:</span>
                  <span className="font-mono">{cacheStats.averageCacheSize.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cache Hit Rate:</span>
                  <span className="font-mono">{cacheStats.cacheHitRate.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    {((cacheStats.totalCacheEntries * 100) / 1024).toFixed(1)} KB
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Estimated cache memory usage
                  </p>
                </div>
                <Progress 
                  value={(cacheStats.totalCacheEntries / 1000) * 100} 
                  className="mt-4" 
                />
                <p className="text-xs text-muted-foreground text-center">
                  {((cacheStats.totalCacheEntries / 1000) * 100).toFixed(1)}% of recommended limit
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {showAdvanced && (
          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Optimization Opportunities</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Components needing memo optimization:</span>
                        <p className="font-mono text-orange-600">
                          {metrics.filter(m => {
                            const hitRate = m.memoHits / (m.memoHits + m.memoMisses) || 0
                            return hitRate < 0.5 && (m.memoHits + m.memoMisses) > 10
                          }).length}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Components with slow comparisons:</span>
                        <p className="font-mono text-red-600">
                          {metrics.filter(m => m.slowComparisons > 5).length}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Over-memoized components:</span>
                        <p className="font-mono text-blue-600">
                          {metrics.filter(m => {
                            const hitRate = m.memoHits / (m.memoHits + m.memoMisses) || 0
                            return hitRate > 0.95 && m.renderCount < 5
                          }).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Performance Impact</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total memo hits:</span>
                        <p className="font-mono text-green-600">
                          {metrics.reduce((sum, m) => sum + m.memoHits, 0)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Prevented re-renders:</span>
                        <p className="font-mono text-blue-600">
                          {metrics.reduce((sum, m) => sum + m.memoHits, 0)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Time saved (estimated):</span>
                        <p className="font-mono text-purple-600">
                          {formatTime(metrics.reduce((sum, m) => sum + (m.memoHits * m.avgRenderTime), 0))}
                        </p>
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

export default MemoizationDashboard