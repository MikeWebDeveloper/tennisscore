"use client"

import { useOptimistic, useTransition, useCallback, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from '@/i18n'
import { updateMatchScore } from '@/lib/actions/matches'
import { queryKeys } from '@/lib/tanstack-query/query-keys'
import { 
  calculateScoreFromPointLog
} from '@/lib/utils/tennis-scoring'
import type { PointDetail, MatchFormat, Score } from '@/stores/matchStore'

type PointWinner = 'player1' | 'player2'

interface OptimisticScoreState {
  score: Score
  pointLog: PointDetail[]
  lastUpdate: number
  isOptimistic: boolean
}

interface UseOptimisticScoringProps {
  matchId: string
  initialScore: Score
  initialPointLog: PointDetail[]
  matchFormat: MatchFormat
}

/**
 * High-performance optimistic updates for tennis scoring
 * Target: Sub-100ms UI response times
 */
export function useOptimisticScoring({
  matchId,
  initialScore,
  initialPointLog,
  matchFormat
}: UseOptimisticScoringProps) {
  const t = useTranslations('match')
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()

  // Optimistic state with immediate UI updates
  const [optimisticState, addOptimisticUpdate] = useOptimistic<
    OptimisticScoreState,
    { winner: PointWinner; timestamp: number }
  >(
    {
      score: initialScore,
      pointLog: initialPointLog,
      lastUpdate: Date.now(),
      isOptimistic: false
    },
    (state, { winner, timestamp }) => {
      // Instant score calculation for immediate UI feedback
      const newPointDetail: PointDetail = {
        id: `point-${Date.now()}`,
        timestamp: new Date().toISOString(),
        pointNumber: state.pointLog.length + 1,
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
      const newPointLog = [...state.pointLog, newPointDetail]
      const newScore = calculateScoreFromPointLog(newPointLog, matchFormat)
      
      return {
        score: newScore,
        pointLog: newPointLog,
        lastUpdate: timestamp,
        isOptimistic: true
      }
    }
  )

  // Server mutation with conflict resolution
  const scoreMutation = useMutation({
    mutationFn: async (winner: PointWinner) => {
      // Create proper score update object
      const optimisticScore = optimisticState.score
      const optimisticPointLog = optimisticState.pointLog
      
      const scoreUpdate = {
        score: optimisticScore,
        pointLog: optimisticPointLog,
        status: "In Progress" as const
      }
      
      const result = await updateMatchScore(matchId, scoreUpdate)
      return result
    },
    onSuccess: (data) => {
      // Update cache with server truth
      if (data.match) {
        queryClient.setQueryData(
          queryKeys.matches.detail(matchId),
          (old: any) => ({
            ...old,
            score: data.match!.score,
            pointLog: data.match!.pointLog,
            lastUpdate: Date.now()
          })
        )
      }
    },
    onError: (error) => {
      // Rollback optimistic update on error
      queryClient.invalidateQueries({
        queryKey: queryKeys.matches.detail(matchId)
      })
    }
  })

  // Ultra-fast point scoring with optimistic updates
  const scorePoint = useCallback((winner: PointWinner) => {
    const timestamp = Date.now()
    
    // Immediate UI update (target: <16ms)
    addOptimisticUpdate({ winner, timestamp })
    
    // Server sync in background
    startTransition(() => {
      scoreMutation.mutate(winner)
    })
  }, [addOptimisticUpdate, scoreMutation])

  // Performance metrics
  const performance = useMemo(() => ({
    isOptimistic: optimisticState.isOptimistic,
    lastUpdateDelta: Date.now() - optimisticState.lastUpdate,
    isPending,
    isError: scoreMutation.isError
  }), [optimisticState, isPending, scoreMutation.isError])

  return {
    // Current state
    score: optimisticState.score,
    pointLog: optimisticState.pointLog,
    
    // Actions
    scorePoint,
    
    // Status
    performance,
    
    // Mutation state
    isLoading: scoreMutation.isPending || isPending,
    error: scoreMutation.error
  }
}

// Micro-interaction hook for visual feedback
export function useScoreButtonFeedback() {
  const [feedback, setFeedback] = useOptimistic<
    { pressed: boolean; timestamp: number },
    boolean
  >(
    { pressed: false, timestamp: 0 },
    (state, pressed) => ({ 
      pressed, 
      timestamp: Date.now() 
    })
  )

  const triggerFeedback = useCallback(() => {
    setFeedback(true)
    // Reset after animation completes
    setTimeout(() => setFeedback(false), 150)
  }, [setFeedback])

  return {
    isPressed: feedback.pressed,
    triggerFeedback
  }
}