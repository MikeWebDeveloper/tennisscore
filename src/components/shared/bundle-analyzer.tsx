/**
 * Bundle Analyzer Component
 * Provides real-time bundle size monitoring and analysis
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  Package, 
  Zap, 
  Download, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Activity,
  HardDrive
} from 'lucide-react'
import { 
  useBundleOptimization,
  getAllBundleAnalytics,
  BundleAnalytics
} from '@/lib/utils/bundle-optimization'
import { logger } from '@/lib/utils/logger'

interface BundleAnalyzerProps {
  showAdvanced?: boolean
  enableRealTime?: boolean
  enableExport?: boolean
}

export const BundleAnalyzer: React.FC<BundleAnalyzerProps> = ({
  showAdvanced = true,
  enableRealTime = true,
  enableExport = false
}) => {
  const [analytics, setAnalytics] = useState<Map<string, BundleAnalytics>>(new Map())
  const [performanceData, setPerformanceData] = useState<Record<string, unknown>[]>([])
  const [selectedChunk, setSelectedChunk] = useState<string | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  
  const { estimatedBundleSize, loadedChunks } = useBundleOptimization()

  // Real-time monitoring
  useEffect(() => {
    if (!enableRealTime) return

    const interval = setInterval(() => {
      const currentAnalytics = getAllBundleAnalytics()
      setAnalytics(new Map(currentAnalytics))
      
      // Update performance data
      const newData = Array.from(currentAnalytics.entries()).map(([name, data]) => ({
        name,
        loadTime: data.loadTime,
        chunkSize: data.chunkSize,
        cacheHit: data.cacheHit,
        errors: data.errors.length
      }))
      
      setPerformanceData(newData)
    }, 1000)

    return () => clearInterval(interval)
  }, [enableRealTime])

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format time
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  // Calculate bundle health score
  const calculateHealthScore = useCallback((): number => {
    const chunks = Array.from(analytics.values())
    if (chunks.length === 0) return 100

    let score = 100
    
    chunks.forEach(chunk => {
      // Penalize slow load times
      if (chunk.loadTime > 1000) score -= 10
      if (chunk.loadTime > 3000) score -= 20
      
      // Penalize large chunks
      if (chunk.chunkSize > 500000) score -= 10
      if (chunk.chunkSize > 1000000) score -= 20
      
      // Penalize errors
      score -= chunk.errors.length * 5
      
      // Bonus for cache hits
      if (chunk.cacheHit) score += 5
    })
    
    return Math.max(0, Math.min(100, score))
  }, [analytics])

  // Export analytics data
  const exportAnalytics = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      estimatedBundleSize,
      loadedChunks,
      analytics: Object.fromEntries(analytics),
      healthScore: calculateHealthScore(),
      performance: performanceData
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bundle-analytics-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    logger.info('Bundle analytics exported')
  }, [analytics, estimatedBundleSize, loadedChunks, performanceData, calculateHealthScore])

  // Toggle monitoring
  const toggleMonitoring = useCallback(() => {
    setIsMonitoring(!isMonitoring)
    
    if (!isMonitoring) {
      // Start performance monitoring
      if (typeof window !== 'undefined' && window.performance) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation' || entry.entryType === 'resource') {
              logger.debug('Performance entry:', entry)
            }
          })
        })
        
        observer.observe({ entryTypes: ['navigation', 'resource'] })
      }
    }
  }, [isMonitoring])

  const healthScore = calculateHealthScore()
  const totalChunks = analytics.size
  const errorCount = Array.from(analytics.values()).reduce((sum, chunk) => sum + chunk.errors.length, 0)
  const avgLoadTime = analytics.size > 0 
    ? Array.from(analytics.values()).reduce((sum, chunk) => sum + chunk.loadTime, 0) / analytics.size
    : 0

  // Chart colors
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bundle Analyzer</h2>
          <p className="text-muted-foreground">
            Real-time bundle size monitoring and optimization insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleMonitoring}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            {isMonitoring ? 'Stop' : 'Start'} Monitoring
          </Button>
          {enableExport && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportAnalytics}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bundle Health</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthScore}%</div>
            <Progress value={healthScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Needs Improvement'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSize(estimatedBundleSize)}</div>
            <p className="text-xs text-muted-foreground">
              {loadedChunks.length} chunks loaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Load Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(avgLoadTime)}</div>
            <p className="text-xs text-muted-foreground">
              {totalChunks} total chunks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorCount}</div>
            <p className="text-xs text-muted-foreground">
              {errorCount === 0 ? 'No errors' : 'Check details'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chunks">Chunks</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          {showAdvanced && <TabsTrigger value="advanced">Advanced</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Load Time Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Load Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="loadTime" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chunk Size Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Chunk Size Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={performanceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="chunkSize"
                    >
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {healthScore < 60 && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-200">
                        Bundle Health Critical
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-300">
                        Consider implementing code splitting and lazy loading for better performance.
                      </p>
                    </div>
                  </div>
                )}

                {avgLoadTime > 2000 && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        Slow Load Times
                      </p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-300">
                        Average load time is {formatTime(avgLoadTime)}. Consider preloading critical chunks.
                      </p>
                    </div>
                  </div>
                )}

                {errorCount === 0 && healthScore >= 80 && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Bundle Optimized
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        Your bundle is well-optimized with good load times and no errors.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chunks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chunk Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from(analytics.entries()).map(([name, data]) => (
                  <div 
                    key={name} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => setSelectedChunk(selectedChunk === name ? null : name)}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatSize(data.chunkSize)}</span>
                          <span>•</span>
                          <span>{formatTime(data.loadTime)}</span>
                          {data.cacheHit && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs">Cached</Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {data.errors.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {data.errors.length} errors
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {data.loadTime < 100 ? 'Fast' : data.loadTime < 500 ? 'Normal' : 'Slow'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="loadTime" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {showAdvanced && (
          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Diagnostics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Loaded Chunks</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {loadedChunks.map((chunk, index) => (
                        <div key={index} className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          {chunk}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Webpack Stats</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Estimated Bundle Size:</span>
                        <span className="font-mono">{formatSize(estimatedBundleSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Loaded Chunks:</span>
                        <span className="font-mono">{loadedChunks.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cache Hit Rate:</span>
                        <span className="font-mono">
                          {analytics.size > 0 
                            ? `${Math.round(Array.from(analytics.values()).filter(c => c.cacheHit).length / analytics.size * 100)}%`
                            : 'N/A'
                          }
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

export default BundleAnalyzer