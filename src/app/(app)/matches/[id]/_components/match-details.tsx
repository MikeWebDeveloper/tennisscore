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
  Target,
  TrendingUp,
  BarChart3,
  Activity
} from "lucide-react"
import { Player } from "@/lib/types"
import { toast } from "sonner"

interface MatchDetailsProps {
  match: {
    $id: string
    playerOneId: string
    playerTwoId: string
    playerOne?: Player
    playerTwo?: Player
    winner?: Player
    matchDate: string
    status: "In Progress" | "Completed"
    score: string
    scoreParsed?: {
      sets: { p1: number; p2: number }[]
      games: number[]
      points: number[]
    }
    pointLog: any[]
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
    return scoreParsed.sets.map((set: any) => `${set.p1}-${set.p2}`).join(", ")
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

    let serves = { p1: { first: 0, firstIn: 0, second: 0, secondIn: 0 }, p2: { first: 0, firstIn: 0, second: 0, secondIn: 0 } }

    match.pointLog.forEach((point, index) => {
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
            <h1 className="text-2xl font-bold">
              {match.playerOne?.firstName} {match.playerOne?.lastName} vs{" "}
              {match.playerTwo?.firstName} {match.playerTwo?.lastName}
            </h1>
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
                    {formatScore(match.scoreParsed)}
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
                              {match.playerOne?.firstName}: {set.p1}
                            </span>
                            <span className="font-mono">
                              {match.playerTwo?.firstName}: {set.p2}
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
                  {match.pointLog.map((point, index) => (
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
                            Point won by {point.winner === "p1" ? 
                              `${match.playerOne?.firstName} ${match.playerOne?.lastName}` : 
                              `${match.playerTwo?.firstName} ${match.playerTwo?.lastName}`
                            }
                          </div>
                          {point.outcome && (
                            <div className="text-sm text-muted-foreground">
                              {point.outcome}
                              {point.shot && ` • ${point.shot}`}
                              {point.serve && ` • ${point.serve} Serve`}
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
                  ))}
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
                    <span className="text-sm">{match.playerOne?.firstName}</span>
                    <span className="font-bold">{pointAnalysis.winners.p1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{match.playerTwo?.firstName}</span>
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
                    <span className="text-sm">{match.playerOne?.firstName}</span>
                    <span className="font-bold">{pointAnalysis.unforcedErrors.p1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{match.playerTwo?.firstName}</span>
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
                    <span className="text-sm">{match.playerOne?.firstName}</span>
                    <span className="font-bold">{pointAnalysis.aces.p1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{match.playerTwo?.firstName}</span>
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
                    <span className="text-sm">{match.playerOne?.firstName}</span>
                    <span className="font-bold">{pointAnalysis.doubleFaults.p1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{match.playerTwo?.firstName}</span>
                    <span className="font-bold">{pointAnalysis.doubleFaults.p2}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">1st Serve %</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">{match.playerOne?.firstName}</span>
                    <span className="font-bold">{pointAnalysis.firstServePercentage.p1.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{match.playerTwo?.firstName}</span>
                    <span className="font-bold">{pointAnalysis.firstServePercentage.p2.toFixed(1)}%</span>
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
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {pointAnalysis.totalPoints > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">{match.playerOne?.firstName} {match.playerOne?.lastName}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Points Won:</span>
                          <span className="font-medium">
                            {pointAnalysis.winners.p1 + pointAnalysis.aces.p1} / {pointAnalysis.totalPoints}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Winners Hit:</span>
                          <span className="font-medium">{pointAnalysis.winners.p1}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Aces:</span>
                          <span className="font-medium">{pointAnalysis.aces.p1}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Unforced Errors:</span>
                          <span className="font-medium">{pointAnalysis.unforcedErrors.p1}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Double Faults:</span>
                          <span className="font-medium">{pointAnalysis.doubleFaults.p1}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">{match.playerTwo?.firstName} {match.playerTwo?.lastName}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Points Won:</span>
                          <span className="font-medium">
                            {pointAnalysis.winners.p2 + pointAnalysis.aces.p2} / {pointAnalysis.totalPoints}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Winners Hit:</span>
                          <span className="font-medium">{pointAnalysis.winners.p2}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Aces:</span>
                          <span className="font-medium">{pointAnalysis.aces.p2}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Unforced Errors:</span>
                          <span className="font-medium">{pointAnalysis.unforcedErrors.p2}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Double Faults:</span>
                          <span className="font-medium">{pointAnalysis.doubleFaults.p2}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No detailed analysis available. Points must be logged with detailed information for analysis.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 