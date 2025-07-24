"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  Calendar,
  Flame,
  Plus,
  Activity,
  TrendingUp,
  BarChart3,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { Match, Player } from "@/lib/types"
import { useTranslations } from "@/hooks/use-translations"
import { getCachedInstantStats } from "@/lib/utils/instant-stats"
import { Changelog } from "./changelog"
import { ActivityFeed } from "./activity-feed"
import { SmartNotifications } from "./smart-notifications"

interface MinimalDashboardProps {
  matches: Match[]
  mainPlayer: Player | null
  totalMatches: number
  isLimitedData: boolean
}

export function MinimalDashboard({ matches, mainPlayer, totalMatches, isLimitedData }: MinimalDashboardProps) {
  const t = useTranslations()

  // Use instant stats for lightning-fast loading
  const stats = getCachedInstantStats(matches, mainPlayer?.$id)
  
  // Get last match for quick reference
  const lastMatch = matches.length > 0 ? matches[0] : null
  const lastMatchResult = lastMatch?.winnerId === mainPlayer?.$id ? 'Won' : 'Lost'
  
  return (
    <div className="space-y-6">
      {/* Hero Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {/* Win Rate */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Trophy className="h-5 w-5 text-primary" />
              <Badge variant={stats.winRate >= 70 ? "default" : stats.winRate >= 50 ? "secondary" : "outline"}>
                {stats.winRate >= 70 ? t("excellent") : stats.winRate >= 50 ? t("good") : t("improving")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.winRate}%</div>
            <p className="text-sm text-muted-foreground">{t("winRate")}</p>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Flame className="h-5 w-5 text-orange-500" />
              <Badge variant={stats.currentStreak >= 3 ? "default" : "outline"}>
                {stats.isOnFire ? t("onFire") : stats.isHotStreak ? t("hot") : stats.currentStreak >= 3 ? t("good") : t("building")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.currentStreak}</div>
            <p className="text-sm text-muted-foreground">{t("winStreakLabel")}</p>
          </CardContent>
        </Card>

        {/* Total Matches */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Calendar className="h-5 w-5 text-blue-500" />
              <Badge variant="outline">{stats.totalMatches} {t("played")}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{totalMatches}</div>
            <p className="text-sm text-muted-foreground">{t("totalMatches")}</p>
          </CardContent>
        </Card>

        {/* Last Match */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-green-500" />
              {lastMatch && (
                <Badge variant={lastMatchResult === 'Won' ? "default" : "destructive"}>
                  {lastMatchResult === 'Won' ? t("won") : t("lost")}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-green-500">
              {lastMatch ? new Date(lastMatch.matchDate).toLocaleDateString() : t("noMatches")}
            </div>
            <p className="text-sm text-muted-foreground">{t("lastMatch")}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Smart Notifications */}
      <SmartNotifications 
        stats={stats} 
        playerName={mainPlayer?.firstName || 'Player'} 
      />

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{t("startNewMatch")}</h3>
                  <p className="text-sm text-muted-foreground">{t("beginScoringLiveMatch")}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <Link href="/matches/create">
              <Button className="w-full" size="sm">
                {t("newMatch")}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{t("playerStats")}</h3>
                  <p className="text-sm text-muted-foreground">{t("detailedAnalysis")}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <Link href="/player-statistics">
              <Button variant="outline" className="w-full" size="sm">
                {t("viewAll")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Limited Data Notice */}
      {isLimitedData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {t('showingLimitedMatches').replace('{current}', matches.length.toString()).replace('{total}', totalMatches.toString())}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {t('forCompleteAnalysisVisitStats')}
                  </p>
                </div>
                <Link href="/player-statistics">
                  <Button variant="outline" size="sm" className="text-blue-600 dark:text-blue-400">
                    {t("viewAll")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Activity Feed and What's New */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed matches={matches} mainPlayer={mainPlayer} />
        <Changelog />
      </div>
    </div>
  )
}