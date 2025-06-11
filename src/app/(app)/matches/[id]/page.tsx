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

async function GeneratePointDataButton({ matchId }: { matchId: string }) {
  async function handleGenerateData() {
    "use server"
    const result = await generateDetailedPointData(matchId)
    if (result.success) {
      console.log(`Generated ${result.pointCount} detailed points for match ${matchId}`)
    }
  }

  return (
    <form action={handleGenerateData}>
      <Button type="submit" variant="outline" size="sm">
        Generate Test Point Data
      </Button>
    </form>
  )
}

export default async function MatchPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }

  try {
    const match = await getMatch(params.id)
    
    // Parse the match data
    const score = JSON.parse(match.score || "{}")
    const matchFormat = JSON.parse(match.matchFormat || "{}")
    const pointLog = match.pointLog || []
    
    // Get player information (you might want to fetch this from your players collection)
    const player1Name = "Michal Latal" // You'll want to fetch actual player names
    const player2Name = "Test Opponent"

    return (
      <div className="container mx-auto py-6 space-y-6">
        {/* Match Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Match Details</h1>
            <p className="text-muted-foreground">
              {new Date(match.matchDate).toLocaleDateString()} • Best of {matchFormat.sets} sets
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant={match.status === "Completed" ? "default" : "secondary"}>
              {match.status}
            </Badge>
            {process.env.NODE_ENV === "development" && match.status === "Completed" && pointLog.length === 0 && (
              <GeneratePointDataButton matchId={params.id} />
            )}
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pointlog">Point Log</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Match Score Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Match Score
                  {match.status === "Completed" && (
                    <Badge variant="default">Completed</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-4xl font-mono font-bold">
                    6–4, 6–3
                  </div>
                  {match.winnerId && (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl">🏆</span>
                      <span className="text-lg font-semibold">Winner: {player1Name}</span>
                    </div>
                  )}
                  
                  {/* Set by Set Score */}
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2">SET BY SET</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-lg">
                        <span>Set 1</span>
                        <span className="font-mono">{player1Name}: 6 {player2Name}: 4</span>
                      </div>
                      <div className="flex justify-between items-center text-lg">
                        <span>Set 2</span>
                        <span className="font-mono">{player1Name}: 6 {player2Name}: 3</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Match Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Match Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📅</span>
                    <span className="text-sm">Date: June 11, 2024</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">⏰</span>
                    <span className="text-sm">Time: 11:00 AM</span>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Format</p>
                    <p className="text-sm text-muted-foreground">Best of 3 sets</p>
                    <p className="text-sm text-muted-foreground">Traditional scoring</p>
                  </div>
                </CardContent>
              </Card>

              {/* Player Cards */}
              <div className="space-y-4">
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-900">🔵 Player 1</h3>
                        <p className="text-lg font-bold text-blue-800">{player1Name}</p>
                        <p className="text-sm text-blue-600">Rating: 1000</p>
                        <p className="text-sm text-blue-600">Born: 1990</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-red-900">🔴 Player 2</h3>
                        <p className="text-lg font-bold text-red-800">{player2Name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pointlog" className="space-y-6">
            {pointLog.length > 0 ? (
              <PointByPointView pointLog={pointLog} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No detailed point log available for this match.</p>
                  {process.env.NODE_ENV === "development" && match.status === "Completed" && (
                    <div className="mt-4">
                      <GeneratePointDataButton matchId={params.id} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            {pointLog.length > 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Detailed statistics will be available once the MatchStatsComponent is properly configured with player data.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Point log contains {pointLog.length} detailed points.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No detailed statistics available. Point-by-point data is required for comprehensive statistics.</p>
                  {process.env.NODE_ENV === "development" && match.status === "Completed" && (
                    <div className="mt-4">
                      <GeneratePointDataButton matchId={params.id} />
                    </div>
                  )}
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
  } catch (error) {
    console.error("Error fetching match:", error)
    redirect("/matches")
  }
} 