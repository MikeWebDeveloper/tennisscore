"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Eye } from "lucide-react"
import { Player } from "@/lib/types"
import { DeleteMatchButton } from "../[id]/_components/delete-match-button"

interface MatchesListProps {
  matches: Array<{
    $id: string
    playerOneId: string
    playerTwoId: string
    playerOneName: string
    playerTwoName: string
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
  }>
}

export function MatchesList({ matches }: MatchesListProps) {
  if (!matches || matches.length === 0) {
    return (
      <p className="text-muted-foreground">No matches found. Start a new match to see it here!</p>
    )
  }

  const formatScore = (match: MatchesListProps['matches'][0]) => {
    const { scoreParsed, status } = match
    
    // Handle missing or invalid scoreParsed
    if (!scoreParsed) {
      return "N/A"
    }

    // If match is in progress and no sets completed, show current game score
    if (status === 'In Progress' && (!scoreParsed.sets || scoreParsed.sets.length === 0)) {
      if (scoreParsed.games && scoreParsed.games.length >= 2) {
        return `${scoreParsed.games[0]}-${scoreParsed.games[1]}`
      }
      return "0-0"
    }

    // Show completed sets
    if (scoreParsed.sets && scoreParsed.sets.length > 0) {
      const setsDisplay = scoreParsed.sets.map((set: { p1: number; p2: number }) => `${set.p1}-${set.p2}`).join(", ")
      
      // For in-progress matches, also show current game score if available
      if (status === 'In Progress' && scoreParsed.games && scoreParsed.games.length >= 2) {
        return `${setsDisplay} (${scoreParsed.games[0]}-${scoreParsed.games[1]})`
      }
      
      return setsDisplay
    }

    return "N/A"
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches.map((match) => (
        <Card key={match.$id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {match.playerOneName} vs {match.playerTwoName}
              </CardTitle>
              <Badge variant={match.status === "Completed" ? "default" : "secondary"}>
                {match.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">
                  {match.status === "Completed" ? "Final Score:" : "Score:"}
                </span>
                <span className={`font-mono ${match.status === "Completed" ? "text-xl font-bold" : "text-lg"}`}>
                  {formatScore(match)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-semibold">Date:</span>
                <span>{new Date(match.matchDate).toLocaleDateString()}</span>
              </div>
              
              {match.winnerName && (
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Winner:</span>
                  <span className="flex items-center gap-1 font-medium text-green-600">
                    <Trophy className="h-4 w-4" />
                    {match.winnerName}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/matches/${match.$id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
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