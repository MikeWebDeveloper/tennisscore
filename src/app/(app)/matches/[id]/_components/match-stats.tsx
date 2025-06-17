"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { MatchStats, Player } from "@/lib/types"
import { Trophy, Target, Zap, TrendingUp, Activity } from "lucide-react"

interface MatchStatsProps {
  stats: MatchStats
  playerOne: Player
  playerTwo: Player
  winner?: "p1" | "p2"
}

export function MatchStatsComponent({ stats, playerOne, playerTwo, winner }: MatchStatsProps) {
  const player1Name = `${playerOne.firstName} ${playerOne.lastName}`
  const player2Name = `${playerTwo.firstName} ${playerTwo.lastName}`

  const StatRow = ({ 
    label, 
    player1Value, 
    player2Value, 
    player1Percentage, 
    player2Percentage,
    isPercentage = false,
    showProgress = false
  }: {
    label: string
    player1Value: number | string
    player2Value: number | string
    player1Percentage?: number
    player2Percentage?: number
    isPercentage?: boolean
    showProgress?: boolean
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">{label}</span>
      </div>
      <div className="grid grid-cols-3 gap-4 items-center">
        <div className="text-right">
          <span className="font-mono text-lg">
            {isPercentage ? `${player1Value}%` : player1Value}
          </span>
          {player1Percentage !== undefined && (
            <div className="text-xs text-muted-foreground">
              ({player1Percentage}%)
            </div>
          )}
        </div>
        {showProgress && player1Percentage !== undefined && player2Percentage !== undefined && (
          <div className="flex items-center space-x-2">
            <Progress value={player1Percentage} className="flex-1 h-2" />
            <Progress value={player2Percentage} className="flex-1 h-2 rotate-180" />
          </div>
        )}
        {!showProgress && (
          <div className="h-2" />
        )}
        <div className="text-left">
          <span className="font-mono text-lg">
            {isPercentage ? `${player2Value}%` : player2Value}
          </span>
          {player2Percentage !== undefined && (
            <div className="text-xs text-muted-foreground">
              ({player2Percentage}%)
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Match Statistics</h2>
        <div className="flex justify-center items-center gap-4">
          <div className={`text-lg font-semibold ${winner === "p1" ? "text-primary" : ""}`}>
            {player1Name}
            {winner === "p1" && <Trophy className="inline h-4 w-4 ml-2" />}
          </div>
          <span className="text-muted-foreground">vs</span>
          <div className={`text-lg font-semibold ${winner === "p2" ? "text-primary" : ""}`}>
            {player2Name}
            {winner === "p2" && <Trophy className="inline h-4 w-4 ml-2" />}
          </div>
        </div>
      </div>

      {/* Match Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Match Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatRow
            label="Total Points Won"
            player1Value={stats.player1.totalPointsWon}
            player2Value={stats.player2.totalPointsWon}
            player1Percentage={Math.round(stats.player1.pointWinPercentage)}
            player2Percentage={Math.round(stats.player2.pointWinPercentage)}
            showProgress
          />
          <Separator />
          <StatRow
            label="Winners"
            player1Value={stats.player1.winners}
            player2Value={stats.player2.winners}
          />
          <StatRow
            label="Unforced Errors"
            player1Value={stats.player1.unforcedErrors}
            player2Value={stats.player2.unforcedErrors}
          />
          <StatRow
            label="Forced Errors"
            player1Value={stats.player1.forcedErrors}
            player2Value={stats.player2.forcedErrors}
          />
        </CardContent>
      </Card>

      {/* Serve Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Serve Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatRow
            label="First Serve %"
            player1Value={Math.round(stats.player1.firstServePercentage)}
            player2Value={Math.round(stats.player2.firstServePercentage)}
            isPercentage
            showProgress
            player1Percentage={stats.player1.firstServePercentage}
            player2Percentage={stats.player2.firstServePercentage}
          />
          <StatRow
            label="First Serve Points Won"
            player1Value={Math.round(stats.player1.firstServeWinPercentage)}
            player2Value={Math.round(stats.player2.firstServeWinPercentage)}
            isPercentage
            player1Percentage={stats.player1.firstServePointsWon}
            player2Percentage={stats.player1.firstServePointsPlayed}
          />
          <StatRow
            label="Second Serve Points Won"
            player1Value={Math.round(stats.player1.secondServeWinPercentage)}
            player2Value={Math.round(stats.player2.secondServeWinPercentage)}
            isPercentage
            player1Percentage={stats.player1.secondServePointsWon}
            player2Percentage={stats.player1.secondServePointsPlayed}
          />
          <Separator />
          <StatRow
            label="Aces"
            player1Value={stats.player1.aces}
            player2Value={stats.player2.aces}
          />
          <StatRow
            label="Double Faults"
            player1Value={stats.player1.doubleFaults}
            player2Value={stats.player2.doubleFaults}
          />
        </CardContent>
      </Card>

      {/* Return Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Return Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatRow
            label="First Return Points Won"
            player1Value={Math.round(stats.player1.firstReturnWinPercentage)}
            player2Value={Math.round(stats.player2.firstReturnWinPercentage)}
            isPercentage
            showProgress
            player1Percentage={stats.player1.firstReturnWinPercentage}
            player2Percentage={stats.player2.firstReturnWinPercentage}
          />
          <StatRow
            label="Second Return Points Won"
            player1Value={Math.round(stats.player1.secondReturnWinPercentage)}
            player2Value={Math.round(stats.player2.secondReturnWinPercentage)}
            isPercentage
            showProgress
            player1Percentage={stats.player1.secondReturnWinPercentage}
            player2Percentage={stats.player2.secondReturnWinPercentage}
          />
        </CardContent>
      </Card>

      {/* Break Point Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Break Point Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatRow
            label="Break Points Converted"
            player1Value={`${stats.player1.breakPointsWon}/${stats.player1.breakPointsPlayed}`}
            player2Value={`${stats.player2.breakPointsWon}/${stats.player2.breakPointsPlayed}`}
            player1Percentage={Math.round(stats.player1.breakPointConversionPercentage)}
            player2Percentage={Math.round(stats.player2.breakPointConversionPercentage)}
          />
          <StatRow
            label="Break Points Saved"
            player1Value={`${stats.player1.breakPointsSaved}/${stats.player1.breakPointsFaced}`}
            player2Value={`${stats.player2.breakPointsSaved}/${stats.player2.breakPointsFaced}`}
            player1Percentage={Math.round(stats.player1.breakPointSavePercentage)}
            player2Percentage={Math.round(stats.player2.breakPointSavePercentage)}
          />
        </CardContent>
      </Card>

      {/* Shot Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Shot Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">{player1Name}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Forehand Winners</span>
                  <span className="font-mono">{stats.player1.forehandWinners}</span>
                </div>
                <div className="flex justify-between">
                  <span>Forehand Errors</span>
                  <span className="font-mono">{stats.player1.forehandErrors}</span>
                </div>
                <div className="flex justify-between">
                  <span>Backhand Winners</span>
                  <span className="font-mono">{stats.player1.backhandWinners}</span>
                </div>
                <div className="flex justify-between">
                  <span>Backhand Errors</span>
                  <span className="font-mono">{stats.player1.backhandErrors}</span>
                </div>
                <div className="flex justify-between">
                  <span>Net Points Won</span>
                  <span className="font-mono">
                    {stats.player1.netPointsWon}/{stats.player1.netPointsPlayed} 
                    ({Math.round(stats.player1.netPointWinPercentage)}%)
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">{player2Name}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Forehand Winners</span>
                  <span className="font-mono">{stats.player2.forehandWinners}</span>
                </div>
                <div className="flex justify-between">
                  <span>Forehand Errors</span>
                  <span className="font-mono">{stats.player2.forehandErrors}</span>
                </div>
                <div className="flex justify-between">
                  <span>Backhand Winners</span>
                  <span className="font-mono">{stats.player2.backhandWinners}</span>
                </div>
                <div className="flex justify-between">
                  <span>Backhand Errors</span>
                  <span className="font-mono">{stats.player2.backhandErrors}</span>
                </div>
                <div className="flex justify-between">
                  <span>Net Points Won</span>
                  <span className="font-mono">
                    {stats.player2.netPointsWon}/{stats.player2.netPointsPlayed} 
                    ({Math.round(stats.player2.netPointWinPercentage)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 