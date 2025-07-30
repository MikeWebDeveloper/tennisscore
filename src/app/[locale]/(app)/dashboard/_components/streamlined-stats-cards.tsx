"use client"

import { motion } from "framer-motion"
import { ArrowRight, TrendingUp, Trophy, Target, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Match, Player } from "@/lib/types"
import { useTranslations } from "@/i18n"
import { useRouter } from "next/navigation"

interface StreamlinedStatsCardsProps {
  matches: Match[]
  mainPlayer: Player
}

export function StreamlinedStatsCards({ matches, mainPlayer }: StreamlinedStatsCardsProps) {
  const t = useTranslations('dashboard')
  const commonT = useTranslations('common')
  const router = useRouter()

  // Filter for singles matches only and handle status casing
  const singlesMatches = matches.filter(m => !m.isDoubles)
  const completedMatches = singlesMatches.filter(m => m.status === 'completed')
  const wonMatches = completedMatches.filter(m => m.winnerId === mainPlayer.$id)
  const winRate = completedMatches.length > 0 ? Math.round((wonMatches.length / completedMatches.length) * 100) : 0
  
  // Calculate recent form (last 5 matches)
  const recentMatches = completedMatches.slice(-5)
  const recentWins = recentMatches.filter(m => m.winnerId === mainPlayer.$id).length
  const recentForm = recentMatches.length > 0 ? Math.round((recentWins / recentMatches.length) * 100) : 0

  // Calculate average match duration
  const matchesWithDuration = completedMatches.filter(m => m.startTime && m.endTime)
  const avgDuration = matchesWithDuration.length > 0 
    ? Math.round(matchesWithDuration.reduce((sum, m) => {
        const start = new Date(m.startTime!).getTime()
        const end = new Date(m.endTime!).getTime()
        return sum + ((end - start) / (1000 * 60)) // Convert to minutes
      }, 0) / matchesWithDuration.length)
    : 0

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const handleRedirectToStats = () => {
    router.push('/statistics')
  }

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: { y: -4, transition: { duration: 0.2 } }
  }

  const statsCards = [
    {
      icon: Trophy,
      title: t('winRate'),
      value: `${winRate}%`,
      subtitle: `${wonMatches.length}/${completedMatches.length} ${t('matchesWon')}`,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      icon: TrendingUp,
      title: t('recentForm'),
      value: `${recentForm}%`,
      subtitle: t('last5Matches'),
      color: recentForm >= winRate ? 'text-green-500' : 'text-orange-500',
      bgColor: recentForm >= winRate ? 'bg-green-500/10' : 'bg-orange-500/10'
    },
    {
      icon: Target,
      title: t('totalMatches'),
      value: completedMatches.length.toString(),
      subtitle: singlesMatches.filter(m => m.status === 'in-progress').length > 0 
        ? t('inProgressWithCount', { count: singlesMatches.filter(m => m.status === 'in-progress').length })
        : t('completedMatches'),
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      icon: Clock,
      title: t('avgDuration'),
      value: avgDuration > 0 ? formatDuration(avgDuration) : '--',
      subtitle: t('perMatch'),
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {statsCards.map((card, index) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.title}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card 
              className={`group cursor-pointer transition-all duration-200 hover:shadow-sm border hover:border-primary/20 ${card.bgColor} h-[120px] sm:h-[130px] md:h-[140px]`}
              onClick={handleRedirectToStats}
            >
              <CardContent className="p-2 sm:p-3 md:p-4 text-center h-full flex flex-col justify-between">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`p-1.5 sm:p-2 rounded-lg w-fit mx-auto mb-1.5 sm:mb-2 md:mb-3 ${card.bgColor} border ${card.color}`}>
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
                  </div>
                  <div className="w-full">
                    <h4 className={`font-medium text-xs sm:text-sm ${card.color} group-hover:opacity-80 transition-opacity mb-1 text-center leading-tight break-words overflow-hidden`} 
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as const,
                          wordWrap: 'break-word',
                          maxHeight: '2.5rem'
                        }}>
                      {card.title}
                    </h4>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center flex-1 min-h-0">
                  <div className="flex items-baseline justify-center gap-1 mb-1">
                    <span className="text-base sm:text-lg font-bold text-foreground truncate">
                      {card.value}
                    </span>
                  </div>
                  <div className="w-full px-1">
                    <p className="text-xs text-muted-foreground leading-tight text-center break-words overflow-hidden"
                       style={{
                         display: '-webkit-box',
                         WebkitLineClamp: 2,
                         WebkitBoxOrient: 'vertical' as const,
                         wordWrap: 'break-word',
                         maxHeight: '2rem'
                       }}>
                      {card.subtitle}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}