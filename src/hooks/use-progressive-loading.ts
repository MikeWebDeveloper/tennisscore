"use client"

import { useState, useEffect, useCallback } from "react"

interface UseProgressiveLoadingOptions {
  initialDelay?: number
  staggerDelay?: number
  enableStaggering?: boolean
}

export function useProgressiveLoading(
  totalSteps: number,
  options: UseProgressiveLoadingOptions = {}
) {
  const {
    initialDelay = 100,
    staggerDelay = 50,
    enableStaggering = true
  } = options

  const [loadingStates, setLoadingStates] = useState<boolean[]>(
    new Array(totalSteps).fill(false)
  )
  const [isComplete, setIsComplete] = useState(false)

  const startLoading = useCallback(() => {
    if (!enableStaggering) {
      // Load all at once
      setLoadingStates(new Array(totalSteps).fill(true))
      setIsComplete(true)
      return
    }

    // Progressive loading with staggering
    const timers: NodeJS.Timeout[] = []
    
    for (let i = 0; i < totalSteps; i++) {
      const timer = setTimeout(() => {
        setLoadingStates(prev => {
          const newState = [...prev]
          newState[i] = true
          return newState
        })
        
        // Check if this is the last step
        if (i === totalSteps - 1) {
          setIsComplete(true)
        }
      }, initialDelay + (i * staggerDelay))
      
      timers.push(timer)
    }

    // Cleanup function
    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [totalSteps, initialDelay, staggerDelay, enableStaggering])

  const resetLoading = useCallback(() => {
    setLoadingStates(new Array(totalSteps).fill(false))
    setIsComplete(false)
  }, [totalSteps])

  useEffect(() => {
    const cleanup = startLoading()
    return cleanup
  }, [startLoading])

  return {
    loadingStates,
    isComplete,
    resetLoading,
    isStepLoaded: (step: number) => loadingStates[step] || false
  }
}