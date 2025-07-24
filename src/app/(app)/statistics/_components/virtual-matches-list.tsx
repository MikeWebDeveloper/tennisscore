"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VirtualScrollList } from "@/components/ui/virtual-scroll-list"
import { Trophy, Calendar, Users, Eye, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Match } from "@/lib/types"
import { cn } from "@/lib/utils"

interface VirtualMatchesListProps {
  matches: Match[]
  mainPlayerId?: string
  containerHeight?: number
  onMatchClick?: (_match: Match) => void
}

const ITEM_HEIGHT = 120 // Height of each match card in pixels
const DEFAULT_CONTAINER_HEIGHT = 600 // Default container height

export function VirtualMatchesList({
  matches,
  mainPlayerId,
  containerHeight = DEFAULT_CONTAINER_HEIGHT,
  onMatchClick
}: VirtualMatchesListProps) {
  
  const sortedMatches = useMemo(() => 
    [...matches].sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()),
    [matches]
  )

  const renderMatchCard = (match: Match, _index: number) => {
    const isWin = match.winnerId === mainPlayerId
    const opponent = match.playerOneId === mainPlayerId 
      ? match.playerTwoName || 'Unknown'
      : match.playerOneName || 'Unknown'
    
    const matchDate = new Date(match.matchDate)
    const isCompleted = match.status === 'completed' || (match.status as string) === 'Completed'

    return (
      <Card className={cn(
        "mx-2 mb-2 transition-all duration-200 hover:shadow-md cursor-pointer",
        isCompleted && isWin && "ring-1 ring-green-200 dark:ring-green-800",
        isCompleted && !isWin && "ring-1 ring-red-200 dark:ring-red-800"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Match Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className={cn(
                  "h-4 w-4",
                  isCompleted && isWin && "text-green-500",
                  isCompleted && !isWin && "text-red-500",
                  !isCompleted && "text-muted-foreground"
                )} />
                <h3 className="font-semibold text-sm truncate">
                  {isCompleted ? (isWin ? `Won vs ${opponent}` : `Lost to ${opponent}`) : `Playing ${opponent}`}
                </h3>
                <Badge 
                  variant={isCompleted ? (isWin ? "default" : "destructive") : "secondary"}
                  className="text-xs"
                >
                  {isCompleted ? (isWin ? "W" : "L") : "Live"}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{matchDate.toLocaleDateString()}</span>
                </div>
                {match.isDoubles && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>Doubles</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="font-mono">
                    {match.score || 'No score'}
                  </span>
                </div>
              </div>

              {/* Match details */}
              <div className="mt-2 text-xs text-muted-foreground">
                {match.isDoubles && (
                  <div>
                    {match.playerOneName} & {match.playerThreeName} vs {match.playerTwoName} & {match.playerFourName}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              <Link href={`/matches/${match.$id}`}>
                <Button variant="ghost" size="sm" className="h-8">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              </Link>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (sortedMatches.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No matches found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* List Header */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {sortedMatches.length} matches
        </div>
        <div className="text-xs text-muted-foreground">
          Sorted by date (newest first)
        </div>
      </div>

      {/* Virtual Scrolled List */}
      <VirtualScrollList
        items={sortedMatches}
        itemHeight={ITEM_HEIGHT}
        containerHeight={containerHeight}
        renderItem={renderMatchCard}
        getItemKey={(match) => match.$id}
        overscan={3}
        className="border rounded-lg bg-background"
      />

      {/* List Footer */}
      <div className="text-center text-xs text-muted-foreground px-2">
        {sortedMatches.length > 10 && (
          <p>Virtual scrolling active for optimal performance</p>
        )}
      </div>
    </div>
  )
}

// Performance stats component
export function MatchListPerformanceStats({ matches, mainPlayerId }: { matches: Match[], mainPlayerId?: string }) {
  const stats = useMemo(() => {
    const completed = matches.filter(m => m.status === 'completed' || (m.status as string) === 'Completed')
    const wins = completed.filter(m => m.winnerId === mainPlayerId)
    const winRate = completed.length > 0 ? Math.round((wins.length / completed.length) * 100) : 0

    return {
      total: matches.length,
      completed: completed.length,
      wins: wins.length,
      losses: completed.length - wins.length,
      winRate,
      inProgress: matches.length - completed.length
    }
  }, [matches, mainPlayerId])

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{stats.wins}</div>
            <div className="text-xs text-muted-foreground">Wins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{stats.losses}</div>
            <div className="text-xs text-muted-foreground">Losses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">{stats.winRate}%</div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}