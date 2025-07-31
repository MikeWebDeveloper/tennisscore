"use client"

import { useState } from "react"
import { motion } from '@/lib/framer-motion-config'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Player, MatchStats } from "@/lib/types"
import { Target } from "lucide-react"
import { Zap } from "lucide-react"
import { Shield } from "lucide-react"
import { TrendingUp } from "lucide-react"
import { Activity } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from "@/i18n"
import { formatPlayerFromObject } from "@/lib/utils"

interface EnhancedMatchStatsProps {
  stats: MatchStats
  playerOne: Player
  playerTwo: Player
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

// Enhanced stat row component
function StatRow({ 
  label, 
  value1, 
  value2, 
  format = "number",
  showProgress = true,
  description
}: { 
  label: string
  value1: number
  value2: number
  format?: "number" | "percentage"
  showProgress?: boolean
  description?: string
}) {
  const total = value1 + value2
  const percentage1 = total > 0 ? (value1 / total) * 100 : 50
  const percentage2 = total > 0 ? (value2 / total) * 100 : 50

  const formatValue = (value: number) => {
    if (format === "percentage") {
      return `${value.toFixed(0)}%`
    }
    return value.toString()
  }

  return (
    <motion.div 
      variants={itemVariants}
      className="space-y-2"
      layout
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <motion.span 
            className="font-mono font-semibold text-blue-600"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.3 }}
          >
            {formatValue(value1)}
          </motion.span>
          <div className="text-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {label}
            </span>
            {description && (
              <div className="text-xs text-muted-foreground/70 mt-1">
                {description}
              </div>
            )}
          </div>
          <motion.span 
            className="font-mono font-semibold text-red-600"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.3 }}
          >
            {formatValue(value2)}
          </motion.span>
        </div>
        {showProgress && (
          <div className="flex gap-1 h-2">
            <motion.div
              className="bg-blue-500 rounded-l"
              initial={{ width: 0 }}
              animate={{ width: `${percentage1}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            <motion.div
              className="bg-red-500 rounded-r"
              initial={{ width: 0 }}
              animate={{ width: `${percentage2}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function EnhancedMatchStats({ stats, playerOne, playerTwo }: EnhancedMatchStatsProps) {
  const t = useTranslations('common')
  
  return (
    <div className="w-full">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="serving">{t('serving')}</TabsTrigger>
          <TabsTrigger value="receiving">{t('receiving')}</TabsTrigger>
          <TabsTrigger value="pressure">{t('pressure')}</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {/* Points Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {t('pointsAndOutcomes')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatRow 
                  label={t('totalPointsWon')} 
                  value1={stats.player1.totalPointsWon} 
                  value2={stats.player2.totalPointsWon} 
                  description={t('totalPointsDescription')}
                />
                <StatRow 
                  label={t('winners')} 
                  value1={stats.player1.winners} 
                  value2={stats.player2.winners}
                  description={t('winnersDescription')}
                />
                <StatRow 
                  label={t('unforcedErrors')} 
                  value1={stats.player1.unforcedErrors} 
                  value2={stats.player2.unforcedErrors} 
                  description={t('unforcedErrorsDescription')}
                />
                <StatRow 
                  label={t('forcedErrors')} 
                  value1={stats.player1.forcedErrors} 
                  value2={stats.player2.forcedErrors} 
                  description={t('forcedErrorsDescription')}
                />
              </CardContent>
            </Card>

            {/* Basic Service Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  {t('serviceOverview')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatRow 
                  label={t('aces')} 
                  value1={stats.player1.aces} 
                  value2={stats.player2.aces}
                  description={t('acesDescription')}
                />
                <StatRow 
                  label={t('doubleFaults')} 
                  value1={stats.player1.doubleFaults} 
                  value2={stats.player2.doubleFaults} 
                  description={t('doubleFaultsDescription')}
                />
              </CardContent>  
            </Card>
          </motion.div>
        </TabsContent>
        
        {/* Serving Tab */}
        <TabsContent value="serving" className="space-y-4 mt-4">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {/* Comprehensive Service Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  {t('serviceStatistics')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatRow 
                  label={t('firstServePercentage')} 
                  value1={0} 
                  value2={0}
                  format="percentage"
                  description={t('firstServeDescription')}
                />
                <StatRow 
                  label={t('firstServePointsWonPercentage')} 
                  value1={0} 
                  value2={0}
                  format="percentage"
                  description={t('firstServeWinDescription')}
                />
                <StatRow 
                  label={t('secondServePointsWonPercentage')} 
                  value1={Math.round(
                    stats.player1.secondServesMade > 0 
                      ? (stats.player1.secondServePointsWon / stats.player1.secondServesMade) * 100 
                      : 0
                  )} 
                  value2={Math.round(
                    stats.player2.secondServesMade > 0 
                      ? (stats.player2.secondServePointsWon / stats.player2.secondServesMade) * 100 
                      : 0
                  )}
                  format="percentage"
                  description={t('secondServeWinDescription')}
                />
                <StatRow 
                  label={t('servicePointsWon')} 
                  value1={stats.player1.servicePointsWon} 
                  value2={stats.player2.servicePointsWon}
                  description={t('servicePointsDescription')}
                />
              </CardContent>
            </Card>

            {/* Service Games */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {t('serviceGames')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatRow 
                  label={t('serviceGamesHeld')} 
                  value1={0} 
                  value2={0}
                  format="percentage"
                  description={t('serviceHoldDescription')}
                />
                <StatRow 
                  label={t('gamesLostOnServe')} 
                  value1={0} 
                  value2={0}
                  description={t('serviceLossDescription')}
                />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        {/* Receiving Tab */}
        <TabsContent value="receiving" className="space-y-4 mt-4">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {/* Return Statistics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  {t('returnStatistics')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatRow 
                  label={t('receivingPointsWon')} 
                  value1={stats.player1.receivingPointsWon} 
                  value2={stats.player2.receivingPointsWon}
                  description={t('returnPointsDescription')}
                />
                <StatRow 
                  label={t('receivingPointsWonPercentage')} 
                  value1={Math.round(
                    stats.player1.receivingPointsPlayed > 0 
                      ? (stats.player1.receivingPointsWon / stats.player1.receivingPointsPlayed) * 100 
                      : 0
                  )} 
                  value2={Math.round(
                    stats.player2.receivingPointsPlayed > 0 
                      ? (stats.player2.receivingPointsWon / stats.player2.receivingPointsPlayed) * 100 
                      : 0
                  )}
                  format="percentage"
                  description={t('returnWinDescription')}
                />
                <StatRow 
                  label={t('firstServeReturnWins')} 
                  value1={stats.player1.firstServeReturnPointsWon || 0} 
                  value2={stats.player2.firstServeReturnPointsWon || 0}
                  description={t('firstReturnDescription')}
                />
                <StatRow 
                  label={t('secondServeReturnWins')} 
                  value1={stats.player1.secondServeReturnPointsWon || 0} 
                  value2={stats.player2.secondServeReturnPointsWon || 0}
                  description={t('secondReturnDescription')}
                />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        {/* Pressure Points Tab */}
        <TabsContent value="pressure" className="space-y-4 mt-4">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {/* Break Points Analysis */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t('breakPointAnalysis')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatRow 
                  label={t('breakPointsCreated')} 
                  value1={stats.player1.breakPointsCreated || 0} 
                  value2={stats.player2.breakPointsCreated || 0}
                  description={t('breakPointsCreatedDescription')}
                />
                <StatRow 
                  label={t('breakPointsConverted')} 
                  value1={stats.player1.breakPointsWon} 
                  value2={stats.player2.breakPointsWon}
                  description={t('breakPointsConvertedDescription')}
                />
                <StatRow 
                  label={t('conversionRatePercent')} 
                  value1={Math.round(
                    (stats.player1.breakPointsCreated || 0) > 0 
                      ? (stats.player1.breakPointsWon / (stats.player1.breakPointsCreated || 1)) * 100 
                      : 0
                  )} 
                  value2={Math.round(
                    (stats.player2.breakPointsCreated || 0) > 0 
                      ? (stats.player2.breakPointsWon / (stats.player2.breakPointsCreated || 1)) * 100 
                      : 0
                  )}
                  format="percentage"
                  description={t('conversionDescription')}
                />
                <StatRow 
                  label={t('breakPointsSaved')} 
                  value1={Math.round(
                    stats.player1.breakPointsFaced > 0 
                      ? ((stats.player1.breakPointsFaced - stats.player2.breakPointsWon) / stats.player1.breakPointsFaced) * 100 
                      : 0
                  )} 
                  value2={Math.round(
                    stats.player2.breakPointsFaced > 0 
                      ? ((stats.player2.breakPointsFaced - stats.player1.breakPointsWon) / stats.player2.breakPointsFaced) * 100 
                      : 0
                  )}
                  format="percentage"
                  description={t('breakSaveDescription')}
                />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
      
      {/* Player Names Footer */}
      <div className="flex justify-between text-sm text-muted-foreground px-2 mt-4">
        <span className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          {formatPlayerFromObject(playerOne)}
        </span>
        <span className="flex items-center gap-2">
          {formatPlayerFromObject(playerTwo)}
          <div className="w-3 h-3 bg-red-500 rounded" />
        </span>
      </div>
    </div>
  )
}