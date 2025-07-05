"use client"

import { Button } from "@/components/ui/button"
import { Edit, Users, User, Trophy, Settings, BarChart3 } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { motion } from "framer-motion"
import { Player } from "@/lib/types"
import { PlayerAvatar } from "@/components/shared/player-avatar"
import { formatPlayerFromObject } from "@/lib/utils"

interface ReviewStepProps {
  matchType: "singles" | "doubles"
  players: Player[]
  playerOne: string
  playerTwo: string
  playerThree: string
  playerFour: string
  playerOneAnonymous: boolean
  playerTwoAnonymous: boolean
  playerThreeAnonymous: boolean
  playerFourAnonymous: boolean
  tournamentName: string
  sets: number[]
  scoring: "ad" | "no-ad"
  finalSet: "full" | "super-tb"
  detailLevel: "points" | "simple" | "complex"
  onEditStep: (step: number) => void
}

export function ReviewStep({
  matchType,
  players,
  playerOne,
  playerTwo,
  playerThree,
  playerFour,
  playerOneAnonymous,
  playerTwoAnonymous,
  playerThreeAnonymous,
  playerFourAnonymous,
  tournamentName,
  sets,
  scoring,
  finalSet,
  detailLevel,
  onEditStep
}: ReviewStepProps) {
  const t = useTranslations()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  }

  const getPlayerDisplay = (playerId: string, isAnonymous: boolean, fallbackName: string) => {
    if (isAnonymous) {
      return { name: t('anonymousPlayer'), isAnonymous: true }
    }
    
    if (!playerId) {
      return { name: fallbackName, isAnonymous: true }
    }

    const actualId = playerId.split(' ')[0]
    const player = players.find(p => p.$id === actualId)
    
    if (player) {
      return { 
        name: formatPlayerFromObject(player), 
        player,
        isAnonymous: false 
      }
    }
    
    return { name: fallbackName, isAnonymous: true }
  }

  const getSetsLabel = (value: number) => {
    switch (value) {
      case 1: return t("bestOf1")
      case 3: return t("bestOf3")
      case 5: return t("bestOf5")
      default: return `Best of ${value}`
    }
  }

  const getDetailLabel = (level: string) => {
    switch (level) {
      case "points": return t("pointsOnly")
      case "simple": return t("simpleStats")
      case "complex": return t("detailedStats")
      default: return level
    }
  }

  const player1 = getPlayerDisplay(playerOne, playerOneAnonymous, t('player1'))
  const player2 = getPlayerDisplay(playerTwo, playerTwoAnonymous, t('player2'))
  const player3 = getPlayerDisplay(playerThree, playerThreeAnonymous, t('player3'))
  const player4 = getPlayerDisplay(playerFour, playerFourAnonymous, t('player4'))

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="text-center">
        <h2 className="text-2xl font-bold mb-2">{t("reviewMatch")}</h2>
        <p className="text-muted-foreground">{t("confirmDetailsBeforeStart")}</p>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4">
        {/* Match Type */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            {matchType === "singles" ? <User className="h-5 w-5" /> : <Users className="h-5 w-5" />}
            <div>
              <div className="font-medium">{t("matchType")}</div>
              <div className="text-sm text-muted-foreground">
                {matchType === "singles" ? t('singles') : t('doubles')}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(1)}
            className="flex items-center gap-1"
          >
            <Edit className="h-3 w-3" />
            {t("edit")}
          </Button>
        </div>

        {/* Players */}
        <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 mt-0.5" />
            <div className="space-y-2">
              <div className="font-medium">{t("players")}</div>
              
              {matchType === "singles" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {!player1.isAnonymous && player1.player && (
                      <PlayerAvatar player={player1.player} className="h-4 w-4" />
                    )}
                    <span className="text-sm">{player1.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">vs</div>
                  <div className="flex items-center gap-2">
                    {!player2.isAnonymous && player2.player && (
                      <PlayerAvatar player={player2.player} className="h-4 w-4" />
                    )}
                    <span className="text-sm">{player2.name}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">{t("team1")}</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {!player1.isAnonymous && player1.player && (
                          <PlayerAvatar player={player1.player} className="h-4 w-4" />
                        )}
                        <span className="text-sm">{player1.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!player3.isAnonymous && player3.player && (
                          <PlayerAvatar player={player3.player} className="h-4 w-4" />
                        )}
                        <span className="text-sm">{player3.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">vs</div>
                  
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">{t("team2")}</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {!player2.isAnonymous && player2.player && (
                          <PlayerAvatar player={player2.player} className="h-4 w-4" />
                        )}
                        <span className="text-sm">{player2.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!player4.isAnonymous && player4.player && (
                          <PlayerAvatar player={player4.player} className="h-4 w-4" />
                        )}
                        <span className="text-sm">{player4.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(2)}
            className="flex items-center gap-1"
          >
            <Edit className="h-3 w-3" />
            {t("edit")}
          </Button>
        </div>

        {/* Tournament */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5" />
            <div>
              <div className="font-medium">{t("tournament")}</div>
              <div className="text-sm text-muted-foreground">
                {tournamentName || t('casualMatch')}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(3)}
            className="flex items-center gap-1"
          >
            <Edit className="h-3 w-3" />
            {t("edit")}
          </Button>
        </div>

        {/* Match Format */}
        <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-start gap-3">
            <Settings className="h-5 w-5 mt-0.5" />
            <div>
              <div className="font-medium">{t("matchFormat")}</div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>{getSetsLabel(sets[0])}</div>
                <div>{scoring === "ad" ? t("advantage") : t("noAdvantage")}</div>
                <div>{finalSet === "full" ? t("fullSet") : t("superTiebreak")}</div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(4)}
            className="flex items-center gap-1"
          >
            <Edit className="h-3 w-3" />
            {t("edit")}
          </Button>
        </div>

        {/* Detail Level */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5" />
            <div>
              <div className="font-medium">{t("detailLevel")}</div>
              <div className="text-sm text-muted-foreground">
                {getDetailLabel(detailLevel)}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(5)}
            className="flex items-center gap-1"
          >
            <Edit className="h-3 w-3" />
            {t("edit")}
          </Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-foreground font-medium mb-1">
                {t('readyToStart')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('clickStartToBeginMatch')}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}