"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  Flame,
  Trophy,
  Zap,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  X
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { InstantStats } from "@/lib/utils/instant-stats"
import { useTranslations } from "@/hooks/use-translations"

interface SmartNotificationsProps {
  stats: InstantStats
  playerName?: string
}

interface Notification {
  id: string
  type: 'milestone' | 'achievement' | 'insight' | 'warning' | 'tip'
  title: string
  message: string
  icon: React.ReactNode
  color: string
  priority: 'high' | 'medium' | 'low'
  action?: {
    label: string
    href: string
  }
  dismissible: boolean
}

export function SmartNotifications({ stats, playerName = 'Player' }: SmartNotificationsProps) {
  const t = useTranslations()
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set())

  useEffect(() => {
    const saved = localStorage.getItem('dismissed-notifications')
    if (saved) {
      setDismissedNotifications(new Set(JSON.parse(saved)))
    }
  }, [])

  const generateNotifications = (): Notification[] => {
    const notifications: Notification[] = []

    // Hot streak notification
    if (stats.isOnFire) {
      notifications.push({
        id: 'on-fire',
        type: 'achievement',
        title: '🔥 You\'re On Fire!',
        message: `4 wins in your last 5 matches! Keep the momentum going.`,
        icon: <Flame className="h-5 w-5 text-red-500" />,
        color: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
        priority: 'high',
        action: {
          label: 'View Stats',
          href: '/player-statistics'
        },
        dismissible: true
      })
    }

    // Win streak milestone
    if (stats.currentStreak >= 5 && stats.currentStreak % 5 === 0) {
      notifications.push({
        id: `streak-${stats.currentStreak}`,
        type: 'milestone',
        title: `🏆 ${stats.currentStreak} Win Streak!`,
        message: `Outstanding! You've won ${stats.currentStreak} matches in a row.`,
        icon: <Trophy className="h-5 w-5 text-yellow-500" />,
        color: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
        priority: 'high',
        dismissible: true
      })
    }

    // Performance improvement
    if (stats.improvement === 1) {
      notifications.push({
        id: 'improvement',
        type: 'insight',
        title: '📈 Performance Improving!',
        message: `Your recent form is better than before. Keep up the good work!`,
        icon: <TrendingUp className="h-5 w-5 text-green-500" />,
        color: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
        priority: 'medium',
        dismissible: true
      })
    }

    // Performance decline warning
    if (stats.improvement === -1 && stats.totalMatches >= 10) {
      notifications.push({
        id: 'decline-warning',
        type: 'warning',
        title: '⚠️ Form Dip Detected',
        message: `Recent performance is below your usual standard. Consider reviewing your game.`,
        icon: <TrendingDown className="h-5 w-5 text-orange-500" />,
        color: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
        priority: 'medium',
        action: {
          label: 'View Analysis',
          href: '/player-statistics'
        },
        dismissible: true
      })
    }

    // Next milestone progress
    if (stats.nextMilestone.progress >= 80) {
      notifications.push({
        id: `milestone-${stats.nextMilestone.type}-${stats.nextMilestone.target}`,
        type: 'milestone',
        title: '🎯 Milestone Almost Reached!',
        message: `You're ${100 - stats.nextMilestone.progress}% away from your next ${stats.nextMilestone.type} milestone.`,
        icon: <Target className="h-5 w-5 text-purple-500" />,
        color: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
        priority: 'medium',
        dismissible: true
      })
    }

    // Monthly performance insights
    if (stats.thisMonth.matches >= 5) {
      const monthlyPerformance = stats.thisMonth.winRate
      if (monthlyPerformance >= 70) {
        notifications.push({
          id: 'monthly-excellent',
          type: 'achievement',
          title: '✨ Excellent Month!',
          message: `${monthlyPerformance}% win rate this month with ${stats.thisMonth.matches} matches played.`,
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          color: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
          priority: 'medium',
          dismissible: true
        })
      }
    }

    // Comeback story
    if (stats.lastMonthComparison.winRateChange >= 15) {
      notifications.push({
        id: 'comeback',
        type: 'achievement',
        title: t('amazingComebackTitle'),
        message: t('amazingComebackMessage').replace('{percentage}', stats.lastMonthComparison.winRateChange.toString()),
        icon: <Zap className="h-5 w-5 text-blue-500" />,
        color: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
        priority: 'high',
        dismissible: true
      })
    }

    // Playing frequency tip
    if (stats.thisMonth.matches < 3 && stats.totalMatches >= 10) {
      notifications.push({
        id: 'play-more-tip',
        type: 'tip',
        title: t('stayActiveTitle'),
        message: t('stayActiveMessage').replace('{count}', stats.thisMonth.matches.toString()),
        icon: <AlertCircle className="h-5 w-5 text-blue-500" />,
        color: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
        priority: 'low',
        action: {
          label: t('scheduleMatch'),
          href: '/matches/create'
        },
        dismissible: true
      })
    }

    // Filter out dismissed notifications
    return notifications
      .filter(n => !dismissedNotifications.has(n.id))
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
      .slice(0, 3) // Show max 3 notifications
  }

  const notifications = generateNotifications()

  const handleDismiss = (id: string) => {
    const newDismissed = new Set(dismissedNotifications)
    newDismissed.add(id)
    setDismissedNotifications(newDismissed)
    localStorage.setItem('dismissed-notifications', JSON.stringify(Array.from(newDismissed)))
  }

  if (notifications.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-3"
    >
      {notifications.map((notification, index) => (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`${notification.color} shadow-sm`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 mt-0.5">
                    {notification.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-foreground">
                        {notification.title}
                      </h4>
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                        {notification.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {notification.message}
                    </p>
                    {notification.action && (
                      <div className="mt-2">
                        <Link href={notification.action.href}>
                          <Button variant="ghost" size="sm" className="text-xs h-7 px-2 hover:bg-background/80">
                            {notification.action.label}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
                {notification.dismissible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(notification.id)}
                    className="h-7 w-7 p-0 hover:bg-background/80"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}