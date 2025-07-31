"use client"

import { Suspense, memo, useCallback, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Wifi, WifiOff, Activity, Zap } from 'lucide-react'
import { useTranslations } from '@/i18n'
import { cn } from '@/lib/utils'

// Performance-optimized imports
import { useOptimisticScoring } from '@/hooks/use-optimistic-scoring'
import { usePerformanceRealtime } from '@/hooks/use-performance-realtime'
import { usePerformanceMonitoring } from '@/hooks/use-performance-monitoring'
import { ScoreButtonPair } from './optimized-score-buttons'
import { assessConnectionQuality } from '@/lib/utils/connection-resilience'

// Types
import type { Score, PointDetail, MatchFormat } from '@/stores/matchStore'
type PointWinner = 'player1' | 'player2'

interface EnhancedLiveScoringProps {
  matchId: string
  player1Name: string
  player2Name: string
  initialScore: Score
  initialPointLog: PointDetail[]
  matchFormat: MatchFormat
}

/**
 * Performance-enhanced live scoring interface
 * Target: Sub-100ms UI response with full resilience
 */
const EnhancedLiveScoring = memo(function EnhancedLiveScoring({
  matchId,
  player1Name,
  player2Name,
  initialScore,
  initialPointLog,
  matchFormat
}: EnhancedLiveScoringProps) {
  const t = useTranslations('match')
  
  // Initialize performance monitoring
  const { 
    startUIInteraction, 
    completeUIInteraction, 
    benchmarkScoringOperation,
    report,
    isPerformant 
  } = usePerformanceMonitoring(true)

  // Optimistic scoring with sub-100ms updates
  const {
    score,
    pointLog,
    scorePoint,
    performance: scoringPerformance,
    isLoading
  } = useOptimisticScoring({
    matchId,
    initialScore,
    initialPointLog,
    matchFormat
  })

  // Real-time connection with resilience
  const {
    performance: realtimePerformance,
    isConnected,
    connectionType
  } = usePerformanceRealtime({
    matchId,
    enableOptimizations: true,
    batchUpdates: true,
    fallbackPolling: true
  })

  // Enhanced scoring with performance measurement
  const handleScorePoint = useCallback(async (winner: PointWinner) => {
    await benchmarkScoringOperation(async () => {
      startUIInteraction('score-point')
      scorePoint(winner)
      completeUIInteraction('score-point')
    })
  }, [benchmarkScoringOperation, startUIInteraction, scorePoint, completeUIInteraction])

  // Connection quality assessment
  const connectionQuality = useMemo(() => assessConnectionQuality(), [])

  // Performance status indicator
  const performanceStatus = useMemo(() => {
    const latency = realtimePerformance.latency || 0
    const isOptimal = latency < 100 && isConnected && isPerformant
    
    return {
      isOptimal,
      latency,
      status: isOptimal ? 'optimal' : latency > 200 ? 'poor' : 'good'
    }
  }, [realtimePerformance.latency, isConnected, isPerformant])

  return (
    <div className="space-y-6">
      {/* Performance Status Bar */}
      <Card className="border-l-4" style={{
        borderLeftColor: performanceStatus.isOptimal ? '#10b981' : '#f59e0b'
      }}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {connectionType}
                </span>
              </div>

              {/* Performance Indicator */}
              <div className="flex items-center gap-2">
                {performanceStatus.isOptimal ? (
                  <Zap className="h-4 w-4 text-green-600" />
                ) : (
                  <Activity className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-sm text-muted-foreground">
                  {performanceStatus.latency}ms
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <Badge variant={performanceStatus.isOptimal ? 'default' : 'secondary'}>
              {performanceStatus.status === 'optimal' && t('performance.optimal')}
              {performanceStatus.status === 'good' && t('performance.good')}
              {performanceStatus.status === 'poor' && t('performance.needsAttention')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Live Score Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('liveScoring')}</span>
            {scoringPerformance.isOptimistic && (
              <Badge variant="outline" className="animate-pulse">
                {t('updating')}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Score Display */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Player 1 Score */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{player1Name}</h3>
              <div className="space-y-1">
                <div className="text-4xl font-mono font-bold">
                  {score.sets.length > 0 ? score.sets.length : 0}
                </div>
                <div className="text-2xl font-mono">
                  {score.games[0] || 0}
                </div>
                <div className="text-xl font-mono">
                  {score.points[0] || 0}
                </div>
              </div>
            </div>

            {/* Player 2 Score */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{player2Name}</h3>
              <div className="space-y-1">
                <div className="text-4xl font-mono font-bold">
                  {score.sets.length > 0 ? score.sets.length : 0}
                </div>
                <div className="text-2xl font-mono">
                  {score.games[1] || 0}
                </div>
                <div className="text-xl font-mono">
                  {score.points[1] || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Optimized Score Buttons */}
          <ScoreButtonPair
            player1Name={player1Name}
            player2Name={player2Name}
            onScore={handleScorePoint}
            disabled={isLoading}
          />

          {/* Match Status */}
          {/* Note: Match completion status would need to be determined from the score state */}
        </CardContent>
      </Card>

      {/* Performance Insights (Development Mode) */}
      {process.env.NODE_ENV === 'development' && report && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium">UI Response</div>
                <div className="text-muted-foreground">
                  {report.uiMetrics.totalResponse}ms
                </div>
              </div>
              <div>
                <div className="font-medium">Connection</div>
                <div className="text-muted-foreground">
                  {connectionQuality}
                </div>
              </div>
              <div>
                <div className="font-medium">Updates</div>
                <div className="text-muted-foreground">
                  {realtimePerformance.updateCount}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
})

// Loading fallback with skeleton
const LiveScoringFallback = memo(function LiveScoringFallback() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-4">
          <Skeleton className="h-6 w-48" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="text-center space-y-2">
              <Skeleton className="h-6 w-20 mx-auto" />
              <Skeleton className="h-12 w-16 mx-auto" />
              <Skeleton className="h-8 w-12 mx-auto" />
              <Skeleton className="h-6 w-8 mx-auto" />
            </div>
            <div className="text-center space-y-2">
              <Skeleton className="h-6 w-20 mx-auto" />
              <Skeleton className="h-12 w-16 mx-auto" />
              <Skeleton className="h-8 w-12 mx-auto" />
              <Skeleton className="h-6 w-8 mx-auto" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

// Main export with Suspense boundary
export function EnhancedLiveScoringInterface(props: EnhancedLiveScoringProps) {
  return (
    <Suspense fallback={<LiveScoringFallback />}>
      <EnhancedLiveScoring {...props} />
    </Suspense>
  )
}

export default EnhancedLiveScoringInterface