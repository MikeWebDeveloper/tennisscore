"use client"

import Link from "next/link"
import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Trophy, 
  Share2, 
  Play, 
  TrendingUp,
  BarChart3,
  Activity,
  Users
} from "lucide-react"
import { Player } from "@/lib/types"
import { toast } from "sonner"

interface MatchDetailsProps {
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
    userId: string
    $collectionId: string
    $databaseId: string
    $createdAt: string
    $updatedAt: string
    $permissions: string[]
  }
}

interface PointAnalysis {
  totalPoints: number
  winners: { p1: number; p2: number }
  unforcedErrors: { p1: number; p2: number }
  aces: { p1: number; p2: number }
  doubleFaults: { p1: number; p2: number }
  firstServePercentage: { p1: number; p2: number }
  firstServePointsWon: { p1: number; p2: number }
  secondServePointsWon: { p1: number; p2: number }
  breakPointsConverted: { p1: number; p2: number }
  breakPointsTotal: { p1: number; p2: number }
}

export function MatchDetails({ match }: MatchDetailsProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const isDoubles = match.playerThreeId && match.playerFourId

  const handleShareMatch = () => {
    const shareUrl = `${window.location.origin}/live/${match.$id}`
    navigator.clipboard.writeText(shareUrl)
    setCopiedLink(true)
    toast.success("Live match link copied to clipboard!")
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const formatScore = (scoreParsed: { sets: { p1: number; p2: number }[] }) => {
    if (!scoreParsed?.sets || scoreParsed.sets.length === 0) {
      return "0-0"
    }
    return scoreParsed.sets.map((set: { p1: number; p2: number }) => `${set.p1}-${set.p2}`).join(", ")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getMatchTitle = () => {
    if (isDoubles) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg text-muted-foreground">Doubles Match</span>
          </div>
          <div className="text-2xl font-bold">
            {match.playerOne?.firstName} {match.playerOne?.lastName} / {match.playerThree?.firstName} {match.playerThree?.lastName}
          </div>
          <div className="text-lg text-muted-foreground">vs</div>
          <div className="text-2xl font-bold">
            {match.playerTwo?.firstName} {match.playerTwo?.lastName} / {match.playerFour?.firstName} {match.playerFour?.lastName}
          </div>
        </div>
      )
    }
    
    return (
      <h1 className="text-2xl font-bold">
        {match.playerOne?.firstName} {match.playerOne?.lastName} vs{" "}
        {match.playerTwo?.firstName} {match.playerTwo?.lastName}
      </h1>
    )
  }

  const getTeamName = (team: "team1" | "team2") => {
    if (!isDoubles) {
      return team === "team1" 
        ? `${match.playerOne?.firstName} ${match.playerOne?.lastName}`
        : `${match.playerTwo?.firstName} ${match.playerTwo?.lastName}`
    }
    
    return team === "team1"
      ? `${match.playerOne?.firstName} / ${match.playerThree?.firstName}`
      : `${match.playerTwo?.firstName} / ${match.playerFour?.firstName}`
  }

  // Analyze point log for detailed statistics
  const analyzePoints = (): PointAnalysis => {
    const analysis: PointAnalysis = {
      totalPoints: match.pointLog.length,
      winners: { p1: 0, p2: 0 },
      unforcedErrors: { p1: 0, p2: 0 },
      aces: { p1: 0, p2: 0 },
      doubleFaults: { p1: 0, p2: 0 },
      firstServePercentage: { p1: 0, p2: 0 },
      firstServePointsWon: { p1: 0, p2: 0 },
      secondServePointsWon: { p1: 0, p2: 0 },
      breakPointsConverted: { p1: 0, p2: 0 },
      breakPointsTotal: { p1: 0, p2: 0 }
    }

    const serves = { p1: { first: 0, firstIn: 0, second: 0, secondIn: 0 }, p2: { first: 0, firstIn: 0, second: 0, secondIn: 0 } }

    match.pointLog.forEach((pointStr) => {
      try {
        const point = JSON.parse(pointStr)
        const player = point.winner === "p1" ? "p1" : "p2"
        const opponent = player === "p1" ? "p2" : "p1"

        // Count winners and errors
        if (point.outcome === "Winner") {
          analysis.winners[player]++
        } else if (point.outcome === "Unforced Error") {
          analysis.unforcedErrors[opponent]++
        } else if (point.outcome === "Ace") {
          analysis.aces[player]++
        } else if (point.outcome === "Double Fault") {
          analysis.doubleFaults[opponent]++
        }

        // Track serve statistics
        if (point.serve) {
          const server = point.server === "p1" ? "p1" : "p2"
          if (point.serve === "First") {
            serves[server].first++
            if (point.serveIn) serves[server].firstIn++
          } else if (point.serve === "Second") {
            serves[server].second++
            if (point.serveIn) serves[server].secondIn++
          }

          // Track serve points won
          if (point.serveIn && point.winner === server) {
            if (point.serve === "First") {
              analysis.firstServePointsWon[server]++
            } else {
              analysis.secondServePointsWon[server]++
            }
          }
        }

        // Track break points (simplified - would need game context for accuracy)
        if (point.breakPoint) {
          const returner = point.server === "p1" ? "p2" : "p1"
          analysis.breakPointsTotal[returner]++
          if (point.winner === returner) {
            analysis.breakPointsConverted[returner]++
          }
        }
      } catch {
        // Skip invalid point log entries
        console.warn('Invalid point log entry:', pointStr)
      }
    })

    // Calculate percentages
    analysis.firstServePercentage.p1 = serves.p1.first > 0 ? (serves.p1.firstIn / serves.p1.first) * 100 : 0
    analysis.firstServePercentage.p2 = serves.p2.first > 0 ? (serves.p2.firstIn / serves.p2.first) * 100 : 0

    return analysis
  }

  const pointAnalysis = analyzePoints()

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/matches">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Matches
            </Link>
          </Button>
          <div>
            {getMatchTitle()}
            <p className="text-muted-foreground">
              Match Details • {formatDate(match.matchDate)} at {formatTime(match.matchDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShareMatch}
            className={copiedLink ? "bg-green-50 border-green-200" : ""}
          >
            <Share2 className="h-4 w-4 mr-2" />
            {copiedLink ? "Copied!" : "Share Live"}
          </Button>
          {match.status === "In Progress" && (
            <Button size="sm" asChild>
              <Link href={`/matches/live/${match.$id}`}>
                <Play className="h-4 w-4 mr-2" />
                Continue Scoring
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="points" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Point Log
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analysis
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Match Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Match Score
                  <Badge variant={match.status === "Completed" ? "default" : "secondary"}>
                    {match.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-3xl font-mono font-bold">
                    {match.scoreParsed ? formatScore(match.scoreParsed) : "0-0"}
                  </div>
                  {match.winner && (
                    <div className="flex items-center justify-center gap-2 text-lg">
                      <Trophy className="h-5 w-5 text-muted-foreground" />
                      Winner: {match.winner.firstName} {match.winner.lastName}
                    </div>
                  )}

                  {match.scoreParsed?.sets && match.scoreParsed.sets.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        Set by Set
                      </h4>
                      {match.scoreParsed.sets.map((set, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>Set {index + 1}</span>
                          <div className="flex items-center gap-4">
                            <span className="font-mono">
                              {getTeamName("team1")}: {set.p1}
                            </span>
                            <span className="font-mono">
                              {getTeamName("team2")}: {set.p2}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Match Information */}
            <Card>
              <CardHeader>
                <CardTitle>Match Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Date: {formatDate(match.matchDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Time: {formatTime(match.matchDate)}</span>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Format</h4>
                  {(() => {
                    try {
                      const format = JSON.parse(match.matchFormat)
                      return (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>Best of {format.sets} sets</div>
                          <div>{format.noAd ? "No-Ad scoring" : "Traditional scoring"}</div>
                          <div>{isDoubles ? "Doubles" : "Singles"} Match</div>
                        </div>
                      )
                    } catch {
                      return <div className="text-sm text-muted-foreground">Standard format</div>
                    }
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Players */}
          {!isDoubles ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    Player 1
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      {match.playerOne?.firstName} {match.playerOne?.lastName}
                    </h3>
                    {match.playerOne?.rating && (
                      <p className="text-sm text-muted-foreground">Rating: {match.playerOne.rating}</p>
                    )}
                    {match.playerOne?.yearOfBirth && (
                      <p className="text-sm text-muted-foreground">
                        Born: {match.playerOne.yearOfBirth}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    Player 2
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      {match.playerTwo?.firstName} {match.playerTwo?.lastName}
                    </h3>
                    {match.playerTwo?.rating && (
                      <p className="text-sm text-muted-foreground">Rating: {match.playerTwo.rating}</p>
                    )}
                    {match.playerTwo?.yearOfBirth && (
                      <p className="text-sm text-muted-foreground">
                        Born: {match.playerTwo.yearOfBirth}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    Team 1
                    <Users className="h-4 w-4 text-muted-foreground ml-auto" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      {match.playerOne?.firstName} {match.playerOne?.lastName}
                    </h3>
                    {match.playerOne?.rating && (
                      <p className="text-sm text-muted-foreground">Rating: {match.playerOne.rating}</p>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      {match.playerThree?.firstName} {match.playerThree?.lastName}
                    </h3>
                    {match.playerThree?.rating && (
                      <p className="text-sm text-muted-foreground">Rating: {match.playerThree.rating}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    Team 2
                    <Users className="h-4 w-4 text-muted-foreground ml-auto" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      {match.playerTwo?.firstName} {match.playerTwo?.lastName}
                    </h3>
                    {match.playerTwo?.rating && (
                      <p className="text-sm text-muted-foreground">Rating: {match.playerTwo.rating}</p>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      {match.playerFour?.firstName} {match.playerFour?.lastName}
                    </h3>
                    {match.playerFour?.rating && (
                      <p className="text-sm text-muted-foreground">Rating: {match.playerFour.rating}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Point Log Tab */}
        <TabsContent value="points" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Point-by-Point Log ({match.pointLog.length} points)</CardTitle>
            </CardHeader>
            <CardContent>
              {match.pointLog.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No detailed point log available for this match.
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {match.pointLog.map((pointStr, index) => {
                    try {
                      const point = JSON.parse(pointStr)
                      const winnerName = point.winner === "p1" 
                        ? getTeamName("team1")
                        : getTeamName("team2")
                      
                      return (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">
                                Point won by {winnerName}
                              </div>
                              {point.pointOutcome && (
                                <div className="text-sm text-muted-foreground">
                                  {point.pointOutcome}
                                  {point.lastShotType && ` • ${point.lastShotType}`}
                                  {point.serveType && ` • ${point.serveType} Serve`}
                                </div>
                              )}
                            </div>
                          </div>
                          {point.gameScore && (
                            <div className="text-sm font-mono text-muted-foreground">
                              {point.gameScore}
                            </div>
                          )}
                        </div>
                      )
                    } catch {
                      return (
                        <div key={index} className="p-3 rounded-lg border bg-muted/30 text-muted-foreground">
                          Point #{index + 1} (Invalid data)
                        </div>
                      )
                    }
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pointAnalysis.totalPoints}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Winners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">{getTeamName("team1")}</span>
                    <span className="font-bold">{pointAnalysis.winners.p1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{getTeamName("team2")}</span>
                    <span className="font-bold">{pointAnalysis.winners.p2}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Unforced Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">{getTeamName("team1")}</span>
                    <span className="font-bold">{pointAnalysis.unforcedErrors.p1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{getTeamName("team2")}</span>
                    <span className="font-bold">{pointAnalysis.unforcedErrors.p2}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Aces</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">{getTeamName("team1")}</span>
                    <span className="font-bold">{pointAnalysis.aces.p1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{getTeamName("team2")}</span>
                    <span className="font-bold">{pointAnalysis.aces.p2}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Double Faults</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">{getTeamName("team1")}</span>
                    <span className="font-bold">{pointAnalysis.doubleFaults.p1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{getTeamName("team2")}</span>
                    <span className="font-bold">{pointAnalysis.doubleFaults.p2}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">First Serve %</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">{getTeamName("team1")}</span>
                    <span className="font-bold">{pointAnalysis.firstServePercentage.p1.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{getTeamName("team2")}</span>
                    <span className="font-bold">{pointAnalysis.firstServePercentage.p2.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Break Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">{getTeamName("team1")}</span>
                    <span className="font-bold">
                      {pointAnalysis.breakPointsConverted.p1}/{pointAnalysis.breakPointsTotal.p1}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{getTeamName("team2")}</span>
                    <span className="font-bold">
                      {pointAnalysis.breakPointsConverted.p2}/{pointAnalysis.breakPointsTotal.p2}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Match Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Performance Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    {pointAnalysis.totalPoints > 0 ? (
                      <>
                        The match consisted of {pointAnalysis.totalPoints} points. 
                        {pointAnalysis.winners.p1 > pointAnalysis.winners.p2 
                          ? ` ${getTeamName("team1")} hit more winners (${pointAnalysis.winners.p1}) compared to ${getTeamName("team2")} (${pointAnalysis.winners.p2}).`
                          : ` ${getTeamName("team2")} hit more winners (${pointAnalysis.winners.p2}) compared to ${getTeamName("team1")} (${pointAnalysis.winners.p1}).`
                        }
                      </>
                    ) : (
                      "No detailed statistics available for this match."
                    )}
                  </p>
                </div>
                
                {pointAnalysis.totalPoints > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">Serving Performance</h3>
                      <p className="text-sm text-muted-foreground">
                        {getTeamName("team1")} served at {pointAnalysis.firstServePercentage.p1.toFixed(1)}% first serves, 
                        while {getTeamName("team2")} achieved {pointAnalysis.firstServePercentage.p2.toFixed(1)}%.
                        {pointAnalysis.aces.p1 + pointAnalysis.aces.p2 > 0 && 
                          ` The match featured ${pointAnalysis.aces.p1 + pointAnalysis.aces.p2} total aces.`
                        }
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 