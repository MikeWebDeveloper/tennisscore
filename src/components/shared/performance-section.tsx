"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Activity, 
  BarChart3, 
  Zap, 
  Database, 
  Globe, 
  Settings, 
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useWebVitals } from '@/lib/utils/web-vitals'
import { cacheManager, CacheStats } from '@/lib/utils/cache-manager'
import { performanceMonitor, PerformanceMetric } from '@/lib/utils/performance-metrics'

export function PerformanceSection() {
  const [cacheEnabled, setCacheEnabled] = useState(true)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true)
  const [performanceLogging, setPerformanceLogging] = useState(false)
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [performanceStats, setPerformanceStats] = useState<PerformanceMetric[] | null>(null)
  const { getPerformanceSummary } = useWebVitals()

  useEffect(() => {
    // Load settings from localStorage
    const savedCacheEnabled = localStorage.getItem('performance-cache-enabled')
    const savedAnalyticsEnabled = localStorage.getItem('performance-analytics-enabled')
    const savedPerformanceLogging = localStorage.getItem('performance-logging-enabled')

    if (savedCacheEnabled !== null) setCacheEnabled(savedCacheEnabled === 'true')
    if (savedAnalyticsEnabled !== null) setAnalyticsEnabled(savedAnalyticsEnabled === 'true')
    if (savedPerformanceLogging !== null) setPerformanceLogging(savedPerformanceLogging === 'true')

    // Update stats
    const updateStats = () => {
      setCacheStats(cacheManager.getStats())
      setPerformanceStats(performanceMonitor.getMetrics())
    }

    updateStats()
    const interval = setInterval(updateStats, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleCacheToggle = (enabled: boolean) => {
    setCacheEnabled(enabled)
    localStorage.setItem('performance-cache-enabled', enabled.toString())
    
    if (!enabled) {
      cacheManager.clear()
    }
  }

  const handleAnalyticsToggle = (enabled: boolean) => {
    setAnalyticsEnabled(enabled)
    localStorage.setItem('performance-analytics-enabled', enabled.toString())
  }

  const handlePerformanceLoggingToggle = (enabled: boolean) => {
    setPerformanceLogging(enabled)
    localStorage.setItem('performance-logging-enabled', enabled.toString())
  }

  const handleClearCache = () => {
    cacheManager.clear()
    setCacheStats(cacheManager.getStats())
  }

  const handleClearPerformanceData = () => {
    performanceMonitor.clearMetrics()
    setPerformanceStats(performanceMonitor.getMetrics())
  }

  const getPerformanceRating = () => {
    const summary = getPerformanceSummary()
    const vitals = summary.coreWebVitals
    
    let goodCount = 0
    let totalCount = 0
    
    Object.values(vitals).forEach(vital => {
      if (vital) {
        totalCount++
        if (vital.rating === 'good') goodCount++
      }
    })
    
    if (totalCount === 0) return { rating: 'unknown', score: 0 }
    
    const score = (goodCount / totalCount) * 100
    
    if (score >= 80) return { rating: 'good', score }
    if (score >= 60) return { rating: 'needs-improvement', score }
    return { rating: 'poor', score }
  }

  const performanceRating = getPerformanceRating()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Performance & Analytics</h2>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Overall Performance Score</p>
              <p className="text-sm text-muted-foreground">
                Based on Core Web Vitals
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {Math.round(performanceRating.score)}%
              </div>
              <Badge 
                variant={performanceRating.rating === 'good' ? 'default' : 'destructive'}
                className="flex items-center gap-1"
              >
                {performanceRating.rating === 'good' ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                {performanceRating.rating === 'good' ? 'Good' : 
                 performanceRating.rating === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cache Hit Rate</span>
                <span className="text-sm">
                  {cacheStats && cacheStats.hits + cacheStats.misses > 0 
                    ? `${Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cache Size</span>
                <span className="text-sm">{cacheStats?.size || 0} items</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Performance Metrics</span>
                <span className="text-sm">{performanceStats?.length || 0} tracked</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Session Duration</span>
                <span className="text-sm">{Math.round(performance.now() / 1000)}s</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Performance Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Enable Data Caching
              </Label>
              <p className="text-sm text-muted-foreground">
                Cache frequently accessed data to improve performance
              </p>
            </div>
            <Switch
              checked={cacheEnabled}
              onCheckedChange={handleCacheToggle}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Web Vitals Monitoring
              </Label>
              <p className="text-sm text-muted-foreground">
                Track Core Web Vitals and performance metrics
              </p>
            </div>
            <Switch
              checked={analyticsEnabled}
              onCheckedChange={handleAnalyticsToggle}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Performance Logging
              </Label>
              <p className="text-sm text-muted-foreground">
                Log detailed performance information for debugging
              </p>
            </div>
            <Switch
              checked={performanceLogging}
              onCheckedChange={handlePerformanceLoggingToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Cache Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{cacheStats?.hits || 0}</div>
              <p className="text-sm text-muted-foreground">Cache Hits</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{cacheStats?.misses || 0}</div>
              <p className="text-sm text-muted-foreground">Cache Misses</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{cacheStats?.size || 0}</div>
              <p className="text-sm text-muted-foreground">Cached Items</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{cacheStats?.evictions || 0}</div>
              <p className="text-sm text-muted-foreground">Evictions</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleClearCache}
              disabled={!cacheEnabled}
            >
              Clear Cache
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClearPerformanceData}
            >
              Clear Performance Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Performance Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Keep cache enabled for better performance</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Use a fast internet connection for real-time match scoring</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Close unnecessary browser tabs to free up memory</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Enable performance logging only when troubleshooting</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}