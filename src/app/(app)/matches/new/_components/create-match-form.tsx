"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, User, Plus } from "lucide-react"
import Link from "next/link"
import { Player } from "@/lib/types"
import { createMatch } from "@/lib/actions/matches"
import { toast } from "sonner"
import { createMatchSchema, type CreateMatchData } from "@/lib/schemas/match"
import { ZodError } from "zod"
import { CreatePlayerDialog } from "../../../players/_components/create-player-dialog"
// Mobile spacer component to prevent content from being hidden behind bottom nav
const MobileBottomNavSpacer = () => <div className="h-16 md:hidden" />
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { useTranslations } from "@/hooks/use-translations"
import { PlayerAvatar } from "@/components/shared/player-avatar"

interface CreateMatchFormProps {
  players: Player[]
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
}

export function CreateMatchForm({ players }: CreateMatchFormProps) {
  const router = useRouter()
  const t = useTranslations()
  const [loading, setLoading] = useState(false)
  
  const ANONYMOUS_PLAYERS = [
    { $id: "anonymous-1", firstName: t('player1'), lastName: `(${t('noTracking')})`, displayName: `${t('player1')} (${t('noTracking')})` },
    { $id: "anonymous-2", firstName: t('player2'), lastName: `(${t('noTracking')})`, displayName: `${t('player2')} (${t('noTracking')})` },
    { $id: "anonymous-3", firstName: t('player3'), lastName: `(${t('noTracking')})`, displayName: `${t('player3')} (${t('noTracking')})` },
    { $id: "anonymous-4", firstName: t('player4'), lastName: `(${t('noTracking')})`, displayName: `${t('player4')} (${t('noTracking')})` },
  ]
  
  // Form state with default anonymous players
  const [matchType, setMatchType] = useState<"singles" | "doubles">("singles")
  const [playerOne, setPlayerOne] = useState("anonymous-1") // Default to Player 1
  const [playerTwo, setPlayerTwo] = useState("anonymous-2") // Default to Player 2
  const [playerThree, setPlayerThree] = useState("")
  const [playerFour, setPlayerFour] = useState("")
  const [sets, setSets] = useState([3]) // Best of 3 by default
  const [scoring, setScoring] = useState<"ad" | "no-ad">("ad")
  const [finalSet, setFinalSet] = useState<"full" | "super-tb">("full")
  const [detailLevel, setDetailLevel] = useState<"points" | "simple" | "complex">("simple")
  const [showCreatePlayerDialog, setShowCreatePlayerDialog] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare data for validation
      const formData: CreateMatchData = {
        playerOneId: playerOne,
        playerTwoId: playerTwo,
        playerThreeId: matchType === "doubles" ? playerThree : undefined,
        playerFourId: matchType === "doubles" ? playerFour : undefined,
        matchFormat: {
          sets: sets[0] as 1 | 3 | 5,
          gamesPerSet: 6,
          tiebreakAt: 6,
          noAd: scoring === "no-ad",
          finalSetTiebreak: finalSet === "super-tb" ? "super" : "standard",
          detailLevel,
        },
      }

      // Validate with Zod
      const validatedData = createMatchSchema.parse(formData)

      const result = await createMatch({
        playerOneId: validatedData.playerOneId,
        playerTwoId: validatedData.playerTwoId,
        playerThreeId: validatedData.playerThreeId,
        playerFourId: validatedData.playerFourId,
        matchFormat: validatedData.matchFormat,
      })

      if (result.error) {
        toast.error(result.error)
      } else if (result.matchId) {
        toast.success(t('matchCreatedSuccessfully'))
        router.push(`/matches/live/${result.matchId}`)
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0]
        toast.error(firstError.message)
      } else {
        toast.error(t('failedToCreateMatch'))
      }
    } finally {
      setLoading(false)
    }
  }

  const getSetsLabel = (value: number) => {
    switch (value) {
      case 1: return t("bestOf1")
      case 3: return t("bestOf3")
      case 5: return t("bestOf5")
      default: return `Best of ${value}`
    }
  }

  // Create options for the combobox
  const createPlayerOptions = (excludeIds: string[] = []): ComboboxOption[] => {
    const options: ComboboxOption[] = []

    // Add anonymous players
    ANONYMOUS_PLAYERS.forEach((player) => {
      if (!excludeIds.includes(player.$id)) {
        options.push({
          value: player.$id,
          label: player.displayName,
          group: t('quickMatch'),
          icon: <User className="h-4 w-4 text-muted-foreground" />,
        })
      }
    })

    // Add create new player option
    options.push({
      value: "create-new",
      label: t('createNewPlayer'),
      group: t('actions'),
      icon: <Plus className="h-4 w-4 text-primary" />,
    })

    // Add real players if they exist
    if (players.length > 0) {
      players.forEach(player => {
        if (!excludeIds.includes(player.$id)) {
          options.push({
            value: player.$id,
            label: `${player.firstName} ${player.lastName}`,
            group: t('trackedPlayers'),
            icon: <PlayerAvatar player={player} className="h-5 w-5" />,
          })
        }
      })
    }

    return options
  }

  const handlePlayerChange = (value: string, setter: (value: string) => void) => {
    if (value === "create-new") {
      setShowCreatePlayerDialog(true)
    } else {
      setter(value)
    }
  }

  const renderPlayerSelect = (
    value: string,
    onChange: (value: string) => void,
    label: string,
    excludeIds: string[] = []
  ) => (
    <div className="space-y-2">
      <Label htmlFor={label.toLowerCase().replace(" ", "-")}>{label}</Label>
      <Combobox
        options={createPlayerOptions(excludeIds)}
        value={value}
        onValueChange={(val) => handlePlayerChange(val, onChange)}
        placeholder={t('searchOrSelectPlayer')}
        emptyText={t('noPlayersFound')}
      />
    </div>
  )

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4 mb-6">
        <Link href="/matches">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
                  <div>
            <h1 className="text-2xl font-bold">{t("newMatch")}</h1>
            <p className="text-muted-foreground">{t("setUpMatch")}</p>
          </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Match Type */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
                              <h3 className="font-medium mb-4">{t("matchType")}</h3>
              <RadioGroup value={matchType} onValueChange={(value: "singles" | "doubles") => setMatchType(value)}>
                <div className="grid grid-cols-2 gap-3">
                  <Label htmlFor="singles" className="radio-option">
                    <RadioGroupItem value="singles" id="singles" />
                    <span className="font-medium">{t('singles')}</span>
                  </Label>
                  <Label htmlFor="doubles" className="radio-option">
                    <RadioGroupItem value="doubles" id="doubles" />
                    <span className="font-medium">{t('doubles')}</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>

        {/* Players */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
                              <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-medium">{t("players")}</h3>
                  <div className="text-sm text-muted-foreground">
                    {t("searchByTyping")}
                  </div>
                </div>
              
              {matchType === "singles" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderPlayerSelect(
                    playerOne, 
                    setPlayerOne, 
                    t('player1'), 
                    [playerTwo, playerThree, playerFour].filter(Boolean)
                  )}
                  
                  {renderPlayerSelect(
                    playerTwo, 
                    setPlayerTwo, 
                    t('player2'), 
                    [playerOne, playerThree, playerFour].filter(Boolean)
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Team 1 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-border" />
                                              <span className="text-sm font-medium text-muted-foreground px-2">{t("team1")}</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border-2 border-primary/20">
                      {renderPlayerSelect(
                        playerOne, 
                        setPlayerOne, 
                        t('player1'), 
                        [playerTwo, playerThree, playerFour].filter(Boolean)
                      )}
                      
                      {renderPlayerSelect(
                        playerThree, 
                        setPlayerThree, 
                        t('player3'), 
                        [playerOne, playerTwo, playerFour].filter(Boolean)
                      )}
                    </div>
                  </div>

                  {/* Team 2 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-sm font-medium text-muted-foreground px-2">{t("team2")}</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border-2 border-destructive/20">
                      {renderPlayerSelect(
                        playerTwo, 
                        setPlayerTwo, 
                        t('player2'), 
                        [playerOne, playerThree, playerFour].filter(Boolean)
                      )}
                      
                      {renderPlayerSelect(
                        playerFour, 
                        setPlayerFour, 
                        t('player4'), 
                        [playerOne, playerTwo, playerThree].filter(Boolean)
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Match Format */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium mb-4">{t("matchFormat")}</h3>
              
              {/* Sets */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>{t("numberOfSets")}: {getSetsLabel(sets[0])}</Label>
                  <Slider
                    value={sets}
                    onValueChange={setSets}
                    min={1}
                    max={5}
                    step={2}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('bestOf1')}</span>
                    <span>{t('bestOf3')}</span>
                    <span>{t('bestOf5')}</span>
                  </div>
                </div>

                {/* Scoring */}
                <div className="space-y-3">
                  <Label>{t("scoringSystem")}</Label>
                  <RadioGroup value={scoring} onValueChange={(value: "ad" | "no-ad") => setScoring(value)}>
                    <div className="grid grid-cols-2 gap-3">
                      <Label htmlFor="ad" className="radio-option">
                        <RadioGroupItem value="ad" id="ad" />
                        <span className="font-medium">{t("advantage")}</span>
                      </Label>
                      <Label htmlFor="no-ad" className="radio-option">
                        <RadioGroupItem value="no-ad" id="no-ad" />
                        <span className="font-medium">{t("noAdvantage")}</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Final Set */}
                <div className="space-y-3">
                  <Label>{t("finalSet")}</Label>
                  <RadioGroup value={finalSet} onValueChange={(value: "full" | "super-tb") => setFinalSet(value)}>
                    <div className="grid grid-cols-2 gap-3">
                      <Label htmlFor="full" className="radio-option">
                        <RadioGroupItem value="full" id="full" />
                        <span className="font-medium">{t("fullSet")}</span>
                      </Label>
                      <Label htmlFor="super-tb" className="radio-option">
                        <RadioGroupItem value="super-tb" id="super-tb" />
                        <span className="font-medium">{t("superTiebreak")}</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detail Level */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium mb-4">{t("scoringDetailLevel")}</h3>
              <RadioGroup value={detailLevel} onValueChange={(value: "points" | "simple" | "complex") => setDetailLevel(value)}>
                <div className="space-y-3">
                  <Label htmlFor="points" className="radio-option">
                    <RadioGroupItem value="points" id="points" />
                    <div>
                      <div className="font-medium">{t("pointsOnly")}</div>
                      <div className="text-sm text-muted-foreground">{t("trackJustScore")}</div>
                    </div>
                  </Label>
                  <Label htmlFor="simple" className="radio-option">
                    <RadioGroupItem value="simple" id="simple" />
                    <div>
                      <div className="font-medium">{t("simpleStats")}</div>
                      <div className="text-sm text-muted-foreground">{t("acesDoubleFaultsWinnersErrors")}</div>
                    </div>
                  </Label>
                  <Label htmlFor="complex" className="radio-option-disabled">
                    <RadioGroupItem value="complex" id="complex" disabled />
                    <div>
                      <div className="font-medium">{t("detailedStats")}</div>
                      <div className="text-sm text-muted-foreground">{t("shotPlacementRallyLength")}</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>

        {/* Submit Button */}
        <motion.div variants={itemVariants} className="pb-24 md:pb-6">
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium"
            disabled={loading || !playerOne || !playerTwo || (matchType === "doubles" && (!playerThree || !playerFour))}
          >
            {loading ? t("creatingMatch") : t("startMatch")}
          </Button>
        </motion.div>
      </form>

      {/* Create Player Dialog */}
      <CreatePlayerDialog 
        isOpen={showCreatePlayerDialog}
        onOpenChange={setShowCreatePlayerDialog}
      />
      <MobileBottomNavSpacer />
    </motion.div>
  )
} 