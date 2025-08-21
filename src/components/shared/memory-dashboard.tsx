/**
 * Memory Dashboard Component
 * Provides real-time memory usage monitoring and leak detection
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  AreaChart,
  Area
} from 'recharts'
import { 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  HardDrive,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { useMemoryManagement } from '@/hooks/use-memory-management'
import { 
  MemoryMetrics,
  MemoryLeakDetection
} from '@/lib/utils/memory-management'
import { logger } from '@/lib/utils/logger'

interface MemoryDashboardProps {
  enableRealTime?: boolean
  enableExport?: boolean
  showAdvanced?: boolean
  refreshInterval?: number
}

export const MemoryDashboard: React.FC<MemoryDashboardProps> = ({
  enableRealTime = true,
  enableExport = true,
  showAdvanced = true,
  refreshInterval = 5000
}) => {
  const [memoryHistory, setMemoryHistory] = useState<MemoryMetrics[]>([])
  const [selectedLeak, setSelectedLeak] = useState<MemoryLeakDetection | null>(null)
  const [isGCRunning, setIsGCRunning] = useState(false)
  
  const {
    currentMetrics,
    leakDetections,
    cleanupFunctions,
    memoryUsagePercent,
    memoryHealth,
    optimizationSuggestions,
    cleanupCount,
    hasMemoryLeaks,
    hasHighMemoryUsage,
    needsOptimization,
    triggerGarbageCollection,
    updateMemoryState
  } = useMemoryManagement({
    enableMonitoring: enableRealTime,
    enableLeakDetection: true,
    enableAutoCleanup: true,
    componentName: 'MemoryDashboard',
    monitoringInterval: refreshInterval
  })

  // Update memory history
  useEffect(() => {
    if (currentMetrics) {
      setMemoryHistory(prev => {
        const newHistory = [...prev, currentMetrics]
        // Keep only last 50 entries
        return newHistory.length > 50 ? newHistory.slice(-50) : newHistory
      })
    }
  }, [currentMetrics])

  // Format memory size
  const formatMemorySize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Format time
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString()
  }

  // Handle garbage collection
  const handleGarbageCollection = useCallback(async () => {
    setIsGCRunning(true)
    try {
      triggerGarbageCollection()
      await new Promise(resolve => setTimeout(resolve, 1000))
      updateMemoryState()
    } finally {
      setIsGCRunning(false)
    }
  }, [triggerGarbageCollection, updateMemoryState])

  // Export memory data
  const exportMemoryData = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      currentMetrics,
      memoryHistory,
      leakDetections,
      cleanupFunctions,
      memoryHealth,
      optimizationSuggestions
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `memory-report-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    logger.info('Memory data exported')
  }, [currentMetrics, memoryHistory, leakDetections, cleanupFunctions, memoryHealth, optimizationSuggestions])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'critical': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'high': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  // Chart data for memory usage over time
  const chartData = memoryHistory.map(metric => ({
    time: formatTime(metric.timestamp),
    used: metric.usedJSHeapSize / (1024 * 1024),
    total: metric.totalJSHeapSize / (1024 * 1024),
    limit: metric.jsHeapSizeLimit / (1024 * 1024),
    percentage: metric.memoryUsagePercent
  }))

  // Leak type distribution
  const leakTypeData = leakDetections.reduce((acc, leak) => {
    acc[leak.leakType] = (acc[leak.leakType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const leakChartData = Object.entries(leakTypeData).map(([type, count]) => ({
    name: type,
    value: count
  }))

  // Cleanup function distribution
  const cleanupTypeData = cleanupFunctions.reduce((acc, cleanup) => {
    acc[cleanup.type] = (acc[cleanup.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const cleanupChartData = Object.entries(cleanupTypeData).map(([type, count]) => ({
    name: type,
    value: count
  }))

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Memory Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time memory monitoring and leak detection
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGarbageCollection}
            disabled={isGCRunning}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isGCRunning ? 'Running...' : 'Force GC'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={updateMemoryState}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {enableExport && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportMemoryData}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memoryHealth.score}%</div>
            <div className={`text-sm ${getStatusColor(memoryHealth.status)}`}>
              {memoryHealth.status.toUpperCase()}
            </div>
            <Progress value={memoryHealth.score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memoryUsagePercent.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">
              {currentMetrics ? formatMemorySize(currentMetrics.usedJSHeapSize) : 'N/A'}
            </div>
            <Progress value={memoryUsagePercent} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Leaks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leakDetections.length}</div>
            <div className="text-sm text-muted-foreground">
              {hasMemoryLeaks ? 'Issues detected' : 'No issues'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cleanup Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cleanupCount}</div>
            <div className="text-sm text-muted-foreground">
              Active cleanups
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(hasMemoryLeaks || hasHighMemoryUsage || needsOptimization) && (
        <div className="space-y-2">
          {hasMemoryLeaks && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Memory leaks detected. Review cleanup procedures and check for unremoved event listeners.
              </AlertDescription>
            </Alert>
          )}
          
          {hasHighMemoryUsage && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                High memory usage detected ({memoryUsagePercent.toFixed(1)}%). Consider optimizing component complexity.
              </AlertDescription>
            </Alert>
          )}

          {needsOptimization && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {optimizationSuggestions[0]}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leaks">Memory Leaks</TabsTrigger>
          <TabsTrigger value="cleanup">Cleanup</TabsTrigger>
          {showAdvanced && <TabsTrigger value="advanced">Advanced</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Memory Usage Over Time */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Memory Usage Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="used" 
                      stackId="1" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      name="Used Memory (MB)"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stackId="2" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      name="Total Memory (MB)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Leak Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Leak Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={leakChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {leakChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cleanup Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Cleanup Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={cleanupChartData}>
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

        <TabsContent value="leaks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Memory Leak Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leakDetections.map((leak, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => setSelectedLeak(selectedLeak === leak ? null : leak)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getSeverityColor(leak.severity)}`} />
                      <div>
                        <p className="font-medium">{leak.componentName}</p>
                        <p className="text-sm text-muted-foreground">{leak.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {leak.leakType}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {leak.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(leak.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
                
                {leakDetections.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                    No memory leaks detected
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleanup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cleanup Functions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cleanupFunctions.map((cleanup, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{cleanup.componentName || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{cleanup.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {cleanup.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {cleanupFunctions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                    No cleanup functions registered
                  </div>
                )}
              </div>
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
                    <h4 className="font-medium mb-2">Current Memory Stats</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Used Heap Size:</span>
                        <span className="font-mono">
                          {currentMetrics ? formatMemorySize(currentMetrics.usedJSHeapSize) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Heap Size:</span>
                        <span className="font-mono">
                          {currentMetrics ? formatMemorySize(currentMetrics.totalJSHeapSize) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Heap Limit:</span>
                        <span className="font-mono">
                          {currentMetrics ? formatMemorySize(currentMetrics.jsHeapSizeLimit) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Usage Percentage:</span>
                        <span className="font-mono">
                          {memoryUsagePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Optimization Suggestions</h4>
                    <div className="space-y-2">
                      {optimizationSuggestions.map((suggestion, index) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          • {suggestion}
                        </div>
                      ))}
                      
                      {optimizationSuggestions.length === 0 && (
                        <div className="text-sm text-muted-foreground italic">
                          No optimization suggestions at this time
                        </div>
                      )}
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

export default MemoryDashboard