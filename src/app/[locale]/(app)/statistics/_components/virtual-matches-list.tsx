"use client"

import { useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "@/i18n"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Eye, Users, Calendar, Clock, Activity } from "lucide-react"
import { Match } from "@/lib/types"
import { formatMatchScore } from "@/lib/utils/match-formatting"
import { motion } from "framer-motion"

interface VirtualMatchesListProps {
  matches: Match[]
  mainPlayerId: string
}

export function VirtualMatchesList({ matches, mainPlayerId }: VirtualMatchesListProps) {
  const t = useTranslations("statistics")
  const parentRef = useRef<HTMLDivElement>(null)

  // Setup virtual scrolling
  const rowVirtualizer = useVirtualizer({
    count: matches.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated height of each match card
    overscan: 5,
  })

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{t('noMatchesFound')}</p>
      </div>
    )
  }

  const getMatchResult = (match: Match) => {
    if (match.status !== 'completed') return 'in-progress'
    return match.winnerId === mainPlayerId ? 'won' : 'lost'
  }

  const getMatchTitle = (match: Match) => {
    const isDoubles = !!(match.playerThreeId && match.playerFourId)
    
    if (isDoubles) {
      // Format doubles match title
      const team1 = match.playerOneId === mainPlayerId 
        ? `${match.playerOne?.firstName} / ${match.playerTwo?.firstName}`
        : `${match.playerOne?.firstName} / ${match.playerTwo?.firstName}`
      const team2 = match.playerThreeId === mainPlayerId
        ? `${match.playerThree?.firstName} / ${match.playerFour?.firstName}`
        : `${match.playerThree?.firstName} / ${match.playerFour?.firstName}`
      return `${team1} vs ${team2}`
    } else {
      // Singles match
      const opponent = match.playerOneId === mainPlayerId 
        ? match.playerTwo 
        : match.playerOne
      return opponent ? `vs ${opponent.firstName} ${opponent.lastName}` : 'vs Unknown'
    }
  }

  const getMatchDuration = (match: Match) => {
    if (!match.startTime || !match.endTime) return null
    const duration = new Date(match.endTime).getTime() - new Date(match.startTime).getTime()
    const minutes = Math.floor(duration / 60000)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div>
      {/* Match count summary */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {matches.length} matches
        </p>
        <div className="flex gap-2">
          <Badge variant="secondary">
            <Trophy className="h-3 w-3 mr-1" />
            {matches.filter(m => m.winnerId === mainPlayerId).length} wins
          </Badge>
          <Badge variant="outline">
            {matches.filter(m => m.status === 'completed' && m.winnerId !== mainPlayerId).length} losses
          </Badge>
        </div>
      </div>

      {/* Virtual scrolling container */}
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto rounded-lg border bg-background"
        style={{
          contain: 'strict'
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const match = matches[virtualItem.index]
            const result = getMatchResult(match)
            const duration = getMatchDuration(match)

            return (
              <div
                key={match.$id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                  padding: '8px',
                }}
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: virtualItem.index * 0.01 }}
                >
                  <Card className={`h-full hover:shadow-md transition-all cursor-pointer ${
                    result === 'won' 
                      ? 'border-green-500/20 hover:border-green-500/40' 
                      : result === 'lost'
                      ? 'border-red-500/20 hover:border-red-500/40'
                      : 'border-yellow-500/20 hover:border-yellow-500/40'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          {/* Match Title and Status */}
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-sm">
                              {getMatchTitle(match)}
                            </h3>
                            <Badge variant={
                              result === 'won' ? 'default' : 
                              result === 'lost' ? 'destructive' : 
                              'secondary'
                            } className="text-xs">
                              {result === 'in-progress' ? "In progress" : 
                               result === 'won' ? "Won" : "Lost"}
                            </Badge>
                          </div>

                          {/* Match Details */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(match.matchDate).toLocaleDateString()}
                            </div>
                            {duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {duration}
                              </div>
                            )}
                            {match.isDoubles && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Doubles
                              </div>
                            )}
                          </div>

                          {/* Score */}
                          {match.status === 'completed' && match.score && (
                            <div className="text-sm font-mono">
                              {formatMatchScore(match.score)}
                            </div>
                          )}
                        </div>

                        {/* View Button */}
                        <div className="ml-4">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/matches/${match.$id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}