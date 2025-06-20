import { redirect } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Play, Users } from "lucide-react"
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

  // Check if it's a doubles match
  const isDoubles = match.playerThreeId && match.playerFourId

  // Handle all players (including doubles)
  const playerIds = [match.playerOneId, match.playerTwoId]
  if (isDoubles) {
    playerIds.push(match.playerThreeId!, match.playerFourId!)
  }

  // Filter out anonymous player IDs
  const realPlayerIds = playerIds.filter(id => !id.startsWith('anonymous-'))
  const playersData = realPlayerIds.length > 0 ? await getPlayersByIds(realPlayerIds) : {}

  // Create player objects
  const createPlayer = (id: string, defaultNumber: string): Player => {
    if (id.startsWith('anonymous-')) {
      return { 
        $id: id,
        firstName: "Player", 
        lastName: defaultNumber,
        userId: user.$id,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString()
      } as Player
    }
    return playersData[id] || null
  }

  const player1 = createPlayer(match.playerOneId, "1")
  const player2 = createPlayer(match.playerTwoId, "2")
  const player3 = isDoubles ? createPlayer(match.playerThreeId!, "3") : null
  const player4 = isDoubles ? createPlayer(match.playerFourId!, "4") : null

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

  // Get player names - adjusted for doubles
  const playerNames = {
    p1: isDoubles 
      ? `${player1?.firstName} / ${player3?.firstName}`
      : `${player1?.firstName} ${player1?.lastName}`,
    p2: isDoubles 
      ? `${player2?.firstName} / ${player4?.firstName}`
      : `${player2?.firstName} ${player2?.lastName}`
  }

  const getFullPlayerNames = () => {
    if (isDoubles) {
      return {
        team1: `${player1?.firstName} ${player1?.lastName} / ${player3?.firstName} ${player3?.lastName}`,
        team2: `${player2?.firstName} ${player2?.lastName} / ${player4?.firstName} ${player4?.lastName}`
      }
    }
    return {
      p1: `${player1?.firstName} ${player1?.lastName}`,
      p2: `${player2?.firstName} ${player2?.lastName}`
    }
  }

  // Calculate match statistics
  const matchStats = calculateMatchStats(parsedPoints)

  // Format match score for header display - simplified for mobile
  const formatHeaderScore = (scoreData: { sets?: (number[] | { p1?: number; p2?: number })[] }) => {
    if (!scoreData.sets || scoreData.sets.length === 0) {
      return "0-0"
    }
    
    // For mobile readability, just show the number of sets won by each player
    let p1Sets = 0;
    let p2Sets = 0;
    
    scoreData.sets.forEach((set: number[] | { p1?: number; p2?: number }) => {
      const p1Score = Array.isArray(set) ? set[0] || 0 : set.p1 || 0;
      const p2Score = Array.isArray(set) ? set[1] || 0 : set.p2 || 0;
      
      if (p1Score > p2Score) p1Sets++;
      else if (p2Score > p1Score) p2Sets++;
    });
    
    return `${p1Sets}-${p2Sets}`;
  }

  const headerScore = formatHeaderScore(score)
  const fullNames = getFullPlayerNames()

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Match Details</h1>
          <div className="flex flex-col gap-1">
            {isDoubles ? (
              <>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Doubles Match</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {fullNames.team1!}
                </p>
                <p className="text-sm text-muted-foreground">
                  vs {fullNames.team2!}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {fullNames.p1} vs {fullNames.p2}
              </p>
            )}
            {/* Always visible match score */}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono text-base px-3 py-1">
                {headerScore}
              </Badge>
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
                  {score.sets && score.sets.length > 0 ? (
                    <div className="space-y-1">
                      {score.sets.map((set: number[] | { p1?: number; p2?: number }, index: number) => {
                        const setScore = Array.isArray(set) 
                          ? `${set[0] || 0}-${set[1] || 0}` 
                          : `${set.p1 || 0}-${set.p2 || 0}`;
                        return (
                          <div key={index} className="text-lg font-bold font-mono">
                            {setScore}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-2xl font-bold">0-0</div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="text-2xl font-bold">
                    {parsedPoints.length > 0 ? `${parsedPoints.length} points` : "No data"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Winner</div>
                  <div className="text-lg font-bold">
                    {match.winnerId ? (
                      match.winnerId === match.playerOneId || match.winnerId === match.playerThreeId 
                        ? playerNames.p1 
                        : playerNames.p2
                    ) : "In Progress"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Players/Teams Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isDoubles ? "Teams" : "Players"}
                {isDoubles && <Users className="h-4 w-4 text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="font-medium text-blue-600">{isDoubles ? "Team 1" : "Player 1"}</div>
                  {isDoubles ? (
                    <>
                      <div>{player1?.firstName} {player1?.lastName}</div>
                      <div>{player3?.firstName} {player3?.lastName}</div>
                    </>
                  ) : (
                    <div>{player1?.firstName} {player1?.lastName}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-red-600">{isDoubles ? "Team 2" : "Player 2"}</div>
                  {isDoubles ? (
                    <>
                      <div>{player2?.firstName} {player2?.lastName}</div>
                      <div>{player4?.firstName} {player4?.lastName}</div>
                    </>
                  ) : (
                    <div>{player2?.firstName} {player2?.lastName}</div>
                  )}
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