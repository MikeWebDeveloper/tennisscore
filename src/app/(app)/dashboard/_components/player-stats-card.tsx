"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { GSAPAnimatedCounter } from "@/components/ui/gsap-animated-counter"
import { Calendar } from "lucide-react"
import { EnhancedStats } from "@/lib/utils/dashboard-stats"
import { useTranslations } from "@/hooks/use-translations"

interface PlayerStatsCardProps {
  stats: EnhancedStats
  cardAnimation: {
    hasTriggered: boolean
  }
}

export const PlayerStatsCard = memo<PlayerStatsCardProps>(({ 
  stats, 
  cardAnimation 
}) => {
  const t = useTranslations()

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6 }}
    >
      <Card className="hover:shadow-md transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">{t("thisMonthHeader")}</h3>
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                <GSAPAnimatedCounter 
                  value={stats.thisMonthMatches} 
                  duration={2.0} 
                  delay={12.0} // Start after main cards complete
                  shouldAnimate={cardAnimation.hasTriggered}
                  ease="elastic.out(1, 0.5)"
                />
              </div>
              <div className="text-xs text-gray-700 dark:text-muted-foreground">{t("matchesLabel")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                <GSAPAnimatedCounter 
                  value={Math.round(stats.thisMonthMatches * stats.winRate / 100)} 
                  duration={2.0} 
                  delay={12.5}
                  shouldAnimate={cardAnimation.hasTriggered}
                  ease="power4.out"
                />
              </div>
              <div className="text-xs text-gray-700 dark:text-muted-foreground">{t("wonLabel")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">{stats.averageMatchDuration}</div>
              <div className="text-xs text-gray-700 dark:text-muted-foreground">{t("avgDurationLabel")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                <GSAPAnimatedCounter 
                  value={stats.currentWinStreak} 
                  duration={2.0} 
                  delay={13.0}
                  shouldAnimate={cardAnimation.hasTriggered}
                  ease="bounce.out"
                />
              </div>
              <div className="text-xs text-gray-700 dark:text-muted-foreground">{t("winStreakMonthlyLabel")}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

PlayerStatsCard.displayName = "PlayerStatsCard"