"use client"

import { motion } from "@/lib/framer-motion-config"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  Calendar, 
  Users, 
  TrendingUp
} from "lucide-react"

interface StatsCardsProps {
  stats: {
    totalMatches: number
    winRate: number
    totalPlayers: number
    completedMatches: number
    inProgressMatches: number
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  }
}

const numberVariants = {
  hidden: { opacity: 0 },
  show: { 
    opacity: 1,
    transition: { delay: 0.2, duration: 0.5 }
  }
}

const statsCards = [
  {
    key: "matches",
    title: "Total Matches",
    icon: Calendar,
    getValue: (stats: StatsCardsProps["stats"]) => stats.totalMatches,
    getSubtext: (stats: StatsCardsProps["stats"]) => `${stats.inProgressMatches} in progress`,
    className: "md:col-span-1",
    color: "text-blue-400"
  },
  {
    key: "winrate",
    title: "Win Rate",
    icon: Trophy,
    getValue: (stats: StatsCardsProps["stats"]) => 
      stats.completedMatches > 0 ? `${stats.winRate}%` : "-",
    getSubtext: (stats: StatsCardsProps["stats"]) => `${stats.completedMatches} completed`,
    className: "md:col-span-1",
    color: "text-primary"
  },
  {
    key: "players",
    title: "Players",
    icon: Users,
    getValue: (stats: StatsCardsProps["stats"]) => stats.totalPlayers,
    getSubtext: () => "Players created",
    className: "md:col-span-1",
    color: "text-green-400"
  },
  {
    key: "performance",
    title: "Performance",
    icon: TrendingUp,
    getValue: (stats: StatsCardsProps["stats"]) => {
      if (stats.completedMatches === 0) return "-"
      if (stats.winRate >= 70) return "Excellent"
      if (stats.winRate >= 60) return "Good"
      if (stats.winRate >= 40) return "Fair"
      return "Needs Work"
    },
    getSubtext: (stats: StatsCardsProps["stats"]) => 
      stats.completedMatches > 0 ? "Overall rating" : "No matches yet",
    className: "md:col-span-1",
    color: "text-purple-400"
  }
]

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      variants={{
        show: {
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
      initial="hidden"
      animate="show"
    >
      {statsCards.map((card) => (
        <motion.div
          key={card.key}
          variants={cardVariants}
          className={card.className}
          whileHover={{ 
            scale: 1.02,
            transition: { type: "spring", stiffness: 400, damping: 10 }
          }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <card.icon className={`h-5 w-5 ${card.color}`} />
                {card.key === "winrate" && stats.winRate >= 60 && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    Hot
                  </Badge>
                )}
              </div>
              
              <motion.div
                variants={numberVariants}
                className="space-y-1"
              >
                <p className="text-2xl font-bold text-slate-200 font-mono">
                  {card.getValue(stats)}
                </p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {card.title}
                </p>
                <p className="text-xs text-slate-400">
                  {card.getSubtext(stats)}
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
} 