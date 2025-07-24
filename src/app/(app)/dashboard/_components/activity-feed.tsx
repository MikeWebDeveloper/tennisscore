"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Trophy, 
  Activity,
  Clock,
  ArrowRight,
  TrendingUp,
  Target
} from "lucide-react"
import Link from "next/link"
import { Match, Player } from "@/lib/types"
import { useTranslations } from "@/hooks/use-translations"

interface ActivityFeedProps {
  matches: Match[]
  mainPlayer: Player | null
}

interface ActivityItem {
  id: string
  type: 'match' | 'milestone' | 'insight'
  title: string
  description: string
  timestamp: Date
  icon: React.ReactNode
  color: string
  action?: {
    label: string
    href: string
  }
}

export function ActivityFeed({ matches, mainPlayer }: ActivityFeedProps) {
  const t = useTranslations()

  // Generate activity items from matches and stats
  const generateActivity = (): ActivityItem[] => {
    const activities: ActivityItem[] = []
    
    // Recent matches
    const recentMatches = matches.slice(0, 3)
    recentMatches.forEach((match) => {
      const isWin = match.winnerId === mainPlayer?.$id
      const opponent = match.playerOneId === mainPlayer?.$id 
        ? match.playerTwoName || 'Unknown'
        : match.playerOneName || 'Unknown'
      
      activities.push({
        id: `match-${match.$id}`,
        type: 'match',
        title: isWin ? t('wonAgainst').replace('{opponent}', opponent) : t('lostTo').replace('{opponent}', opponent),
        description: `${new Date(match.matchDate).toLocaleDateString()} • ${match.finalScore || t('scoreNotRecorded')}`,
        timestamp: new Date(match.matchDate),
        icon: <Trophy className={`h-4 w-4 ${isWin ? 'text-green-500' : 'text-orange-500'}`} />,
        color: isWin ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
        action: {
          label: t('viewMatch'),
          href: `/matches/${match.$id}`
        }
      })
    })

    // Calculate milestone activities
    const completedMatches = matches.filter(m => m.status === 'completed' || (m.status as string) === 'Completed')
    const wonMatches = completedMatches.filter(m => m.winnerId === mainPlayer?.$id)
    const winRate = completedMatches.length > 0 ? Math.round((wonMatches.length / completedMatches.length) * 100) : 0

    // Win rate milestones
    if (winRate >= 70) {
      activities.push({
        id: 'milestone-winrate',
        type: 'milestone',
        title: 'Excellent Win Rate!',
        description: `Winning ${winRate}% of matches - outstanding performance!`,
        timestamp: new Date(),
        icon: <Target className="h-4 w-4 text-green-500" />,
        color: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
        action: {
          label: t('viewStats'),
          href: '/statistics'
        }
      })
    } else if (winRate >= 50) {
      activities.push({
        id: 'milestone-winrate',
        type: 'milestone',
        title: t('goodWinRate'),
        description: t('winRateKeepImproving').replace('{percentage}', winRate.toString()),
        timestamp: new Date(),
        icon: <TrendingUp className="h-4 w-4 text-blue-500" />,
        color: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
        action: {
          label: t('viewStats'),
          href: '/statistics'
        }
      })
    }

    // Match count milestones
    if (completedMatches.length >= 50) {
      activities.push({
        id: 'milestone-matches',
        type: 'milestone',
        title: 'Milestone Reached!',
        description: `Played ${completedMatches.length} matches - impressive dedication!`,
        timestamp: new Date(),
        icon: <Trophy className="h-4 w-4 text-purple-500" />,
        color: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800'
      })
    }

    // Performance insights
    if (completedMatches.length >= 5) {
      const recentWins = matches.slice(0, 5).filter(m => m.winnerId === mainPlayer?.$id).length
      if (recentWins >= 4) {
        activities.push({
          id: 'insight-hotstreak',
          type: 'insight',
          title: 'Hot Streak!',
          description: `${recentWins} wins in last 5 matches - you're on fire!`,
          timestamp: new Date(),
          icon: <Activity className="h-4 w-4 text-red-500" />,
          color: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
        })
      }
    }

    // Sort by timestamp (most recent first)
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5)
  }

  const activities = generateActivity()

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            {t('recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">{t('noRecentActivity')}</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {t('startByRecordingFirstMatch')}
            </p>
            <Link href="/matches/create">
              <Button size="sm" className="mt-3">
                {t('newMatch')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              {t('recentActivity')}
            </CardTitle>
            <Link href="/matches">
              <Button variant="ghost" size="sm" className="text-xs">
                {t('viewAll')}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border ${activity.color}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 mt-0.5">
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground truncate">
                      {activity.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {activity.timestamp.toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                        {activity.type}
                      </Badge>
                    </div>
                  </div>
                </div>
                {activity.action && (
                  <Link href={activity.action.href}>
                    <Button variant="ghost" size="sm" className="text-xs h-8 px-2">
                      {activity.action.label}
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}