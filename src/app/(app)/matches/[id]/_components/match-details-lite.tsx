"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, Trophy, Users } from "lucide-react"
import { Player } from "@/lib/types"
import { useTranslations } from "@/hooks/use-translations"
import { PlayerAvatar } from "@/components/shared/player-avatar"
import { formatPlayerFromObject } from "@/lib/utils"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Lazy load heavy components
const MatchDetailsFullComponent = dynamic(
  () => import("./match-details").then(mod => ({ default: mod.MatchDetails })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading match details...</div>
      </div>
    ),
  }
)

interface MatchDetailsLiteProps {
  match: {
    $id: string
    playerOneId: string
    playerTwoId: string
    playerThreeId?: string
    playerFourId?: string
    playerOne?: Player
    playerTwo?: Player
    playerThree?: Player
    playerFour?: Player
    winner?: Player
    matchDate: string
    status: "In Progress" | "Completed"
    score: string
    scoreParsed?: {
      sets: { p1: number; p2: number }[]
      games: number[]
      points: number[]
    }
    pointLog: string[]
    matchFormat: string
    winnerId?: string
    startTime?: string
    endTime?: string
    setDurations?: number[]
    retirementReason?: string
    userId: string
    $collectionId: string
    $databaseId: string
    $createdAt: string
    $updatedAt: string
    $permissions: string[]
    tournamentName?: string
  }
}

export function MatchDetailsLite({ match }: MatchDetailsLiteProps) {
  const t = useTranslations()
  const [showFullDetails, setShowFullDetails] = useState(false)
  const isDoubles = match.playerThreeId && match.playerFourId

  // Auto-load full details after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFullDetails(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Parse score for display
  const formatScore = () => {
    if (!match.scoreParsed?.sets) return "0-0"
    
    const p1Sets = match.scoreParsed.sets.filter(set => set.p1 > set.p2).length
    const p2Sets = match.scoreParsed.sets.filter(set => set.p2 > set.p1).length
    
    return `${p1Sets}-${p2Sets}`
  }

  // Show full component if requested
  if (showFullDetails) {
    return <MatchDetailsFullComponent match={match} />
  }

  // Lite version - just essential info
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/matches" prefetch={true}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("back")}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">{t("matchDetails")}</h1>
              <Badge variant={match.status === "Completed" ? "default" : "secondary"}>
                {match.status === "Completed" ? t("completed") : t("inProgress")}
              </Badge>
            </div>
            {match.tournamentName && (
              <Badge variant="outline">
                <Trophy className="mr-1 h-3 w-3" />
                {match.tournamentName}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Match Score */}
          <div className="bg-muted/50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Player 1 / Team 1 */}
                <div className={`flex items-center gap-3 ${match.winnerId === match.playerOneId ? 'opacity-100' : 'opacity-60'}`}>
                  {isDoubles ? (
                    <div className="flex -space-x-2">
                      <PlayerAvatar player={match.playerOne} className="h-8 w-8" />
                      <PlayerAvatar player={match.playerThree} className="h-8 w-8" />
                    </div>
                  ) : (
                    <PlayerAvatar player={match.playerOne} className="h-8 w-8" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {formatPlayerFromObject(match.playerOne)}
                      {isDoubles && ` / ${formatPlayerFromObject(match.playerThree)}`}
                    </p>
                  </div>
                </div>

                {/* Score */}
                <div className="text-3xl font-bold mx-4">
                  {formatScore()}
                </div>

                {/* Player 2 / Team 2 */}
                <div className={`flex items-center gap-3 ${match.winnerId === match.playerTwoId ? 'opacity-100' : 'opacity-60'}`}>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatPlayerFromObject(match.playerTwo)}
                      {isDoubles && ` / ${formatPlayerFromObject(match.playerFour)}`}
                    </p>
                  </div>
                  {isDoubles ? (
                    <div className="flex -space-x-2">
                      <PlayerAvatar player={match.playerTwo} className="h-8 w-8" />
                      <PlayerAvatar player={match.playerFour} className="h-8 w-8" />
                    </div>
                  ) : (
                    <PlayerAvatar player={match.playerTwo} className="h-8 w-8" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Match Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {new Date(match.matchDate).toLocaleDateString()}
              </span>
            </div>
            {match.status === "Completed" && match.winner && (
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {t("winner")}: {formatPlayerFromObject(match.winner)}
                </span>
              </div>
            )}
            {isDoubles && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t("doubles")}</span>
              </div>
            )}
          </div>

          {/* Loading indicator for full details */}
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Loading detailed statistics...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}