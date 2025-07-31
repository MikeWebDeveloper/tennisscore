"use client"

import { useEffect, useRef, useState } from "react"

interface UseCardAnimationOptions {
  totalCards: number
  staggerDelay: number
  startDelay?: number
}

export function useCardAnimation({
  totalCards,
  staggerDelay,
  startDelay = 0.5
}: UseCardAnimationOptions) {
  const [animatedCards, setAnimatedCards] = useState<Set<number>>(new Set())
  const [hasTriggered, setHasTriggered] = useState(false)
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    // Clear any existing timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    timeoutsRef.current = []

    // Simple sequential animation start
    const startAnimations = () => {
      if (typeof window === "undefined") return

      setHasTriggered(true)
      
      // Trigger cards sequentially
      for (let i = 0; i < totalCards; i++) {
        const delay = (startDelay + (i * staggerDelay / 1000)) * 1000 // Convert to ms
        
        const timeout = setTimeout(() => {
          setAnimatedCards(prev => new Set([...prev, i]))
        }, delay)
        
        timeoutsRef.current.push(timeout)
      }
    }

    // Start animations immediately when component mounts
    startAnimations()

    // Cleanup
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      timeoutsRef.current = []
    }
  }, [totalCards, staggerDelay, startDelay])

  const shouldAnimate = (cardIndex: number) => animatedCards.has(cardIndex)
  const getDelay = (cardIndex: number) => startDelay + (cardIndex * staggerDelay / 1000)
  
  return {
    shouldAnimate,
    getDelay,
    hasTriggered,
    animatedCards
  }
}