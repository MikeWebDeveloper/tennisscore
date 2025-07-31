"use client"

import { memo, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react'
import { useTranslations } from '@/i18n'
import { usePerformanceDashboard } from '@/hooks/use-performance-monitoring'
import { cn } from '@/lib/utils'

/**
 * Real-time performance dashboard for tennis scoring app
 * Displays sub-100ms metrics and optimization recommendations
 */
export const PerformanceDashboard = memo(function PerformanceDashboard() {
  const t = useTranslations('common')
  const { dashboardData, isMonitoring, hasData } = usePerformanceDashboard()

  const statusConfig = useMemo(() => {
    switch (dashboardData.status) {
      case 'optimal':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          label: t('performance.optimal'),
          description: t('performance.optimalDescription')
        }
      case 'needs-attention':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          label: t('performance.needsAttention'),
          description: t('performance.needsAttentionDescription')
        }
      default:
        return {
          icon: Activity,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          label: t('performance.monitoring'),
          description: t('performance.monitoringDescription')
        }
    }
  }, [dashboardData.status, t])

  const StatusIcon = statusConfig.icon
  const latencyPercentage = Math.min((dashboardData.latency / dashboardData.target) * 100, 100)

  if (!isMonitoring) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">{t('performance.monitoringDisabled')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-full', statusConfig.bgColor)}>
                <StatusIcon className={cn('h-5 w-5', statusConfig.color)} />
              </div>
              <div>
                <CardTitle className="text-lg">{t('performance.title')}</CardTitle>
                <CardDescription>{statusConfig.description}</CardDescription>
              </div>
            </div>
            <Badge variant={dashboardData.status === 'optimal' ? 'default' : 'secondary'}>
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Response Time Metric */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{t('performance.responseTime')}</span>
                <span className={cn(
                  'text-sm font-mono',
                  dashboardData.latency < 100 ? 'text-green-600' : 'text-red-600'
                )}>
                  {dashboardData.latency}ms / {dashboardData.target}ms
                </span>
              </div>
              <Progress 
                value={latencyPercentage} 
                className={cn(
                  'h-2',
                  dashboardData.latency < 100 ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'
                )}
              />
            </div>

            {/* Real-time Metrics Grid */}
            {hasData && (
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {dashboardData.metrics.filter(m => m.passed).length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('performance.passedMetrics')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {dashboardData.metrics.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('performance.totalMetrics')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {dashboardData.recommendations.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('performance.recommendations')}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {dashboardData.recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm">
                  {recommendation}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Metrics */}
      {hasData && dashboardData.metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('performance.detailedMetrics')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.metrics.slice(-5).map((metric, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    {metric.passed ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      {metric.metric.replace('tennis-scoring-', '').replace('-', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      'text-sm font-mono',
                      metric.passed ? 'text-green-600' : 'text-red-600'
                    )}>
                      {Math.round(metric.value)}ms
                    </div>
                    <div className="text-xs text-muted-foreground">
                      target: {metric.target}ms
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
})

export default PerformanceDashboard