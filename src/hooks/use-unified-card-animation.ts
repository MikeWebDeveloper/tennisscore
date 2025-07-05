"use client"

import { useEffect, useState } from "react"

interface UseUnifiedCardAnimationOptions {
  totalCards: number
  isVisible: boolean
  cardDuration: number
  staggerDelay: number
  startDelay?: number
}

export function useUnifiedCardAnimation({
  totalCards,
  isVisible,
  cardDuration,
  staggerDelay,
  startDelay = 0
}: UseUnifiedCardAnimationOptions) {
  const [animatedCards, setAnimatedCards] = useState<Set<number>>(new Set())
  const [currentCardIndex, setCurrentCardIndex] = useState(-1)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    // Reset animation state when visibility changes
    if (!isVisible) {
      setAnimatedCards(new Set())
      setCurrentCardIndex(-1)
      setHasStarted(false)
      return
    }

    // Prevent multiple starts
    if (hasStarted) return

    const timeouts: NodeJS.Timeout[] = []

    // Start the unified animation sequence
    const startUnifiedAnimation = () => {
      setHasStarted(true)
      
      for (let i = 0; i < totalCards; i++) {
        const delay = startDelay + (i * staggerDelay)
        
        const timeout = setTimeout(() => {
          setCurrentCardIndex(i)
          setAnimatedCards(prev => new Set([...prev, i]))
        }, delay)
        
        timeouts.push(timeout)
      }
    }

    startUnifiedAnimation()

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [isVisible, totalCards, cardDuration, staggerDelay, startDelay, hasStarted])

  const shouldAnimate = (cardIndex: number) => animatedCards.has(cardIndex)
  const isCurrentlyAnimating = (cardIndex: number) => cardIndex === currentCardIndex
  const getDelay = (cardIndex: number) => startDelay + (cardIndex * staggerDelay)

  return {
    shouldAnimate,
    isCurrentlyAnimating,
    getDelay,
    currentCardIndex,
    animatedCards,
    hasStarted
  }
}