"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Users, Trophy, Clock } from "lucide-react"
import { Match, Player } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { useTranslations } from "@/hooks/use-translations"

interface AdminMatchCardProps {
  match: Match & {
    playerOneName: string
    playerTwoName: string
    playerThreeName?: string
    playerFourName?: string
    createdByEmail?: string
    playerOne?: Player
    playerTwo?: Player
    playerThree?: Player
    playerFour?: Player
  }
}

export function AdminMatchCard({ match }: AdminMatchCardProps) {
  const t = useTranslations()
  
  // Parse score to show current/final score
  const getMatchScore = () => {
    try {
      const scoreData = typeof match.score === 'string' ? JSON.parse(match.score) : match.score
      if (scoreData?.sets && Array.isArray(scoreData.sets)) {
        return scoreData.sets.map((set: [number, number]) => `${set[0]}-${set[1]}`).join(', ')
      }
      return "0-0"
    } catch {
      return "0-0"
    }
  }

  const getStatusBadge = () => {
    switch (match.status) {
      case "completed":
        return <Badge variant="secondary" className="text-xs">{t('completedStatus')}</Badge>
      case "in-progress":
        return <Badge variant="default" className="text-xs bg-green-600">{t('liveStatus')}</Badge>
      case "retired":
        return <Badge variant="destructive" className="text-xs">{t('retiredStatus')}</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{match.status}</Badge>
    }
  }

  const getMatchTypeInfo = () => {
    if (match.isDoubles) {
      return {
        icon: <Users className="h-3.5 w-3.5" />,
        label: t('doublesType'),
        players: `${match.playerOneName} & ${match.playerThreeName || t('unknownPlayer')} ${t('vs')} ${match.playerTwoName} & ${match.playerFourName || t('unknownPlayer')}`
      }
    }
    return {
      icon: <Users className="h-3.5 w-3.5" />,
      label: t('singlesType'), 
      players: `${match.playerOneName} ${t('vs')} ${match.playerTwoName}`
    }
  }

  const matchTypeInfo = getMatchTypeInfo()

  return (
    <Card className="group hover:shadow-md transition-all duration-200 w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between space-x-4">
          {/* Left side: Match info */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Tournament and date */}
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDate(match.matchDate)}</span>
              {match.tournamentName && (
                <>
                  <span>•</span>
                  <Trophy className="h-3 w-3" />
                  <span className="truncate">{match.tournamentName}</span>
                </>
              )}
            </div>

            {/* Players */}
            <div className="flex items-center space-x-2">
              {matchTypeInfo.icon}
              <span className="text-sm font-medium truncate">{matchTypeInfo.players}</span>
            </div>

            {/* Created by and match type */}
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>{t('createdBy')} {match.createdByEmail || t('unknownPlayer')}</span>
              <span>•</span>
              <span>{matchTypeInfo.label}</span>
            </div>
          </div>

          {/* Right side: Status, score, and link */}
          <div className="flex-shrink-0 text-right space-y-2">
            {/* Status */}
            <div className="flex justify-end">
              {getStatusBadge()}
            </div>

            {/* Score */}
            <div className="text-sm font-mono font-semibold text-foreground">
              {getMatchScore()}
            </div>

            {/* Live link */}
            <div>
              <Link 
                href={`/live/${match.$id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <span>{t('watchLive')}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}