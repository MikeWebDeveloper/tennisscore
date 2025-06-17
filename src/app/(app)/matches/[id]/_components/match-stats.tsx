"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
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

  // Animated Professional Tennis Stats Component
  const StatBar = ({ 
    label, 
    player1Value, 
    player2Value, 
    player1Detailed, 
    player2Detailed,
    showPercentage = false,
    isCount = false,
    delay = 0
  }: {
    label: string
    player1Value: number | string
    player2Value: number | string
    player1Detailed?: string
    player2Detailed?: string
    showPercentage?: boolean
    isCount?: boolean
    delay?: number
  }) => {
    const p1Val = typeof player1Value === 'number' ? player1Value : parseFloat(String(player1Value))
    const p2Val = typeof player2Value === 'number' ? player2Value : parseFloat(String(player2Value))
    
    // Calculate progress bar percentages for visual comparison
    let p1Progress = 0
    let p2Progress = 0
    
    if (!isCount && showPercentage) {
      p1Progress = p1Val
      p2Progress = p2Val
    } else if (isCount) {
      const total = p1Val + p2Val
      if (total > 0) {
        p1Progress = (p1Val / total) * 100
        p2Progress = (p2Val / total) * 100
      }
    }

    return (
      <motion.div 
        className="py-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
      >
        <div className="flex justify-between items-center mb-2">
          <motion.div 
            className="text-center flex-1"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: delay + 0.2 }}
          >
            <motion.div 
              className="text-lg font-bold font-mono"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15,
                delay: delay + 0.4 
              }}
            >
              {showPercentage ? `${player1Value}%` : player1Value}
            </motion.div>
            {player1Detailed && (
              <motion.div 
                className="text-xs text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.6 }}
              >
                {player1Detailed}
              </motion.div>
            )}
          </motion.div>
          
          <div className="flex-1 text-center px-4">
            <motion.div 
              className="text-sm font-medium text-muted-foreground mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.1 }}
            >
              {label}
            </motion.div>
            {(showPercentage || isCount) && (
              <div className="flex items-center gap-2">
                <div className="w-full bg-muted rounded-full h-3 relative overflow-hidden">
                  <motion.div 
                    className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full absolute top-0 left-0"
                    initial={{ width: 0 }}
                    animate={{ width: `${p1Progress}%` }}
                    transition={{ 
                      duration: 1.2, 
                      delay: delay + 0.3,
                      ease: "easeOut"
                    }}
                  />
                  <motion.div 
                    className="bg-gradient-to-l from-red-500 to-red-400 h-full rounded-full absolute top-0 right-0"
                    initial={{ width: 0 }}
                    animate={{ width: `${p2Progress}%` }}
                    transition={{ 
                      duration: 1.2, 
                      delay: delay + 0.3,
                      ease: "easeOut"
                    }}
                  />
                  
                  {/* Animated shine effect */}
                  <motion.div
                    className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                    initial={{ x: "-100%" }}
                    animate={{ x: "400%" }}
                    transition={{
                      duration: 1.5,
                      delay: delay + 1.0,
                      ease: "easeInOut"
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          
          <motion.div 
            className="text-center flex-1"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: delay + 0.2 }}
          >
            <motion.div 
              className="text-lg font-bold font-mono"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15,
                delay: delay + 0.4 
              }}
            >
              {showPercentage ? `${player2Value}%` : player2Value}
            </motion.div>
            {player2Detailed && (
              <motion.div 
                className="text-xs text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.6 }}
              >
                {player2Detailed}
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Activity className="h-6 w-6" />
            Match Statistics
          </CardTitle>
          <div className="flex justify-center items-center gap-6 mt-4">
            <div className={`text-lg font-bold ${winner === "p1" ? "text-blue-600" : "text-muted-foreground"}`}>
              {player1Name}
              {winner === "p1" && <Trophy className="inline h-5 w-5 ml-2" />}
            </div>
            <span className="text-muted-foreground font-medium">vs</span>
            <div className={`text-lg font-bold ${winner === "p2" ? "text-red-600" : "text-muted-foreground"}`}>
              {player2Name}
              {winner === "p2" && <Trophy className="inline h-5 w-5 ml-2" />}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Service Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 divide-y">
          <StatBar
            label="Aces"
            player1Value={stats.player1.aces}
            player2Value={stats.player2.aces}
            isCount
            delay={0.1}
          />
          
          <StatBar
            label="Double Faults"
            player1Value={stats.player1.doubleFaults}
            player2Value={stats.player2.doubleFaults}
            isCount
            delay={0.2}
          />
          
          <StatBar
            label="1st Serve Percentage"
            player1Value={Math.round(stats.player1.firstServePercentage)}
            player2Value={Math.round(stats.player2.firstServePercentage)}
            player1Detailed={`(${stats.player1.firstServesMade}/${stats.player1.firstServesAttempted})`}
            player2Detailed={`(${stats.player2.firstServesMade}/${stats.player2.firstServesAttempted})`}
            showPercentage
            delay={0.3}
          />
          
          <StatBar
            label="1st Serve Points Won"
            player1Value={Math.round(stats.player1.firstServeWinPercentage)}
            player2Value={Math.round(stats.player2.firstServeWinPercentage)}
            player1Detailed={`(${stats.player1.firstServePointsWon}/${stats.player1.firstServePointsPlayed})`}
            player2Detailed={`(${stats.player2.firstServePointsWon}/${stats.player2.firstServePointsPlayed})`}
            showPercentage
            delay={0.4}
          />
          
          <StatBar
            label="2nd Serve Points Won"
            player1Value={Math.round(stats.player1.secondServeWinPercentage)}
            player2Value={Math.round(stats.player2.secondServeWinPercentage)}
            player1Detailed={`(${stats.player1.secondServePointsWon}/${stats.player1.secondServePointsPlayed})`}
            player2Detailed={`(${stats.player2.secondServePointsWon}/${stats.player2.secondServePointsPlayed})`}
            showPercentage
            delay={0.5}
          />
        </CardContent>
      </Card>

      {/* Return Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Return
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 divide-y">
          <StatBar
            label="1st Return Points Won"
            player1Value={Math.round(stats.player1.firstReturnWinPercentage)}
            player2Value={Math.round(stats.player2.firstReturnWinPercentage)}
            player1Detailed={`(${stats.player1.firstReturnPointsWon}/${stats.player1.firstReturnPointsPlayed})`}
            player2Detailed={`(${stats.player2.firstReturnPointsWon}/${stats.player2.firstReturnPointsPlayed})`}
            showPercentage
            delay={0.6}
          />
          
          <StatBar
            label="2nd Return Points Won"
            player1Value={Math.round(stats.player1.secondReturnWinPercentage)}
            player2Value={Math.round(stats.player2.secondReturnWinPercentage)}
            player1Detailed={`(${stats.player1.secondReturnPointsWon}/${stats.player1.secondReturnPointsPlayed})`}
            player2Detailed={`(${stats.player2.secondReturnPointsWon}/${stats.player2.secondReturnPointsPlayed})`}
            showPercentage
            delay={0.7}
          />
          
          <StatBar
            label="Break Points Saved"
            player1Value={Math.round(stats.player1.breakPointSavePercentage)}
            player2Value={Math.round(stats.player2.breakPointSavePercentage)}
            player1Detailed={`(${stats.player1.breakPointsSaved}/${stats.player1.breakPointsFaced})`}
            player2Detailed={`(${stats.player2.breakPointsSaved}/${stats.player2.breakPointsFaced})`}
            showPercentage
            delay={0.8}
          />
          
          <StatBar
            label="Break Points Converted"
            player1Value={Math.round(stats.player1.breakPointConversionPercentage)}
            player2Value={Math.round(stats.player2.breakPointConversionPercentage)}
            player1Detailed={`(${stats.player1.breakPointsWon}/${stats.player1.breakPointsPlayed})`}
            player2Detailed={`(${stats.player2.breakPointsWon}/${stats.player2.breakPointsPlayed})`}
            showPercentage
            delay={0.9}
          />
        </CardContent>
      </Card>

      {/* Points Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 divide-y">
          <StatBar
            label="Winners"
            player1Value={stats.player1.winners}
            player2Value={stats.player2.winners}
            isCount
            delay={1.0}
          />
          
          <StatBar
            label="Unforced Errors"
            player1Value={stats.player1.unforcedErrors}
            player2Value={stats.player2.unforcedErrors}
            isCount
            delay={1.1}
          />
          
          <StatBar
            label="Net Points Won"
            player1Value={Math.round(stats.player1.netPointWinPercentage)}
            player2Value={Math.round(stats.player2.netPointWinPercentage)}
            player1Detailed={`(${stats.player1.netPointsWon}/${stats.player1.netPointsPlayed})`}
            player2Detailed={`(${stats.player2.netPointsWon}/${stats.player2.netPointsPlayed})`}
            showPercentage
            delay={1.2}
          />
          
          <StatBar
            label="Total Points Won"
            player1Value={Math.round(stats.player1.pointWinPercentage)}
            player2Value={Math.round(stats.player2.pointWinPercentage)}
            player1Detailed={`(${stats.player1.totalPointsWon}/${stats.player1.totalPointsPlayed})`}
            player2Detailed={`(${stats.player2.totalPointsWon}/${stats.player2.totalPointsPlayed})`}
            showPercentage
            delay={1.3}
          />
        </CardContent>
      </Card>

      {/* Shot Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Shot Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-center">{player1Name}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Forehand Winners</span>
                  <Badge variant="secondary">{stats.player1.forehandWinners}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Backhand Winners</span>
                  <Badge variant="secondary">{stats.player1.backhandWinners}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Volley Winners</span>
                  <Badge variant="secondary">{stats.player1.volleyWinners}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Forehand Errors</span>
                  <span>{stats.player1.forehandErrors}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Backhand Errors</span>
                  <span>{stats.player1.backhandErrors}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Volley Errors</span>
                  <span>{stats.player1.volleyErrors}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-center">{player2Name}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Forehand Winners</span>
                  <Badge variant="secondary">{stats.player2.forehandWinners}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Backhand Winners</span>
                  <Badge variant="secondary">{stats.player2.backhandWinners}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Volley Winners</span>
                  <Badge variant="secondary">{stats.player2.volleyWinners}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Forehand Errors</span>
                  <span>{stats.player2.forehandErrors}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Backhand Errors</span>
                  <span>{stats.player2.backhandErrors}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Volley Errors</span>
                  <span>{stats.player2.volleyErrors}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 