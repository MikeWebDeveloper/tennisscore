"use client"

import { useEffect, useRef, useCallback, useState } from 'react'
import { Match } from '@/lib/types'

interface WorkerMessage {
  id: string
  type: 'CALCULATE_STATS' | 'CALCULATE_HEAD_TO_HEAD' | 'CALCULATE_TRENDS' | 'FILTER_MATCHES'
  data: any
}

interface WorkerResponse {
  id: string
  type: 'SUCCESS' | 'ERROR'
  result?: any
  error?: string
}

interface UseStatsWorkerReturn {
  calculateStats: (matches: Match[], playerId: string) => Promise<any>
  calculateHeadToHead: (matches: Match[], player1Id: string, player2Id: string) => Promise<any>
  calculateTrends: (matches: Match[], playerId: string, periodDays?: number) => Promise<any>
  filterMatches: (matches: Match[], filters: any) => Promise<Match[]>
  isWorkerSupported: boolean
  isWorkerReady: boolean
}

export function useStatsWorker(): UseStatsWorkerReturn {
  const workerRef = useRef<Worker | null>(null)
  const pendingCallsRef = useRef<Map<string, { resolve: (value: any) => void; reject: (error: any) => void }>>(new Map())
  const [isWorkerSupported, setIsWorkerSupported] = useState(false)
  const [isWorkerReady, setIsWorkerReady] = useState(false)

  // Initialize worker
  useEffect(() => {
    // Check if Web Workers are supported
    if (typeof Worker === 'undefined') {
      console.warn('Web Workers are not supported in this environment')
      setIsWorkerSupported(false)
      return
    }

    setIsWorkerSupported(true)

    try {
      // Create worker
      const worker = new Worker('/workers/stats-calculator.js')
      workerRef.current = worker

      // Handle worker messages
      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { id, type, result, error } = e.data
        const pendingCall = pendingCallsRef.current.get(id)

        if (pendingCall) {
          pendingCallsRef.current.delete(id)
          
          if (type === 'SUCCESS') {
            pendingCall.resolve(result)
          } else if (type === 'ERROR') {
            pendingCall.reject(new Error(error || 'Worker error'))
          }
        }
      }

      // Handle worker errors
      worker.onerror = (error) => {
        console.error('Stats worker error:', error)
        setIsWorkerReady(false)
        
        // Reject all pending calls
        pendingCallsRef.current.forEach(({ reject }) => {
          reject(new Error('Worker error'))
        })
        pendingCallsRef.current.clear()
      }

      setIsWorkerReady(true)

    } catch (error) {
      console.error('Failed to create stats worker:', error)
      setIsWorkerSupported(false)
      setIsWorkerReady(false)
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
      pendingCallsRef.current.clear()
      setIsWorkerReady(false)
    }
  }, [])

  // Generic worker call function
  const callWorker = useCallback((type: WorkerMessage['type'], data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isWorkerReady) {
        reject(new Error('Worker is not ready'))
        return
      }

      const id = Math.random().toString(36).substr(2, 9)
      pendingCallsRef.current.set(id, { resolve, reject })

      // Send message to worker
      workerRef.current.postMessage({ id, type, data })

      // Set timeout to prevent hanging
      setTimeout(() => {
        if (pendingCallsRef.current.has(id)) {
          pendingCallsRef.current.delete(id)
          reject(new Error('Worker call timeout'))
        }
      }, 30000) // 30 second timeout
    })
  }, [isWorkerReady])

  // Fallback functions for when worker is not supported
  const calculateStatsFallback = useCallback((matches: Match[], playerId: string) => {
    // Simple fallback calculation
    const completed = matches.filter(m => m.status === 'completed')
    const wins = completed.filter(m => m.winnerId === playerId)
    
    return Promise.resolve({
      totalMatches: matches.length,
      completedMatches: completed.length,
      wins: wins.length,
      losses: completed.length - wins.length,
      winRate: completed.length > 0 ? (wins.length / completed.length) * 100 : 0,
      // Minimal stats for fallback
      setsWon: 0,
      setsLost: 0,
      currentStreak: { type: null, count: 0 },
      bestStreak: { type: null, count: 0 }
    })
  }, [])

  const filterMatchesFallback = useCallback((matches: Match[], filters: any) => {
    // Simple client-side filtering
    let filtered = matches

    if (filters.dateRange?.start) {
      const start = new Date(filters.dateRange.start)
      filtered = filtered.filter(m => new Date(m.matchDate) >= start)
    }

    if (filters.dateRange?.end) {
      const end = new Date(filters.dateRange.end)
      filtered = filtered.filter(m => new Date(m.matchDate) <= end)
    }

    if (filters.opponent) {
      filtered = filtered.filter(m => 
        m.playerOneName?.toLowerCase().includes(filters.opponent.toLowerCase()) ||
        m.playerTwoName?.toLowerCase().includes(filters.opponent.toLowerCase()) ||
        m.playerThreeName?.toLowerCase().includes(filters.opponent.toLowerCase()) ||
        m.playerFourName?.toLowerCase().includes(filters.opponent.toLowerCase())
      )
    }

    if (filters.status) {
      filtered = filtered.filter(m => 
        m.status.toLowerCase() === filters.status.toLowerCase()
      )
    }

    if (filters.matchFormat === 'singles') {
      filtered = filtered.filter(m => !m.isDoubles)
    } else if (filters.matchFormat === 'doubles') {
      filtered = filtered.filter(m => m.isDoubles)
    }

    return Promise.resolve(filtered)
  }, [])

  // API functions
  const calculateStats = useCallback((matches: Match[], playerId: string) => {
    if (isWorkerSupported && isWorkerReady) {
      return callWorker('CALCULATE_STATS', { matches, playerId })
    }
    return calculateStatsFallback(matches, playerId)
  }, [isWorkerSupported, isWorkerReady, callWorker, calculateStatsFallback])

  const calculateHeadToHead = useCallback((matches: Match[], player1Id: string, player2Id: string) => {
    if (isWorkerSupported && isWorkerReady) {
      return callWorker('CALCULATE_HEAD_TO_HEAD', { matches, player1Id, player2Id })
    }
    
    // Simple fallback
    const relevantMatches = matches.filter(m => 
      (m.playerOneId === player1Id && m.playerTwoId === player2Id) ||
      (m.playerOneId === player2Id && m.playerTwoId === player1Id)
    )
    
    const completed = relevantMatches.filter(m => m.status === 'completed')
    const player1Wins = completed.filter(m => m.winnerId === player1Id).length
    const player2Wins = completed.filter(m => m.winnerId === player2Id).length
    
    return Promise.resolve({
      totalMatches: completed.length,
      player1Wins,
      player2Wins,
      recentResults: completed.slice(-5).map(m => ({
        date: m.matchDate,
        winner: m.winnerId,
        score: m.score
      }))
    })
  }, [isWorkerSupported, isWorkerReady, callWorker])

  const calculateTrends = useCallback((matches: Match[], playerId: string, periodDays = 30) => {
    if (isWorkerSupported && isWorkerReady) {
      return callWorker('CALCULATE_TRENDS', { matches, playerId, periodDays })
    }
    
    // Simple fallback - just return empty trends
    return Promise.resolve([])
  }, [isWorkerSupported, isWorkerReady, callWorker])

  const filterMatches = useCallback((matches: Match[], filters: any) => {
    if (isWorkerSupported && isWorkerReady) {
      return callWorker('FILTER_MATCHES', { matches, filters })
    }
    return filterMatchesFallback(matches, filters)
  }, [isWorkerSupported, isWorkerReady, callWorker, filterMatchesFallback])

  return {
    calculateStats,
    calculateHeadToHead,
    calculateTrends,
    filterMatches,
    isWorkerSupported,
    isWorkerReady
  }
}