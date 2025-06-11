"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Trophy } from "lucide-react"

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
    scoreParsed?: { sets: { p1: number; p2: number }[] }
  }>
}

export function MatchesList({ matches }: MatchesListProps) {
  if (!matches || matches.length === 0) {
    return (
      <p className="text-muted-foreground">No matches found. Start a new match to see it here!</p>
    )
  }

  const formatScore = (score: any) => {
    if (!score || !score.sets || score.sets.length === 0) {
      return "N/A"
    }
    return score.sets.map((set: any) => `${set.p1}-${set.p2}`).join(", ")
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
                <span className="font-semibold">Score:</span>
                <span className="font-mono text-lg">{formatScore(match.scoreParsed)}</span>
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

              <div className="pt-2 border-t">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/matches/${match.$id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 