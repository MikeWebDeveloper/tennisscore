"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { Card } from "@/components/ui/card"

interface GSAPInteractiveCardProps {
  children: React.ReactNode
  variant?: "default" | "primary" | "success" | "warning" | "danger"
  cardType?: "performance" | "serve" | "return" | "shotmaking" | "insights"
  className?: string
}

export function GSAPInteractiveCard({ 
  children, 
  variant = "default",
  cardType = "performance",
  className = ""
}: GSAPInteractiveCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current
    const content = contentRef.current
    if (!card || !content) return

    // Different animation styles for different card types
    const getAnimationConfig = () => {
      switch (cardType) {
        case "performance":
          return {
            hover: { scale: 1.05, rotationY: 5, duration: 0.3, ease: "power2.out" },
            tap: { scale: 0.98, rotationY: -2, duration: 0.15, ease: "power2.inOut" },
            glow: { boxShadow: "0 0 20px rgba(57, 255, 20, 0.4)" }
          }
        case "serve":
          return {
            hover: { scale: 1.03, y: -5, duration: 0.3, ease: "back.out(1.2)" },
            tap: { scale: 0.95, y: 2, duration: 0.15, ease: "power2.inOut" },
            glow: { boxShadow: "0 5px 25px rgba(99, 102, 241, 0.4)" }
          }
        case "return":
          return {
            hover: { scale: 1.04, rotationX: 3, duration: 0.3, ease: "power3.out" },
            tap: { scale: 0.96, rotationX: -1, duration: 0.15, ease: "power2.inOut" },
            glow: { boxShadow: "0 0 30px rgba(239, 68, 68, 0.3)" }
          }
        case "shotmaking":
          return {
            hover: { scale: 1.06, rotation: 1, duration: 0.3, ease: "elastic.out(1, 0.5)" },
            tap: { scale: 0.94, rotation: -0.5, duration: 0.15, ease: "power2.inOut" },
            glow: { boxShadow: "0 8px 32px rgba(245, 158, 11, 0.4)" }
          }
        case "insights":
          return {
            hover: { scale: 1.08, y: -8, duration: 0.4, ease: "power4.out" },
            tap: { scale: 0.92, y: 2, duration: 0.2, ease: "power3.inOut" },
            glow: { boxShadow: "0 12px 40px rgba(168, 85, 247, 0.5)" }
          }
        default:
          return {
            hover: { scale: 1.02, duration: 0.3, ease: "power2.out" },
            tap: { scale: 0.98, duration: 0.15, ease: "power2.inOut" },
            glow: { boxShadow: "0 4px 20px rgba(148, 163, 184, 0.3)" }
          }
      }
    }

    const config = getAnimationConfig()

    // Hover enter animation
    const handleMouseEnter = () => {
      gsap.to(card, {
        ...config.hover,
        ...config.glow
      })
      
      // Subtle content animation
      gsap.to(content, {
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out"
      })
    }

    // Hover leave animation
    const handleMouseLeave = () => {
      gsap.to(card, {
        scale: 1,
        y: 0,
        rotation: 0,
        rotationX: 0,
        rotationY: 0,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        duration: 0.3,
        ease: "power2.out"
      })

      gsap.to(content, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      })
    }

    // Touch/Click animations for mobile
    const handleTouchStart = () => {
      gsap.to(card, {
        ...config.tap,
        duration: 0.1
      })
    }

    const handleTouchEnd = () => {
      gsap.to(card, {
        scale: 1,
        y: 0,
        rotation: 0,
        rotationX: 0,
        rotationY: 0,
        duration: 0.2,
        ease: "back.out(1.1)"
      })
    }

    // Add event listeners
    card.addEventListener("mouseenter", handleMouseEnter)
    card.addEventListener("mouseleave", handleMouseLeave)
    card.addEventListener("touchstart", handleTouchStart)
    card.addEventListener("touchend", handleTouchEnd)
    card.addEventListener("touchcancel", handleTouchEnd)

    // Cleanup
    return () => {
      card.removeEventListener("mouseenter", handleMouseEnter)
      card.removeEventListener("mouseleave", handleMouseLeave)
      card.removeEventListener("touchstart", handleTouchStart)
      card.removeEventListener("touchend", handleTouchEnd)
      card.removeEventListener("touchcancel", handleTouchEnd)
    }
  }, [cardType])

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
    <div ref={cardRef} className={className}>
      <Card className={`h-24 md:h-32 lg:h-36 transition-colors duration-300 cursor-pointer group ${getVariantClasses()}`}>
        <div ref={contentRef} className="h-full">
          {children}
        </div>
      </Card>
    </div>
  )
}