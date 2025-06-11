import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getCurrentUser } from "@/lib/auth"
import { getMatch } from "@/lib/actions/matches"
import { PointByPointView } from "./_components/point-by-point-view"
import { calculateMatchStats } from "@/lib/utils/match-stats"
import { PointDetail } from "@/lib/types"

interface StatCardProps {
  title: string
  player1Value: string | number
  player2Value: string | number
  player1Name: string
  player2Name: string
  isPercentage?: boolean
  showProgress?: boolean
}

function StatCard({ title, player1Value, player2Value, player1Name, player2Name, isPercentage = false, showProgress = false }: StatCardProps) {
  const p1Val = typeof player1Value === 'string' ? parseFloat(player1Value) : player1Value
  const p2Val = typeof player2Value === 'string' ? parseFloat(player2Value) : player2Value
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">{player1Name}</div>
            <div className="text-lg font-bold">
              {isPercentage ? `${p1Val}%` : player1Value}
            </div>
          </div>
          
          {showProgress && (
            <div className="flex-1 mx-4 space-y-1">
              <Progress value={p1Val} className="h-2" />
              <Progress value={p2Val} className="h-2 [&>div]:bg-red-500" />
            </div>
          )}
          
          <div className="text-left">
            <div className="text-sm text-muted-foreground">{player2Name}</div>
            <div className="text-lg font-bold">
              {isPercentage ? `${p2Val}%` : player2Value}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

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

  // Get player names from the match
  const playerNames = {
    p1: match.playerOneId || "Player 1",
    p2: match.playerTwoId || "Player 2"
  }

  // Calculate match statistics
  const matchStats = calculateMatchStats(parsedPoints)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Match Details</h1>
          <p className="text-muted-foreground">
            {playerNames.p1} vs {playerNames.p2} • {match.status} • {new Date(match.matchDate).toLocaleDateString()}
          </p>
        </div>
        <Badge variant={match.status === "Completed" ? "default" : "secondary"}>
          {match.status}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="point-log">Point Log</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Match Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Score</div>
                  <div className="text-2xl font-bold">
                    {score.sets?.map((set: any, i: number) => 
                      `${set.p1 || 0}-${set.p2 || 0}`
                    ).join(", ") || "0-0"}
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

        <TabsContent value="point-log" className="space-y-6">
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

        <TabsContent value="stats" className="space-y-6">
          {parsedPoints.length > 0 ? (
            <div className="space-y-6">
              {/* Match Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Match Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard 
                      title="Total Points Won"
                      player1Value={matchStats.player1.totalPointsWon}
                      player2Value={matchStats.player2.totalPointsWon}
                      player1Name={playerNames.p1}
                      player2Name={playerNames.p2}
                    />
                    <StatCard 
                      title="Point Win %"
                      player1Value={Math.round(matchStats.player1.pointWinPercentage)}
                      player2Value={Math.round(matchStats.player2.pointWinPercentage)}
                      player1Name={playerNames.p1}
                      player2Name={playerNames.p2}
                      isPercentage={true}
                      showProgress={true}
                    />
                    <StatCard 
                      title="Winners"
                      player1Value={matchStats.player1.winners}
                      player2Value={matchStats.player2.winners}
                      player1Name={playerNames.p1}
                      player2Name={playerNames.p2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Serve Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Serve Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatCard 
                      title="First Serve %"
                      player1Value={Math.round(matchStats.player1.firstServePercentage)}
                      player2Value={Math.round(matchStats.player2.firstServePercentage)}
                      player1Name={playerNames.p1}
                      player2Name={playerNames.p2}
                      isPercentage={true}
                      showProgress={true}
                    />
                    <StatCard 
                      title="First Serve Points Won %"
                      player1Value={Math.round(matchStats.player1.firstServeWinPercentage)}
                      player2Value={Math.round(matchStats.player2.firstServeWinPercentage)}
                      player1Name={playerNames.p1}
                      player2Name={playerNames.p2}
                      isPercentage={true}
                      showProgress={true}
                    />
                    <StatCard 
                      title="Second Serve Points Won %"
                      player1Value={Math.round(matchStats.player1.secondServeWinPercentage)}
                      player2Value={Math.round(matchStats.player2.secondServeWinPercentage)}
                      player1Name={playerNames.p1}
                      player2Name={playerNames.p2}
                      isPercentage={true}
                      showProgress={true}
                    />
                    <StatCard 
                      title="Aces vs Double Faults"
                      player1Value={`${matchStats.player1.aces} - ${matchStats.player1.doubleFaults}`}
                      player2Value={`${matchStats.player2.aces} - ${matchStats.player2.doubleFaults}`}
                      player1Name={playerNames.p1}
                      player2Name={playerNames.p2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Return & Break Points */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Return & Break Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatCard 
                      title="Break Points Conversion %"
                      player1Value={Math.round(matchStats.player1.breakPointConversionPercentage)}
                      player2Value={Math.round(matchStats.player2.breakPointConversionPercentage)}
                      player1Name={playerNames.p1}
                      player2Name={playerNames.p2}
                      isPercentage={true}
                      showProgress={true}
                    />
                    <StatCard 
                      title="Break Points Saved %"
                      player1Value={Math.round(matchStats.player1.breakPointSavePercentage)}
                      player2Value={Math.round(matchStats.player2.breakPointSavePercentage)}
                      player1Name={playerNames.p1}
                      player2Name={playerNames.p2}
                      isPercentage={true}
                      showProgress={true}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Shot Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Shot Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard 
                      title="Forehand Winners"
                      player1Value={matchStats.player1.forehandWinners}
                      player2Value={matchStats.player2.forehandWinners}
                      player1Name={playerNames.p1}
                      player2Name={playerNames.p2}
                    />
                    <StatCard 
                      title="Backhand Winners"
                      player1Value={matchStats.player1.backhandWinners}
                      player2Value={matchStats.player2.backhandWinners}
                      player1Name={playerNames.p1}
                      player2Name={playerNames.p2}
                    />
                    <StatCard 
                      title="Unforced Errors"
                      player1Value={matchStats.player1.unforcedErrors}
                      player2Value={matchStats.player2.unforcedErrors}
                      player1Name={playerNames.p1}
                      player2Name={playerNames.p2}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No detailed statistics available. Point-by-point data is required for comprehensive statistics.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Advanced analysis features coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 