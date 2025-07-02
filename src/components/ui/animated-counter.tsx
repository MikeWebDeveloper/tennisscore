"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface AnimatedCounterProps {
  value: number
  duration?: number
  delay?: number
  className?: string
  suffix?: string
  prefix?: string
  decimals?: number
}

export function AnimatedCounter({ 
  value, 
  duration = 1.5, 
  delay = 0, 
  className = "",
  suffix = "",
  prefix = "",
  decimals = 0
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
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

      const animationTime = elapsed - delay * 1000
      const progress = Math.min(animationTime / (duration * 1000), 1)
      
      // Easing function for smooth animation
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
      const easedProgress = easeOutCubic(progress)
      
      const currentValue = easedProgress * value
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value) // Ensure we end with exact value
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
  }, [value, duration, delay])

  const formatValue = (val: number) => {
    const rounded = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString()
    return `${prefix}${rounded}${suffix}`
  }

  return (
    <motion.span 
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        duration: 0.3, 
        delay: delay,
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
    >
      {formatValue(displayValue)}
    </motion.span>
  )
} 