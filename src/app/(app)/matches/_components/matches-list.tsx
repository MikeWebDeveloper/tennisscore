"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Eye, Users, Share2 } from "lucide-react"
import { Player } from "@/lib/types"
import { DeleteMatchButton } from "../[id]/_components/delete-match-button"
import { toast } from "sonner"
import { useTranslations } from "@/hooks/use-translations"

interface MatchesListProps {
  matches: Array<{
    $id: string
    playerOneId: string
    playerTwoId: string
    playerThreeId?: string
    playerFourId?: string
    playerOneName: string
    playerTwoName: string
    playerThreeName?: string
    playerFourName?: string
    matchDate: string
    status: string
    winnerId?: string
    winnerName?: string
    score: string // Original JSON string
    scoreParsed?: { 
      sets: { p1: number; p2: number }[]
      games?: number[]
      points?: number[]
    }
    playerOne?: Player
    playerTwo?: Player
    playerThree?: Player
    playerFour?: Player
  }>
}

export function MatchesList({ matches }: MatchesListProps) {
  const t = useTranslations()
  
  if (!matches || matches.length === 0) {
    return (
      <p className="text-muted-foreground">No matches found. Start a new match to see it here!</p>
    )
  }

  const formatScore = (match: MatchesListProps['matches'][0]) => {
    const { scoreParsed, status } = match
    
    // Handle missing or invalid scoreParsed
    if (!scoreParsed) {
      return "0-0"
    }

    // For completed matches, show the final set scores
    if (status === 'Completed' && scoreParsed.sets && scoreParsed.sets.length > 0) {
      const setsDisplay = scoreParsed.sets.map((set: { p1: number; p2: number }) => `${set.p1}-${set.p2}`).join(", ")
      return setsDisplay
    }

    // For in-progress matches
    if (status === 'In Progress') {
      // If we have completed sets, show them plus current game score
      if (scoreParsed.sets && scoreParsed.sets.length > 0) {
        const completedSets = scoreParsed.sets.map((set: { p1: number; p2: number }) => `${set.p1}-${set.p2}`).join(", ")
        
        // Add current set/game status if available
        if (scoreParsed.games && Array.isArray(scoreParsed.games) && scoreParsed.games.length >= 2) {
          const currentGameScore = `${scoreParsed.games[0]}-${scoreParsed.games[1]}`
          return `${completedSets}, ${currentGameScore}`
        }
        
        return completedSets
      }
      
      // If no sets completed yet, show current game score
      if (scoreParsed.games && Array.isArray(scoreParsed.games) && scoreParsed.games.length >= 2) {
        return `${scoreParsed.games[0]}-${scoreParsed.games[1]}`
      }
    }

    // Fallback
    return "0-0"
  }

  const formatMatchTitle = (match: MatchesListProps['matches'][0]) => {
    const isDoubles = match.playerThreeId && match.playerFourId
    
    if (isDoubles) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Doubles</span>
          </div>
          <div className="text-sm font-medium leading-tight">
            {match.playerOneName} / {match.playerThreeName}
          </div>
          <div className="text-xs text-muted-foreground">vs</div>
          <div className="text-sm font-medium leading-tight">
            {match.playerTwoName} / {match.playerFourName}
          </div>
        </div>
      )
    }
    
    return `${match.playerOneName} vs ${match.playerTwoName}`
  }

  const getCardHeight = (match: MatchesListProps['matches'][0]) => {
    const isDoubles = match.playerThreeId && match.playerFourId
    return isDoubles ? "h-auto min-h-[200px]" : ""
  }

  const handleShareMatch = async (matchId: string, playerOneName: string, playerTwoName: string) => {
    const shareUrl = `${window.location.origin}/live/${matchId}`
    const title = `${playerOneName} vs ${playerTwoName} - Tennis Match Results`
    const text = `Check out the match results and statistics for ${playerOneName} vs ${playerTwoName}!`
    
    // Try native share first (works best on mobile)
    if (typeof navigator !== 'undefined' && navigator.share && /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl
        })
        toast.success("Match shared successfully!")
        return
      } catch (err) {
        // User canceled or share failed, fall through to clipboard
        console.log("Native share failed:", err)
      }
    }
    
    // Fallback to clipboard copy
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Match link copied to clipboard! Share it to let others view the results.")
    } catch {
      // If clipboard fails, show manual copy
      toast.error(`Copy this link manually: ${shareUrl}`)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {matches.map((match) => (
        <Card key={match.$id} className={`hover:shadow-md transition-shadow ${getCardHeight(match)}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base leading-tight flex-1">
                {formatMatchTitle(match)}
              </CardTitle>
              <Badge 
                variant={match.status === "Completed" ? "default" : "secondary"}
                className="text-xs shrink-0"
              >
                {match.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {match.status === "Completed" ? "Final:" : "Score:"}
                </span>
                <span className={`font-mono text-sm ${match.status === "Completed" ? "font-bold" : ""}`}>
                  {formatScore(match)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Date:</span>
                <span className="text-sm">{new Date(match.matchDate).toLocaleDateString()}</span>
              </div>
              
              {match.winnerName && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Winner:</span>
                  <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                    <Trophy className="h-3 w-3" />
                    {match.winnerName}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 pt-2 border-t">
                <Button variant="outline" size="sm" asChild className="flex-1 h-8 text-xs">
                  <Link href={`/matches/${match.$id}`}>
                    <Eye className="h-3 w-3 mr-1" />
{t('view')}
                  </Link>
                </Button>
                
                {/* Share button for all matches (both completed and in progress) */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleShareMatch(match.$id, match.playerOneName, match.playerTwoName)}
                  className="h-8 px-2"
                  title="Share match results"
                >
                  <Share2 className="h-3 w-3" />
                </Button>
                
                <DeleteMatchButton 
                  matchId={match.$id}
                  playerNames={{
                    p1: `${match.playerOne?.firstName || 'Player'} ${match.playerOne?.lastName || '1'}`,
                    p2: `${match.playerTwo?.firstName || 'Player'} ${match.playerTwo?.lastName || '2'}`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 