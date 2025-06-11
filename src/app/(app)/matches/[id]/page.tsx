import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { getMatch } from "@/lib/actions/matches"
import { databases } from "@/lib/appwrite-client"
import { Button } from "@/components/ui/button"
import { generateDetailedPointData } from "@/lib/actions/matches"
import { MatchStatsComponent } from "./_components/match-stats"
import { PointByPointView } from "./_components/point-by-point-view"
import { calculateMatchStats } from "@/lib/utils/match-stats"
import { PointDetail } from "@/lib/types"
import { Progress } from "@/components/ui/progress"

async function GeneratePointDataButton({ matchId }: { matchId: string }) {
  async function handleGenerate() {
    "use server"
    await generateDetailedPointData(matchId)
  }

  return (
    <form action={handleGenerate}>
      <Button type="submit" variant="outline" size="sm">
        Generate Test Point Data
      </Button>
    </form>
  )
}

function DetailedStatsView({ pointLog, playerNames }: { 
  pointLog: (string | PointDetail)[], 
  playerNames: { p1: string; p2: string } 
}) {
  // Parse point log
  const parsedPoints: PointDetail[] = pointLog.map(point => {
    if (typeof point === 'string') {
      try {
        return JSON.parse(point)
      } catch {
        return null
      }
    }
    return point
  }).filter(Boolean) as PointDetail[]

  if (parsedPoints.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No detailed point data available for statistics</p>
        </CardContent>
      </Card>
    )
  }

  const matchStats = calculateMatchStats(parsedPoints)

  const StatCard = ({ title, player1Value, player2Value, isPercentage = false }: {
    title: string
    player1Value: number
    player2Value: number
    isPercentage?: boolean
  }) => (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-lg font-bold">
            {isPercentage ? `${player1Value.toFixed(0)}%` : player1Value}
          </div>
          <div className="text-xs text-muted-foreground">{playerNames.p1.split(' ')[0]}</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">
            {isPercentage ? `${player2Value.toFixed(0)}%` : player2Value}
          </div>
          <div className="text-xs text-muted-foreground">{playerNames.p2.split(' ')[0]}</div>
        </div>
      </div>
      {isPercentage && (
        <div className="space-y-1">
          <Progress value={player1Value} className="h-1" />
          <Progress value={player2Value} className="h-1" />
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Match Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Match Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Total Points Won"
              player1Value={matchStats.player1.totalPointsWon}
              player2Value={matchStats.player2.totalPointsWon}
            />
            <StatCard 
              title="Point Win %"
              player1Value={matchStats.player1.pointWinPercentage}
              player2Value={matchStats.player2.pointWinPercentage}
              isPercentage={true}
            />
            <StatCard 
              title="Winners"
              player1Value={matchStats.player1.winners}
              player2Value={matchStats.player2.winners}
            />
          </div>
        </CardContent>
      </Card>

      {/* Serve Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Serve Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">First Serve</h4>
              <StatCard 
                title="First Serve %"
                player1Value={matchStats.player1.firstServePercentage}
                player2Value={matchStats.player2.firstServePercentage}
                isPercentage={true}
              />
              <StatCard 
                title="First Serve Points Won %"
                player1Value={matchStats.player1.firstServeWinPercentage}
                player2Value={matchStats.player2.firstServeWinPercentage}
                isPercentage={true}
              />
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Second Serve</h4>
              <StatCard 
                title="Second Serve Points Won %"
                player1Value={matchStats.player1.secondServeWinPercentage}
                player2Value={matchStats.player2.secondServeWinPercentage}
                isPercentage={true}
              />
              <div className="grid grid-cols-2 gap-4">
                <StatCard 
                  title="Aces"
                  player1Value={matchStats.player1.aces}
                  player2Value={matchStats.player2.aces}
                />
                <StatCard 
                  title="Double Faults"
                  player1Value={matchStats.player1.doubleFaults}
                  player2Value={matchStats.player2.doubleFaults}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Return & Break Points */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Return & Break Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard 
              title="Break Points Conversion %"
              player1Value={matchStats.player1.breakPointConversionPercentage}
              player2Value={matchStats.player2.breakPointConversionPercentage}
              isPercentage={true}
            />
            <StatCard 
              title="Break Points Saved %"
              player1Value={matchStats.player1.breakPointSavePercentage}
              player2Value={matchStats.player2.breakPointSavePercentage}
              isPercentage={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Shot Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Shot Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Forehand</h4>
              <StatCard 
                title="Winners"
                player1Value={matchStats.player1.forehandWinners}
                player2Value={matchStats.player2.forehandWinners}
              />
              <StatCard 
                title="Errors"
                player1Value={matchStats.player1.forehandErrors}
                player2Value={matchStats.player2.forehandErrors}
              />
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Backhand</h4>
              <StatCard 
                title="Winners"
                player1Value={matchStats.player1.backhandWinners}
                player2Value={matchStats.player2.backhandWinners}
              />
              <StatCard 
                title="Errors"
                player1Value={matchStats.player1.backhandErrors}
                player2Value={matchStats.player2.backhandErrors}
              />
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Net Points</h4>
              <StatCard 
                title="Net Points Won %"
                player1Value={matchStats.player1.netPointWinPercentage}
                player2Value={matchStats.player2.netPointWinPercentage}
                isPercentage={true}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Error Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard 
              title="Unforced Errors"
              player1Value={matchStats.player1.unforcedErrors}
              player2Value={matchStats.player2.unforcedErrors}
            />
            <StatCard 
              title="Forced Errors"
              player1Value={matchStats.player1.forcedErrors}
              player2Value={matchStats.player2.forcedErrors}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function MatchPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const match = await getMatch(params.id)
  if (!match) {
    redirect("/matches")
  }

  // Parse point log
  const pointLog = Array.isArray(match.pointLog) ? match.pointLog : []
  
  // Get player names from the match
  const playerNames = {
    p1: match.playerOne?.firstName + " " + match.playerOne?.lastName || "Player 1",
    p2: match.playerTwo?.firstName + " " + match.playerTwo?.lastName || "Player 2"
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Match Details</h1>
        <div className="flex items-center gap-4 text-muted-foreground">
          <span>{playerNames.p1} vs {playerNames.p2}</span>
          <Badge variant={match.status === "Completed" ? "secondary" : "default"}>
            {match.status}
          </Badge>
          <span>{new Date(match.matchDate).toLocaleDateString()}</span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="points">Point Log</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Match Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Players</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>{playerNames.p1}</span>
                      {match.winnerId === match.playerOneId && <Badge>Winner</Badge>}
                    </div>
                    <div className="flex justify-between">
                      <span>{playerNames.p2}</span>
                      {match.winnerId === match.playerTwoId && <Badge>Winner</Badge>}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Match Information</h3>
                  <div className="space-y-1 text-sm">
                    <div>Date: {new Date(match.matchDate).toLocaleDateString()}</div>
                    <div>Status: {match.status}</div>
                    <div>Points Logged: {pointLog.length}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="points" className="space-y-6">
          <PointByPointView pointLog={pointLog} playerNames={playerNames} />
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <DetailedStatsView pointLog={pointLog} playerNames={playerNames} />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Advanced analysis features coming soon...</p>
              {process.env.NODE_ENV === "development" && match.status === "Completed" && pointLog.length === 0 && (
                <div className="mt-4">
                  <GeneratePointDataButton matchId={params.id} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 