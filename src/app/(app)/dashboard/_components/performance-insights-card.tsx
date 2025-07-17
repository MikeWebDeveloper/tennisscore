"use client"

import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Flame, Calendar, Timer, Target, Activity, Zap } from "lucide-react"
import { StatisticsCard } from "./statistics-card"
import { EnhancedStats } from "@/lib/utils/dashboard-stats"

interface PerformanceInsightsCardProps {
  stats: EnhancedStats
  cardAnimation: {
    getDelay: (index: number) => number
    shouldAnimate: (index: number) => boolean
    hasTriggered: boolean
  }
}

export const PerformanceInsightsCard = memo<PerformanceInsightsCardProps>(({ 
  stats, 
  cardAnimation 
}) => {
  const StatCard = (props: Omit<Parameters<typeof StatisticsCard>[0], 'cardAnimation'>) => (
    <StatisticsCard {...props} cardAnimation={cardAnimation} />
  )

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
        <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-foreground">Performance Insights</h3>
        <Badge variant="outline" className="ml-auto text-xs">
          Advanced Analytics
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <StatCard 
          icon={Flame} 
          label="Recent Form" 
          value={`${Math.round(stats.recentForm)}%`}
          subtitle="Last 5 matches"
          trend={stats.recentForm >= 60 ? "up" : "down"}
          variant={stats.recentForm >= 80 ? "success" : stats.recentForm >= 60 ? "primary" : "warning"}
          cardIndex={16}
          cardType="insights"
        />
        <StatCard 
          icon={Calendar} 
          label="This Month" 
          value={stats.thisMonthMatches}
          subtitle="Matches played"
          variant={stats.thisMonthMatches >= 5 ? "success" : stats.thisMonthMatches >= 3 ? "primary" : "default"}
          cardIndex={17}
          cardType="insights"
        />
        <StatCard 
          icon={Timer} 
          label="Court Time" 
          value={stats.totalPlayingTime}
          subtitle="Total playing time"
          variant="primary"
          cardIndex={18}
          cardType="insights"
        />
        {stats.bestTimeOfDay && (
          <StatCard 
            icon={Target} 
            label="Peak Performance" 
            value={stats.bestTimeOfDay}
            subtitle="Best playing time"
            variant="success"
            cardIndex={19}
            cardType="insights"
          />
        )}
        <StatCard 
          icon={Activity} 
          label="Avg Duration" 
          value={stats.averageMatchDuration}
          subtitle="Per match"
          variant="default"
          cardIndex={stats.bestTimeOfDay ? 20 : 19}
          cardType="insights"
        />
        {stats.forehandBackhandRatio > 0 && (
          <StatCard 
            icon={Zap} 
            label="FH/BH Ratio" 
            value={`${stats.forehandBackhandRatio}:1`}
            subtitle="Forehand preference"
            variant={stats.forehandBackhandRatio >= 2 ? "primary" : "default"}
            cardIndex={stats.bestTimeOfDay ? 21 : 20}
            cardType="insights"
          />
        )}
      </div>
    </div>
  )
})

PerformanceInsightsCard.displayName = "PerformanceInsightsCard"