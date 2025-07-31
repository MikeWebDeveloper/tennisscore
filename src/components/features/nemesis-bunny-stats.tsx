"use client"

import { useState, useMemo } from "react"
import { motion } from '@/lib/framer-motion-config'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlayerAvatar } from "@/components/shared/player-avatar"
import { cn } from "@/lib/utils"
import { TrendingDown, TrendingUp, Skull, Heart, Users, Target, Zap } from "lucide-react"
import { useTranslations } from "@/i18n"

export interface OpponentRecord {
  opponentId: string
  opponentName: string
  opponentAvatar?: string
  matches: number
  wins: number
  losses: number
  winRate: number
  lastPlayed?: string
  matchHistory: Array<{
    matchId: string
    date: string
    won: boolean
    score: string
  }>
}

export interface NemesisBunnyStatsProps {
  playerId: string
  playerName: string
  opponentRecords: OpponentRecord[]
  className?: string
}

export function NemesisBunnyStats({ 
  opponentRecords,
  className = ""
}: NemesisBunnyStatsProps) {
  const [showAll, setShowAll] = useState(false)
  const t = useTranslations('statistics')

  // Sort and analyze opponent records
  const { nemeses, bunnies, rivalries } = useMemo(() => {
    // Filter opponents with at least 3 matches for meaningful stats
    const qualifiedOpponents = opponentRecords.filter(record => record.matches >= 3)
    
    // Sort by win rate (ascending for nemeses, descending for bunnies)
    const sortedByWinRate = [...qualifiedOpponents].sort((a, b) => a.winRate - b.winRate)
    
    // Nemeses: opponents with low win rate (tough opponents)
    const nemeses = sortedByWinRate
      .filter(record => record.winRate <= 0.4) // 40% or less win rate
      .slice(0, showAll ? 10 : 3)
    
    // Bunnies: opponents with high win rate (easy opponents)  
    const bunnies = sortedByWinRate
      .filter(record => record.winRate >= 0.7) // 70% or more win rate
      .reverse()
      .slice(0, showAll ? 10 : 3)
    
    // Rivalries: opponents with close records (40-60% win rate)
    const rivalries = qualifiedOpponents
      .filter(record => record.winRate > 0.4 && record.winRate < 0.7)
      .sort((a, b) => b.matches - a.matches) // Sort by most matches
      .slice(0, showAll ? 5 : 2)

    return { nemeses, bunnies, rivalries }
  }, [opponentRecords, showAll])

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 0.8) return "text-green-500"
    if (winRate >= 0.6) return "text-blue-500"
    if (winRate >= 0.4) return "text-yellow-500"
    return "text-red-500"
  }

  const getWinRateBadgeVariant = (winRate: number): "default" | "secondary" | "destructive" | "outline" => {
    if (winRate >= 0.7) return "default" // Green for good records
    if (winRate >= 0.4) return "secondary" // Yellow for neutral
    return "destructive" // Red for poor records
  }

  const OpponentCard = ({ 
    record, 
    type, 
    rank 
  }: { 
    record: OpponentRecord; 
    type: 'nemesis' | 'bunny' | 'rivalry';
    rank: number;
  }) => {
    const getTypeIcon = () => {
      switch (type) {
        case 'nemesis':
          return <Skull className="h-4 w-4 text-red-500" />
        case 'bunny':
          return <Heart className="h-4 w-4 text-green-500" />
        case 'rivalry':
          return <Zap className="h-4 w-4 text-blue-500" />
      }
    }

    const getTypeColor = () => {
      switch (type) {
        case 'nemesis':
          return "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
        case 'bunny':
          return "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
        case 'rivalry':
          return "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950"
      }
    }

    const getTypeTitle = () => {
      switch (type) {
        case 'nemesis':
          return `#${rank} ${t('nemeses')}`
        case 'bunny':
          return `#${rank} ${t('bunnies')}`
        case 'rivalry':
          return `#${rank} ${t('rivalries')}`
      }
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: rank * 0.1 }}
        className={cn(
          "p-4 rounded-lg border transition-all hover:shadow-md",
          getTypeColor()
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <span className="text-sm font-medium text-muted-foreground">
              {getTypeTitle()}
            </span>
          </div>
          <Badge variant={getWinRateBadgeVariant(record.winRate)}>
            {Math.round(record.winRate * 100)}%
          </Badge>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <PlayerAvatar 
            player={{ 
              $id: record.opponentId,
              firstName: record.opponentName.split(' ')[0] || '',
              lastName: record.opponentName.split(' ').slice(1).join(' ') || '',
              profilePictureUrl: record.opponentAvatar
            }} 
            className="h-10 w-10" 
          />
          <div className="flex-1">
            <h4 className="font-medium">{record.opponentName}</h4>
            <p className="text-sm text-muted-foreground">
              {record.matches} matches • {record.wins}W - {record.losses}L
            </p>
          </div>
        </div>

        {/* Recent form indicator */}
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs text-muted-foreground">{t('recentForm')}:</span>
          <div className="flex gap-1">
            {record.matchHistory.slice(-5).map((match, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-2 h-2 rounded-full",
                  match.won ? "bg-green-500" : "bg-red-500"
                )}
                title={`${match.won ? 'W' : 'L'} - ${match.score}`}
              />
            ))}
          </div>
        </div>

        {/* Performance indicator */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {record.lastPlayed && `Last: ${record.lastPlayed}`}
          </span>
          <div className="flex items-center gap-1">
            {record.winRate > 0.5 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={getWinRateColor(record.winRate)}>
              {record.winRate > 0.5 ? t('favorable') : t('challenging')}
            </span>
          </div>
        </div>
      </motion.div>
    )
  }

  if (opponentRecords.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('opponentAnalysis')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {t('noOpponentData')}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('opponentAnalysis')}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {opponentRecords.length} {t('opponents')}
            </Badge>
            {(nemeses.length > 3 || bunnies.length > 3 || rivalries.length > 2) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="text-xs"
              >
                {showAll ? t('showLess') : t('showAll')}
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nemeses Section */}
        {nemeses.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Skull className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-red-700 dark:text-red-400">
                {t('yourNemeses')}
              </h3>
              <Badge variant="destructive" className="text-xs">
                {t('toughOpponents')}
              </Badge>
            </div>
            <div className="grid gap-3">
              {nemeses.map((record, index) => (
                <OpponentCard
                  key={record.opponentId}
                  record={record}
                  type="nemesis"
                  rank={index + 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Rivalries Section */}
        {rivalries.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-blue-700 dark:text-blue-400">
                {t('closeRivalries')}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {t('competitiveMatches')}
              </Badge>
            </div>
            <div className="grid gap-3">
              {rivalries.map((record, index) => (
                <OpponentCard
                  key={record.opponentId}
                  record={record}
                  type="rivalry"
                  rank={index + 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bunnies Section */}
        {bunnies.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold text-green-700 dark:text-green-400">
                {t('yourBunnies')}
              </h3>
              <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
                {t('favorableMatchups')}
              </Badge>
            </div>
            <div className="grid gap-3">
              {bunnies.map((record, index) => (
                <OpponentCard
                  key={record.opponentId}
                  record={record}
                  type="bunny"
                  rank={index + 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-500">{nemeses.length}</div>
              <div className="text-xs text-muted-foreground">{t('nemeses')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">{rivalries.length}</div>
              <div className="text-xs text-muted-foreground">{t('rivalries')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">{bunnies.length}</div>
              <div className="text-xs text-muted-foreground">{t('bunnies')}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 