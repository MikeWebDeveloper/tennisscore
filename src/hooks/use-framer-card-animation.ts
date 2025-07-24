"use client"

import { useEffect, useState } from "react"

interface UseFramerCardAnimationOptions {
  totalCards: number
  staggerDelay: number
  startDelay?: number
}

export function useFramerCardAnimation({
  totalCards,
  staggerDelay,
  startDelay = 0.5
}: UseFramerCardAnimationOptions) {
  const [animatedCards, setAnimatedCards] = useState<Set<number>>(new Set())
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    const timers: NodeJS.Timeout[] = []

    // Simple sequential animation start
    const startAnimations = () => {
      if (typeof window === "undefined") return

      setHasTriggered(true)
      
      // Trigger cards sequentially
      for (let i = 0; i < totalCards; i++) {
        const delay = startDelay * 1000 + (i * staggerDelay)
        
        const timer = setTimeout(() => {
          setAnimatedCards(prev => new Set([...prev, i]))
        }, delay)
        
        timers.push(timer)
      }
    }

    // Start animations immediately when component mounts
    startAnimations()

    return () => {
      timers.forEach(timer => clearTimeout(timer))
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