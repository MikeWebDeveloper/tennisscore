import { redirect } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getMatch } from "@/lib/actions/matches"
import { getPlayersByIds } from "@/lib/actions/players"
import { PointByPointView } from "./_components/point-by-point-view"
import { MinimalistStats } from "./_components/minimalist-stats"
import { calculateMatchStats } from "@/lib/utils/match-stats"
import { PointDetail, Player } from "@/lib/types"
import { DeleteMatchButton } from "./_components/delete-match-button"

export default async function MatchPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const resolvedParams = await params
  const match = await getMatch(resolvedParams.id)
  if (!match) {
    redirect("/matches")
  }

  // Handle anonymous players by checking ID prefix
  let player1, player2
  
  if (match.playerOneId.startsWith('anonymous-')) {
    player1 = { 
      $id: match.playerOneId,
      firstName: "Player", 
      lastName: "1",
      userId: user.$id,
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString()
    } as Player
  } else {
    const playersData = await getPlayersByIds([match.playerOneId])
    player1 = playersData[match.playerOneId]
  }
  
  if (match.playerTwoId.startsWith('anonymous-')) {
    player2 = { 
      $id: match.playerTwoId,
      firstName: "Player", 
      lastName: "2",
      userId: user.$id,
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString()
    } as Player
  } else {
    const playersData = await getPlayersByIds([match.playerTwoId])
    player2 = playersData[match.playerTwoId]
  }

  // Parse the match data
  const score = JSON.parse(match.score || "{}")
  const pointLog: (string | PointDetail)[] = match.pointLog || []
  
  // Parse point log if it's an array of strings
  const parsedPoints: PointDetail[] = pointLog.map(point => {
    if (typeof point === 'string') {
      try {
        return JSON.parse(point) as PointDetail
      } catch {
        // Fallback for old format - create a complete PointDetail object
        return {
          id: `fallback-${Date.now()}`,
          pointNumber: 0,
          setNumber: 1,
          gameNumber: 1,
          gameScore: "0-0",
          winner: "p1" as const,
          server: "p1" as const,
          serveType: "first" as const,
          serveOutcome: "winner" as const,
          rallyLength: 1,
          pointOutcome: "winner" as const,
          isBreakPoint: false,
          isSetPoint: false,
          isMatchPoint: false,
          isGameWinning: false,
          isSetWinning: false,
          isMatchWinning: false,
          timestamp: new Date().toISOString()
        } as PointDetail
      }
    }
    return point as PointDetail
  })

  // Get player names 
  const playerNames = {
    p1: player1 ? `${player1.firstName} ${player1.lastName}` : "Player 1",
    p2: player2 ? `${player2.firstName} ${player2.lastName}` : "Player 2"
  }

  // Calculate match statistics
  const matchStats = calculateMatchStats(parsedPoints)

  // Format match score for header display
  const formatMatchScore = (scoreData: { sets?: (number[] | { p1?: number; p2?: number })[] }) => {
    if (!scoreData.sets || scoreData.sets.length === 0) {
      return "0-0"
    }
    return scoreData.sets.map((set: number[] | { p1?: number; p2?: number }) => {
      // Handle both array format [p1, p2] and object format {p1, p2}
      if (Array.isArray(set)) {
        return `${set[0] || 0}-${set[1] || 0}`
      } else {
        return `${set.p1 || 0}-${set.p2 || 0}`
      }
    }).join(", ")
  }

  const matchScore = formatMatchScore(score)

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Match Details</h1>
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {playerNames.p1} vs {playerNames.p2}
            </p>
            {/* Always visible match score */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">•</span>
              <Badge variant="outline" className="font-mono text-sm px-2 py-1">
                {matchScore}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {new Date(match.matchDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={match.status === "Completed" ? "default" : "secondary"}>
            {match.status}
          </Badge>
          
          {/* Resume Match Button - only show for in-progress matches */}
          {match.status === "In Progress" && (
            <Button asChild size="sm" className="gap-2">
              <Link href={`/matches/live/${match.$id}`}>
                <Play className="h-4 w-4" />
                Resume Match
              </Link>
            </Button>
          )}
          
          {/* Delete Match Button with Confirmation */}
          <DeleteMatchButton 
            matchId={match.$id}
            playerNames={playerNames}
          />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="point-log">Point Log</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Match Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Score</div>
                  <div className="text-2xl font-bold">
                    {matchScore}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="text-2xl font-bold">
                    {parsedPoints.length > 0 ? `${parsedPoints.length} points` : "No data"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Winner</div>
                  <div className="text-2xl font-bold">
                    {match.winnerId ? (match.winnerId === match.playerOneId ? playerNames.p1 : playerNames.p2) : "In Progress"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="point-log" className="space-y-4">
          {parsedPoints.length > 0 ? (
            <PointByPointView pointLog={parsedPoints} playerNames={playerNames} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No point-by-point data available for this match.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {parsedPoints.length > 0 ? (
            <MinimalistStats matchStats={matchStats} playerNames={playerNames} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No statistical data available for this match.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Match analysis coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 