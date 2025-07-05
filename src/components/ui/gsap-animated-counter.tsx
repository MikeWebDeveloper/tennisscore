"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"

interface GSAPAnimatedCounterProps {
  value: number
  duration?: number
  delay?: number
  className?: string
  suffix?: string
  prefix?: string
  decimals?: number
  shouldAnimate?: boolean
  onAnimationComplete?: () => void
  ease?: string
}

export function GSAPAnimatedCounter({ 
  value, 
  duration = 2.0, 
  delay = 0, 
  className = "",
  suffix = "",
  prefix = "",
  decimals = 0,
  shouldAnimate = true,
  onAnimationComplete,
  ease = "power2.out"
}: GSAPAnimatedCounterProps) {
  const counterRef = useRef<HTMLSpanElement>(null)
  const countRef = useRef({ value: 0 })

  useEffect(() => {
    if (!counterRef.current) return

    const element = counterRef.current
    
    const formatValue = (val: number) => {
      const rounded = decimals > 0 ? val.toFixed(decimals) : Math.round(val)
      return `${prefix}${rounded}${suffix}`
    }
    
    // Always start with 0 and show it immediately
    countRef.current.value = 0
    element.textContent = formatValue(0)
    
    if (!shouldAnimate) {
      // If not animating, set final value immediately
      countRef.current.value = value
      element.textContent = formatValue(value)
      return
    }

    // Simple GSAP animation from 0 to target value
    const tl = gsap.timeline({ delay })
    
    tl.to(countRef.current, {
      value: value,
      duration: duration,
      ease: ease,
      onUpdate: () => {
        const currentValue = countRef.current.value
        const formatted = formatValue(currentValue)
        element.textContent = formatted
      },
      onComplete: () => {
        // Ensure final value is exact
        countRef.current.value = value
        element.textContent = formatValue(value)
        onAnimationComplete?.()
      }
    })

    return () => {
      tl.kill()
    }
  }, [value, duration, delay, shouldAnimate, onAnimationComplete, ease, decimals, prefix, suffix])

  const formatValue = (val: number) => {
    const rounded = decimals > 0 ? val.toFixed(decimals) : Math.round(val)
    return `${prefix}${rounded}${suffix}`
  }

  return (
    <span 
      ref={counterRef}
      className={`inline-block ${className}`}
    >
      {formatValue(0)}
    </span>
  )
}