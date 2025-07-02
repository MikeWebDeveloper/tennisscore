"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { 
  Trophy, 
  Calendar, 
  Users, 
  TrendingUp
} from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"

interface StatsCardsProps {
  stats: {
    totalMatches: number
    winRate: number
    totalPlayers: number
    completedMatches: number
    inProgressMatches: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const t = useTranslations();

  const statsCards = [
    {
      key: "matches",
      title: t("totalMatches"),
      icon: Calendar,
      value: stats.totalMatches,
      isNumber: true,
      getSubtext: (stats: StatsCardsProps["stats"]) => 
        `${stats.inProgressMatches} ${t("inProgress")}, ${stats.completedMatches} ${t("completed")}`,
      className: "md:col-span-1",
      color: "text-blue-400"
    },
    {
      key: "winrate",
      title: t("winRate"),
      icon: Trophy,
      value: stats.winRate,
      suffix: "%",
      isNumber: true,
      getSubtext: () => {
        if (stats.winRate >= 80) return t("excellent")
        if (stats.winRate >= 65) return t("good")
        if (stats.winRate >= 50) return t("fair")
        return t("needsWork")
      },
      className: "md:col-span-1", 
      color: "text-yellow-400"
    },
    {
      key: "players",
      title: t("players"),
      icon: Users,
      value: stats.totalPlayers,
      isNumber: true,
      getSubtext: () => `${stats.totalPlayers} ${t("playersCreated")}`,
      className: "md:col-span-1",
      color: "text-green-400"
    },
    {
      key: "performance",
      title: t("performance"), 
      icon: TrendingUp,
      value: getPerformanceRating(stats.winRate),
      isNumber: false,
      getSubtext: () => t("overallRating"),
      className: "md:col-span-1 relative",
      color: "text-purple-400",
      badge: stats.winRate > 75 ? t("hot") : undefined
    }
  ]

  function getPerformanceRating(winRate: number): string {
    if (winRate >= 80) return t("excellent")
    if (winRate >= 65) return t("good") 
    if (winRate >= 50) return t("fair")
    return t("needsWork")
  }

  if (stats.totalMatches === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-muted-foreground p-8"
      >
        <p>{t("noMatchesYet")}</p>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ staggerChildren: 0.1 }}
    >
      {statsCards.map((card, index) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={card.className}
        >
          <Card className="relative overflow-hidden">
            {card.badge && (
              <Badge 
                variant="secondary" 
                className="absolute top-2 right-2 text-xs font-bold bg-red-600 text-white"
              >
                {card.badge}
              </Badge>
            )}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {card.isNumber ? (
                  <AnimatedCounter
                    value={typeof card.value === 'number' ? card.value : 0}
                    suffix={card.suffix || ""}
                    duration={1.2}
                    delay={index * 0.1}
                  />
                ) : (
                  card.value
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.getSubtext(stats)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
} 