"use client"

import { useEffect, useState } from "react"

interface UseSequentialAnimationOptions {
  totalItems: number
  isVisible: boolean
  itemDuration: number
  staggerDelay: number
  startDelay?: number
}

export function useSequentialAnimation({
  totalItems,
  isVisible,
  itemDuration,
  staggerDelay,
  startDelay = 0
}: UseSequentialAnimationOptions) {
  const [animatedItems, setAnimatedItems] = useState<Set<number>>(new Set())
  const [currentIndex, setCurrentIndex] = useState(-1)

  useEffect(() => {
    if (!isVisible || totalItems === 0) {
      setAnimatedItems(new Set())
      setCurrentIndex(-1)
      return
    }

    const timeouts: NodeJS.Timeout[] = []

    // Start the sequential animation
    const startAnimation = () => {
      for (let i = 0; i < totalItems; i++) {
        const delay = startDelay + (i * staggerDelay)
        
        const timeout = setTimeout(() => {
          setCurrentIndex(i)
          setAnimatedItems(prev => new Set([...prev, i]))
        }, delay)
        
        timeouts.push(timeout)
      }
    }

    startAnimation()

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [isVisible, totalItems, itemDuration, staggerDelay, startDelay])

  const shouldAnimate = (index: number) => animatedItems.has(index)
  const isCurrentlyAnimating = (index: number) => index === currentIndex
  const getDelay = (index: number) => startDelay + (index * staggerDelay)

  return {
    shouldAnimate,
    isCurrentlyAnimating,
    getDelay,
    currentIndex,
    animatedItems
  }
}