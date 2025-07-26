"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"

interface FramerInteractiveCardProps {
  children: React.ReactNode
  variant?: "default" | "primary" | "success" | "warning" | "danger"
  cardType?: "performance" | "serve" | "return" | "shotmaking" | "insights"
  className?: string
}

export function FramerInteractiveCard({ 
  children, 
  variant = "default",
  cardType = "performance",
  className = ""
}: FramerInteractiveCardProps) {
  // Different animation styles for different card types
  const getAnimationConfig = () => {
    switch (cardType) {
      case "performance":
        return {
          hover: { scale: 1.05, rotateY: 5 },
          tap: { scale: 0.98, rotateY: -2 },
          glow: "0 0 20px rgba(57, 255, 20, 0.4)"
        }
      case "serve":
        return {
          hover: { scale: 1.03, y: -5 },
          tap: { scale: 0.95, y: 2 },
          glow: "0 5px 25px rgba(99, 102, 241, 0.4)"
        }
      case "return":
        return {
          hover: { scale: 1.04, rotateX: 3 },
          tap: { scale: 0.96, rotateX: -1 },
          glow: "0 0 30px rgba(239, 68, 68, 0.3)"
        }
      case "shotmaking":
        return {
          hover: { scale: 1.06, rotate: 1 },
          tap: { scale: 0.94, rotate: -0.5 },
          glow: "0 8px 32px rgba(245, 158, 11, 0.4)"
        }
      case "insights":
        return {
          hover: { scale: 1.08, y: -8 },
          tap: { scale: 0.92, y: 2 },
          glow: "0 12px 40px rgba(168, 85, 247, 0.5)"
        }
      default:
        return {
          hover: { scale: 1.02 },
          tap: { scale: 0.98 },
          glow: "0 4px 20px rgba(148, 163, 184, 0.3)"
        }
    }
  }

  const config = getAnimationConfig()

  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "border-primary/20 hover:border-primary/40 bg-primary/5"
      case "success":
        return "border-green-500/20 hover:border-green-500/40 bg-green-500/5"
      case "warning":
        return "border-yellow-500/20 hover:border-yellow-500/40 bg-yellow-500/5"
      case "danger":
        return "border-red-500/20 hover:border-red-500/40 bg-red-500/5"
      default:
        return "border-border hover:border-border/80"
    }
  }

  return (
    <motion.div 
      className={className}
      whileHover={config.hover}
      whileTap={config.tap}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      style={{
        transformStyle: "preserve-3d"
      }}
    >
      <Card 
        className={`h-24 md:h-32 lg:h-36 transition-colors duration-300 cursor-pointer group ${getVariantClasses()}`}
        style={{
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <motion.div 
          className="h-full"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </Card>
    </motion.div>
  )
}