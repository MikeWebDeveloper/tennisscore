"use client"

import { motion } from "framer-motion"
import { Flame } from "lucide-react"

interface FlameIconProps {
  className?: string
  size?: number
  streak?: number
}

export function FlameIcon({ className = "", size = 16, streak = 0 }: FlameIconProps) {
  // Animation variants for the flame
  const flameVariants = {
    initial: { 
      scale: 0,
      opacity: 0,
      rotate: -10
    },
    animate: { 
      scale: [1, 1.1, 1],
      opacity: [0.8, 1, 0.8],
      rotate: [-5, 5, -5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    },
    exit: {
      scale: 0,
      opacity: 0,
      transition: { duration: 0.3 }
    }
  }

  // Color intensity based on streak length
  const getFlameColor = () => {
    if (streak >= 10) return "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" // White hot
    if (streak >= 8) return "text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]" // Blue flame
    if (streak >= 6) return "text-orange-400 drop-shadow-[0_0_4px_rgba(251,146,60,0.6)]" // Orange
    return "text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]" // Regular red
  }

  return (
    <motion.div
      className={`inline-flex items-center justify-center ${className}`}
      variants={flameVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Flame 
        size={size} 
        className={`${getFlameColor()} filter drop-shadow-sm`}
        fill="currentColor"
      />
      {streak >= 8 && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${
              streak >= 10 
                ? 'rgba(255,255,255,0.3)' 
                : 'rgba(59,130,246,0.3)'
            } 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut" as const
          }}
        />
      )}
    </motion.div>
  )
} 