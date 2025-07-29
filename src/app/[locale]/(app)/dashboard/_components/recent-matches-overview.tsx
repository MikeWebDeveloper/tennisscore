"use client"

import { motion } from "framer-motion"
import { Calendar, Clock, Trophy, ArrowRight, Play } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Match, Player } from "@/lib/types"
import { useTranslations } from "@/i18n"
import { useRouter } from "next/navigation"
import { formatPlayerFromObject } from "@/lib/utils"

interface RecentMatchesOverviewProps {
  matches: Match[]
  mainPlayer: Player
  playersMap: Map<string, Player>
}

export function RecentMatchesOverview({ matches, mainPlayer, playersMap }: RecentMatchesOverviewProps) {
  const t = useTranslations('dashboard')
  const matchT = useTranslations('match')
  const commonT = useTranslations('common')
  const router = useRouter()

  // Get last 3 matches (completed and in-progress)
  const recentMatches = matches
    .sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
    .slice(0, 3)

  const getOpponentName = (match: Match) => {
    const isPlayerOne = match.playerOneId === mainPlayer.$id
    const opponentId = isPlayerOne ? match.playerTwoId : match.playerOneId
    
    if (opponentId.startsWith('anonymous-')) {
      return opponentId.includes('player-1') ? 'Player 1' : 
             opponentId.includes('player-2') ? 'Player 2' : 'Anonymous'
    }
    
    const opponent = playersMap.get(opponentId)
    return opponent ? formatPlayerFromObject(opponent) : 'Unknown Player'
  }

  const getMatchResult = (match: Match) => {
    if (match.status !== 'completed' || !match.winnerId) {
      return null
    }
    
    const isWinner = match.winnerId === mainPlayer.$id
    return {
      isWinner,
      label: isWinner ? commonT('won') : commonT('lost'),
      color: isWinner ? 'text-green-600' : 'text-red-600',
      bgColor: isWinner ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
    }
  }

  const formatMatchScore = (match: Match) => {
    if (match.status !== 'completed') return null
    
    try {
      const score = JSON.parse(match.score)
      if (score.sets && Array.isArray(score.sets) && score.sets.length > 0) {
        return score.sets.map((set: number[]) => `${set[0]}-${set[1]}`).join(', ')
      }
    } catch (e) {
      console.error('Failed to parse score:', e)
    }
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return commonT('yesterday')
    if (diffDays <= 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const handleViewMatch = (matchId: string) => {
    router.push(`/matches/${matchId}`)
  }

  const handleViewAllMatches = () => {
    router.push('/matches')
  }

  const handleResumeMatch = (matchId: string) => {
    router.push(`/matches/live/${matchId}`)
  }

  if (recentMatches.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-background to-muted/30 border-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              {t('recentMatches')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">{t('noMatchesYet')}</p>
            <Button onClick={() => router.push('/matches/new')} className="gap-2">
              <Play className="h-4 w-4" />
              {t('startNewMatch')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-background to-muted/30 border-muted">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              {t('recentMatches')}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewAllMatches}
              className="text-xs gap-1 text-muted-foreground hover:text-primary"
            >
              {t('viewAll')}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentMatches.map((match, index) => {
            const result = getMatchResult(match)
            const score = formatMatchScore(match)
            const opponentName = getOpponentName(match)
            
            return (
              <motion.div
                key={match.$id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleViewMatch(match.$id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                        vs {opponentName}
                      </h4>
                      {match.status === 'in-progress' && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs px-2 py-0 bg-orange-500/10 text-orange-600 border-orange-500/20"
                        >
                          {matchT('inProgress')}
                        </Badge>
                      )}
                    </div>
                    {result && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-0 ${result.bgColor} ${result.color}`}
                      >
                        {result.label}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(match.$createdAt)}
                      </div>
                      {score && (
                        <div className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {score}
                        </div>
                      )}
                    </div>
                    
                    {match.status === 'in-progress' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleResumeMatch(match.$id)
                        }}
                        className="text-xs px-2 py-1 h-auto gap-1 text-primary hover:bg-primary/10"
                      >
                        <Play className="h-3 w-3" />
                        {matchT('resume')}
                      </Button>
                    )}
                  </div>
                </div>
                
                <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
              </motion.div>
            )
          })}
        </CardContent>
      </Card>
    </motion.div>
  )
}