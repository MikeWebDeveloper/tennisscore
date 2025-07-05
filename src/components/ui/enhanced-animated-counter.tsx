"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface EnhancedAnimatedCounterProps {
  value: number
  duration?: number
  delay?: number
  className?: string
  suffix?: string
  prefix?: string
  decimals?: number
  shouldAnimate?: boolean
  onAnimationComplete?: () => void
}

export function EnhancedAnimatedCounter({ 
  value, 
  duration = 2.5, 
  delay = 0, 
  className = "",
  suffix = "",
  prefix = "",
  decimals = 0,
  shouldAnimate = true,
  onAnimationComplete
}: EnhancedAnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayValue(value)
      return
    }

    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp

      const elapsed = timestamp - startTime

      if (elapsed < delay * 1000) {
        // Still in delay period
        animationFrame = requestAnimationFrame(animate)
        return
      }

      if (!hasStarted) {
        setHasStarted(true)
      }

      const animationTime = elapsed - delay * 1000
      const progress = Math.min(animationTime / (duration * 1000), 1)
      
      // Enhanced easing function for smoother animation
      const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      const easedProgress = easeOutExpo(progress)
      
      const currentValue = easedProgress * value
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value) // Ensure we end with exact value
        onAnimationComplete?.()
      }
    }

    // Start the animation
    animationFrame = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [value, duration, delay, shouldAnimate, hasStarted, onAnimationComplete])

  const formatValue = (val: number) => {
    const rounded = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString()
    return `${prefix}${rounded}${suffix}`
  }

  return (
    <motion.span 
      className={className}
      initial={{ scale: 1, opacity: 1 }}
      animate={{ 
        scale: 1, 
        opacity: 1 
      }}
      transition={{ 
        duration: 0.3, 
        type: "spring",
        stiffness: 150,
        damping: 25
      }}
    >
      {formatValue(displayValue)}
    </motion.span>
  )
}