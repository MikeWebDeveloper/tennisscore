"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  Zap, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  BarChart3,
  RefreshCw,
  Download
} from 'lucide-react'
import { webVitalsMonitor, useWebVitals, WebVitalMetric } from '@/lib/utils/web-vitals'
import { cacheManager, CacheStats } from '@/lib/utils/cache-manager'

interface CoreWebVitals {
  LCP?: WebVitalMetric
  FID?: WebVitalMetric  
  CLS?: WebVitalMetric
  FCP?: WebVitalMetric
  TTFB?: WebVitalMetric
  INP?: WebVitalMetric
}

interface CustomMetrics {
  pageLoadTime?: number
  domContentLoaded?: number
  slowResources?: number
}

interface PerformanceSummary {
  coreWebVitals?: CoreWebVitals
  customMetrics?: CustomMetrics
  errors?: number
  sessionId?: string
}

interface PerformanceCardProps {
  title: string
  value: string
  metric?: WebVitalMetric
  threshold?: { good: number; needsImprovement: number }
  icon: React.ReactNode
  description: string
}

function PerformanceCard({ title, value, metric, threshold, icon, description }: PerformanceCardProps) {
  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case 'good': return 'text-green-600'
      case 'needs-improvement': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getRatingIcon = (rating?: string) => {
    switch (rating) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'needs-improvement': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'poor': return <XCircle className="w-4 h-4 text-red-600" />
      default: return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const getProgressValue = (value: number, threshold?: { good: number; needsImprovement: number }) => {
    if (!threshold) return 0
    
    if (value <= threshold.good) return 100
    if (value <= threshold.needsImprovement) return 60
    return 30
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{value}</div>
          <div className="flex items-center gap-1">
            {getRatingIcon(metric?.rating)}
            <Badge variant="outline" className={getRatingColor(metric?.rating)}>
              {metric?.rating || 'unknown'}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {metric && threshold && (
          <div className="mt-2">
            <Progress 
              value={getProgressValue(metric.value, threshold)}
              className="w-full h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Good: &lt;{threshold.good}</span>
              <span>Poor: &gt;{threshold.needsImprovement}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function PerformanceDashboard() {
  const { isLoading, recordCustomMetric, getPerformanceSummary } = useWebVitals()
  const [summary, setSummary] = useState<PerformanceSummary | null>(null)
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)

  useEffect(() => {
    const updateSummary = () => {
      const perfSummary = getPerformanceSummary()
      setSummary(perfSummary)
      
      const stats = cacheManager.getStats()
      setCacheStats(stats)
    }

    updateSummary()
    const interval = setInterval(updateSummary, 5000)

    return () => clearInterval(interval)
  }, [getPerformanceSummary])

  const handleRefresh = () => {
    recordCustomMetric('manual-refresh', performance.now(), 'ms', {
      page: window.location.pathname
    })
    window.location.reload()
  }

  const handleExportReport = () => {
    const report = webVitalsMonitor.getPerformanceReport()
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const coreWebVitals = summary?.coreWebVitals || {}
  const customMetrics = summary?.customMetrics || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Performance Dashboard</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <PerformanceCard
          title="Largest Contentful Paint"
          value={coreWebVitals.LCP ? `${Math.round(coreWebVitals.LCP.value)}ms` : 'N/A'}
          metric={coreWebVitals.LCP}
          threshold={{ good: 2500, needsImprovement: 4000 }}
          icon={<Zap className="w-4 h-4" />}
          description="Time to render the largest content element"
        />

        <PerformanceCard
          title="First Input Delay"
          value={coreWebVitals.FID ? `${Math.round(coreWebVitals.FID.value)}ms` : 'N/A'}
          metric={coreWebVitals.FID}
          threshold={{ good: 100, needsImprovement: 300 }}
          icon={<Activity className="w-4 h-4" />}
          description="Time from first user interaction to browser response"
        />

        <PerformanceCard
          title="Cumulative Layout Shift"
          value={coreWebVitals.CLS ? coreWebVitals.CLS.value.toFixed(3) : 'N/A'}
          metric={coreWebVitals.CLS}
          threshold={{ good: 0.1, needsImprovement: 0.25 }}
          icon={<AlertTriangle className="w-4 h-4" />}
          description="Measure of visual stability"
        />

        <PerformanceCard
          title="First Contentful Paint"
          value={coreWebVitals.FCP ? `${Math.round(coreWebVitals.FCP.value)}ms` : 'N/A'}
          metric={coreWebVitals.FCP}
          threshold={{ good: 1800, needsImprovement: 3000 }}
          icon={<Clock className="w-4 h-4" />}
          description="Time to render the first content element"
        />

        <PerformanceCard
          title="Time to First Byte"
          value={coreWebVitals.TTFB ? `${Math.round(coreWebVitals.TTFB.value)}ms` : 'N/A'}
          metric={coreWebVitals.TTFB}
          threshold={{ good: 800, needsImprovement: 1800 }}
          icon={<Zap className="w-4 h-4" />}
          description="Time from request to first byte of response"
        />

        <PerformanceCard
          title="Interaction to Next Paint"
          value={coreWebVitals.INP ? `${Math.round(coreWebVitals.INP.value)}ms` : 'N/A'}
          metric={coreWebVitals.INP}
          threshold={{ good: 200, needsImprovement: 500 }}
          icon={<Activity className="w-4 h-4" />}
          description="Responsiveness of user interactions"
        />
      </div>

      {/* Custom Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Page Load Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customMetrics.pageLoadTime ? `${Math.round(customMetrics.pageLoadTime)}ms` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Total page load duration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">DOM Content Loaded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customMetrics.domContentLoaded ? `${Math.round(customMetrics.domContentLoaded)}ms` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">DOM ready time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Slow Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customMetrics.slowResources || 0}
            </div>
            <p className="text-xs text-muted-foreground">Resources taking &gt;1s</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.errors || 0}
            </div>
            <p className="text-xs text-muted-foreground">Performance errors</p>
          </CardContent>
        </Card>
      </div>

      {/* Cache Statistics */}
      {cacheStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cache Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <div className="text-2xl font-bold">{cacheStats.hits}</div>
                <p className="text-xs text-muted-foreground">Cache Hits</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{cacheStats.misses}</div>
                <p className="text-xs text-muted-foreground">Cache Misses</p>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {cacheStats.hits + cacheStats.misses > 0 
                    ? `${Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100)}%`
                    : '0%'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Hit Rate</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{cacheStats.size}</div>
                <p className="text-xs text-muted-foreground">Cache Size</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{cacheStats.evictions}</div>
                <p className="text-xs text-muted-foreground">Evictions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Session Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Session ID:</span> {summary?.sessionId}
            </div>
            <div>
              <span className="font-medium">Page URL:</span> {window.location.href}
            </div>
            <div>
              <span className="font-medium">User Agent:</span> {navigator.userAgent.substring(0, 50)}...
            </div>
            <div>
              <span className="font-medium">Screen:</span> {window.screen.width}x{window.screen.height}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}