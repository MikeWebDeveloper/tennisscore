"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"

interface UseGSAPCardAnimationOptions {
  totalCards: number
  staggerDelay: number
  startDelay?: number
}

export function useGSAPCardAnimation({
  totalCards,
  staggerDelay,
  startDelay = 0.5
}: UseGSAPCardAnimationOptions) {
  const [animatedCards, setAnimatedCards] = useState<Set<number>>(new Set())
  const [hasTriggered, setHasTriggered] = useState(false)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    const currentTimeline = timelineRef.current
    // Clean up previous timeline
    if (currentTimeline) {
      currentTimeline.kill()
    }

    // Simple sequential animation start
    const startAnimations = () => {
      if (typeof window === "undefined") return

      setHasTriggered(true)
      
      // Trigger cards sequentially
      for (let i = 0; i < totalCards; i++) {
        const delay = startDelay + (i * staggerDelay / 1000)
        
        gsap.delayedCall(delay, () => {
          setAnimatedCards(prev => new Set([...prev, i]))
        })
      }
    }

    // Start animations immediately when component mounts
    startAnimations()

    return () => {
      if (currentTimeline) {
        currentTimeline.kill()
      }
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