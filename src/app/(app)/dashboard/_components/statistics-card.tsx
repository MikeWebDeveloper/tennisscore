"use client"

import { memo } from "react"
import { CardContent } from "@/components/ui/card"
import { GSAPAnimatedCounter } from "@/components/ui/gsap-animated-counter"
import { GSAPInteractiveCard } from "@/components/ui/gsap-interactive-card"
import { ArrowUpRight, ArrowDownLeft, LucideIcon } from "lucide-react"

interface StatisticsCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  subtitle?: string
  trend?: "up" | "down" | "neutral"
  className?: string
  variant?: "default" | "primary" | "success" | "warning" | "danger"
  cardIndex: number
  cardType?: "performance" | "serve" | "return" | "shotmaking" | "insights"
  cardAnimation: {
    getDelay: (index: number) => number
    shouldAnimate: (index: number) => boolean
  }
}

export const StatisticsCard = memo<StatisticsCardProps>(({ 
  icon: Icon, 
  label, 
  value, 
  subtitle,
  trend,
  className = "",
  variant = "default",
  cardIndex,
  cardType = "performance",
  cardAnimation
}) => {
  const getTrendIcon = () => {
    if (trend === "up") return <ArrowUpRight className="h-3 w-3 text-green-500" />
    if (trend === "down") return <ArrowDownLeft className="h-3 w-3 text-red-500" />
    return null
  }

  const getIconColor = () => {
    switch (variant) {
      case "primary":
        return "text-primary"
      case "success":
        return "text-green-500"
      case "warning":
        return "text-yellow-500"
      case "danger":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <GSAPInteractiveCard 
      variant={variant}
      cardType={cardType}
      className={className}
    >
      <CardContent className="p-3 md:p-4 lg:p-6 h-full">
        <div className="flex flex-col h-full justify-between">
          {/* Header with icon and trend */}
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <h4 className="text-xs md:text-sm text-gray-800 dark:text-muted-foreground font-medium truncate">{label}</h4>
              {getTrendIcon()}
            </div>
            <div className="p-1.5 md:p-2 lg:p-2.5 rounded-full bg-muted/50 group-hover:bg-muted/80 transition-colors duration-200 ml-2 flex-shrink-0">
              <Icon className={`h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 ${getIconColor()}`} aria-hidden="true" />
            </div>
          </div>
          
          {/* Value */}
          <div className="flex-1 flex items-center">
            <p className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-foreground group-hover:scale-105 transition-transform duration-200 font-mono leading-none">
              {typeof value === 'number' ? (
                <GSAPAnimatedCounter
                  value={value}
                  duration={1.8}
                  delay={cardAnimation.getDelay(cardIndex)}
                  shouldAnimate={cardAnimation.shouldAnimate(cardIndex)}
                />
              ) : typeof value === 'string' && value.includes('%') ? (
                <GSAPAnimatedCounter
                  value={parseInt(value.replace('%', ''))}
                  suffix="%"
                  duration={1.8}
                  delay={cardAnimation.getDelay(cardIndex)}
                  shouldAnimate={cardAnimation.shouldAnimate(cardIndex)}
                />
              ) : (
                value
              )}
            </p>
          </div>
          
          {/* Subtitle */}
          {subtitle && (
            <div className="mt-1">
              <p className="text-xs md:text-xs lg:text-sm text-gray-700 dark:text-muted-foreground/80 truncate leading-tight">
                {subtitle}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </GSAPInteractiveCard>
  )
})

StatisticsCard.displayName = "StatisticsCard"