"use client"

import { useEffect, useRef } from "react"
import { useMotionValue, useTransform, animate, motion } from "framer-motion"

interface FramerAnimatedCounterProps {
  value: number
  duration?: number
  delay?: number
  className?: string
  suffix?: string
  prefix?: string
  decimals?: number
  shouldAnimate?: boolean
  onAnimationComplete?: () => void
  ease?: "linear" | "easeIn" | "easeOut" | "easeInOut" | "circIn" | "circOut" | "circInOut" | "backIn" | "backOut" | "backInOut" | "anticipate"
}

export function FramerAnimatedCounter({ 
  value, 
  duration = 2.0, 
  delay = 0, 
  className = "",
  suffix = "",
  prefix = "",
  decimals = 0,
  shouldAnimate = true,
  onAnimationComplete,
  ease = "easeOut"
}: FramerAnimatedCounterProps) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, latest => {
    const val = decimals > 0 ? latest.toFixed(decimals) : Math.round(latest)
    return `${prefix}${val}${suffix}`
  })

  useEffect(() => {
    if (!shouldAnimate) {
      count.set(value)
      return
    }

    // Reset to 0 first
    count.set(0)

    // Animate after delay
    const timer = setTimeout(() => {
      const controls = animate(count, value, {
        duration,
        ease,
        onComplete: onAnimationComplete
      })

      return () => controls.stop()
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [value, duration, delay, shouldAnimate, onAnimationComplete, ease, count])

  return (
    <motion.span className={`inline-block ${className}`}>
      {rounded}
    </motion.span>
  )
}