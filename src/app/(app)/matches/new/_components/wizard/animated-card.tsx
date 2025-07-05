"use client"

import { useEffect, useRef, ReactNode } from "react"
import { gsap } from "gsap"
import { Card, CardContent } from "@/components/ui/card"

interface AnimatedCardProps {
  children: ReactNode
  isVisible: boolean
  direction?: "forward" | "backward"
  className?: string
}

export function AnimatedCard({ 
  children, 
  isVisible, 
  direction = "forward",
  className = ""
}: AnimatedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cardRef.current) return

    if (isVisible) {
      // Enter animation
      const enterDirection = direction === "forward" ? "100%" : "-100%"
      
      gsap.fromTo(cardRef.current, 
        { 
          x: enterDirection, 
          opacity: 0,
          scale: 0.95
        },
        { 
          x: "0%", 
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "back.out(1.7)"
        }
      )
    } else {
      // Exit animation
      const exitDirection = direction === "forward" ? "-100%" : "100%"
      
      gsap.to(cardRef.current, {
        x: exitDirection,
        opacity: 0,
        scale: 0.95,
        duration: 0.3,
        ease: "power2.in"
      })
    }
  }, [isVisible, direction])

  if (!isVisible) return null

  return (
    <div ref={cardRef} className="w-full">
      <Card className={`shadow-lg border-2 ${className}`}>
        <CardContent className="p-6">
          {children}
        </CardContent>
      </Card>
    </div>
  )
}