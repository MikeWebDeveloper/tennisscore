"use client"

import { 
  useDeferredValue, 
  useTransition, 
  useMemo, 
  useCallback, 
  startTransition,
  experimental_useEffectEvent as useEffectEvent
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from '@/i18n'
import { queryKeys } from '@/lib/tanstack-query/query-keys'
import { 
  calculateScoreFromPointLog
} from '@/lib/utils/tennis-scoring'
import type { Score, PointDetail, MatchFormat } from '@/stores/matchStore'

type PointWinner = 'player1' | 'player2'
type MatchStatistics = {
  totalPoints: number
  aces: number
  doubleFaults: number
  // Add other statistics as needed
}

interface ConcurrentScoringState {
  score: Score
  pointLog: PointDetail[]
  statistics: MatchStatistics
  isTransitioning: boolean
  priority: 'urgent' | 'normal' | 'background'
}

interface UseConcurrentScoringProps {
  matchId: string
  initialScore: Score
  initialPointLog: PointDetail[]
  matchFormat: MatchFormat
}

/**
 * React 18 concurrent features for tennis scoring
 * Uses deferred values and transitions for optimal performance
 */
export function useConcurrentScoring({
  matchId,
  initialScore,
  initialPointLog,
  matchFormat
}: UseConcurrentScoringProps) {
  const t = useTranslations('match')
  const queryClient = useQueryClient()
  const [isPending, startScoringTransition] = useTransition()

  // Current scoring state with immediate updates
  const currentScore = useMemo(() => 
    calculateScoreFromPointLog(initialPointLog, matchFormat), 
    [initialPointLog, matchFormat]
  )

  // Deferred values for expensive calculations
  const deferredPointLog = useDeferredValue(initialPointLog)
  const deferredStatistics = useMemo(() => ({
    totalPoints: deferredPointLog.length,
    aces: 0, // Would need actual calculation
    doubleFaults: 0 // Would need actual calculation
  }),
    [deferredPointLog]
  )

  // Stable event handler using useEffectEvent
  const onScoreUpdate = useEffectEvent((newScore: Score, newPointLog: PointDetail[]) => {
    // High priority: Update score display immediately
    queryClient.setQueryData(
      queryKeys.matches.detail(matchId),
      (old: any) => ({
        ...old,
        score: newScore,
        pointLog: newPointLog,
        lastUpdate: Date.now()
      })
    )

    // Low priority: Update statistics in background
    startTransition(() => {
      queryClient.setQueryData(
        queryKeys.statistics.match(matchId),
        {
          totalPoints: newPointLog.length,
          aces: 0,
          doubleFaults: 0
        }
      )
    })
  })

  // Concurrent scoring action with priority scheduling
  const scorePointConcurrent = useCallback((winner: PointWinner) => {
    // Create a minimal PointDetail for the new point
    const newPoint: PointDetail = {
      id: `point-${Date.now()}`,
      timestamp: new Date().toISOString(),
      pointNumber: initialPointLog.length + 1,
      setNumber: 1,
      gameNumber: 1,
      gameScore: '0-0',
      winner: winner === 'player1' ? 'p1' : 'p2',
      server: 'p1',
      isBreakPoint: false,
      isSetPoint: false,
      isMatchPoint: false,
      isGameWinning: false,
      isSetWinning: false,
      isMatchWinning: false,
      isTiebreak: false,
      serveType: 'first',
      pointOutcome: 'winner',
      rallyLength: 1
    }
    
    const newPointLog = [...initialPointLog, newPoint]
    const newScore = calculateScoreFromPointLog(newPointLog, matchFormat)

    // Immediate UI update (synchronous)
    onScoreUpdate(newScore, newPointLog)

    // Background server sync (asynchronous, low priority)
    startScoringTransition(() => {
      // Server update logic would go here
      // This runs with lower priority to not block UI
    })
  }, [initialPointLog, onScoreUpdate])

  // Memoized state for optimal re-renders
  const scoringState = useMemo((): ConcurrentScoringState => ({
    score: currentScore,
    pointLog: initialPointLog,
    statistics: deferredStatistics,
    isTransitioning: isPending,
    priority: isPending ? 'background' : 'urgent'
  }), [currentScore, initialPointLog, deferredStatistics, isPending])

  return {
    // Current state
    state: scoringState,
    
    // Actions
    scorePoint: scorePointConcurrent,
    
    // Status
    isTransitioning: isPending,
    isCalculatingStats: deferredPointLog !== initialPointLog
  }
}

/**
 * Concurrent match state hook with smart updates
 */
export function useConcurrentMatchState(matchId: string) {
  const queryClient = useQueryClient()
  const [isPending, startMatchTransition] = useTransition()

  // Get current match data
  const matchData = queryClient.getQueryData(queryKeys.matches.detail(matchId)) as any

  // Deferred complex calculations
  const deferredMatchData = useDeferredValue(matchData)
  
  // Background calculations
  const backgroundCalculations = useMemo(() => {
    if (!deferredMatchData?.pointLog) return null

    return {
      statistics: {
        totalPoints: deferredMatchData.pointLog.length,
        aces: 0,
        doubleFaults: 0
      },
      momentum: calculateMomentumShift(deferredMatchData.pointLog),
      pressure: analyzePressureSituations(deferredMatchData.pointLog)
    }
  }, [deferredMatchData])

  // Update match with concurrent features
  const updateMatch = useCallback((updates: Partial<any>) => {
    // High priority: Essential match data
    queryClient.setQueryData(
      queryKeys.matches.detail(matchId),
      (old: any) => ({ ...old, ...updates })
    )

    // Low priority: Analytics and statistics
    if (updates.pointLog) {
      startMatchTransition(() => {
        queryClient.setQueryData(
          queryKeys.statistics.match(matchId),
          {
            totalPoints: updates.pointLog.length,
            aces: 0,
            doubleFaults: 0
          }
        )
      })
    }
  }, [queryClient, matchId])

  return {
    matchData,
    backgroundCalculations,
    updateMatch,
    isCalculating: isPending || (deferredMatchData !== matchData)
  }
}

/**
 * Performance-optimized component updates with concurrent features
 */
export function useOptimizedRerender<T>(value: T, isUrgent: boolean = true) {
  const deferredValue = useDeferredValue(value)
  
  // Return immediate value for urgent updates, deferred for non-urgent
  return isUrgent ? value : deferredValue
}

/**
 * Concurrent state synchronization for real-time updates
 */
export function useConcurrentSync(matchId: string) {
  const queryClient = useQueryClient()
  const [isSyncing, startSyncTransition] = useTransition()

  const syncMatchState = useCallback((serverData: any) => {
    // Critical updates (score) - immediate
    if (serverData.score || serverData.pointLog) {
      queryClient.setQueryData(
        queryKeys.matches.detail(matchId),
        (old: any) => ({
          ...old,
          score: serverData.score || old?.score,
          pointLog: serverData.pointLog || old?.pointLog,
          lastSync: Date.now()
        })
      )
    }

    // Non-critical updates - deferred
    startSyncTransition(() => {
      if (serverData.statistics) {
        queryClient.setQueryData(
          queryKeys.statistics.match(matchId),
          serverData.statistics
        )
      }
      
      // Note: Events functionality would need appropriate query key structure
      // if (serverData.events) {
      //   queryClient.setQueryData(
      //     queryKeys.events?.match(matchId),
      //     serverData.events
      //   )
      // }
    })
  }, [queryClient, matchId])

  return {
    syncMatchState,
    isSyncing
  }
}

// Helper function for pressure analysis (placeholder)
function analyzePressureSituations(pointLog: string[]) {
  // Implementation would analyze break points, set points, etc.
  return {
    breakPoints: 0,
    setPoints: 0,
    matchPoints: 0
  }
}

// Helper function for momentum calculation (placeholder)  
function calculateMomentumShift(pointLog: string[]) {
  // Implementation would calculate momentum based on recent points
  return {
    current: 'neutral' as 'player1' | 'player2' | 'neutral',
    strength: 0,
    trend: 'stable' as 'rising' | 'falling' | 'stable'
  }
}