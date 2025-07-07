"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, User, Plus, Star, BarChart3 } from "lucide-react"
import Link from "next/link"
import { Player } from "@/lib/types"
import { createMatch } from "@/lib/actions/matches"
import { toast } from "sonner"
import { createMatchSchema, type CreateMatchData } from "@/lib/schemas/match"
import { ZodError } from "zod"
import { CreatePlayerDialog } from "../../../players/_components/create-player-dialog"
import { CustomModeDialog } from "@/components/features/custom-mode-dialog"
// Mobile spacer component to prevent content from being hidden behind bottom nav
const MobileBottomNavSpacer = () => <div className="h-16 md:hidden" />
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { useTranslations } from "@/hooks/use-translations"
import { PlayerAvatar } from "@/components/shared/player-avatar"
import { formatPlayerFromObject } from "@/lib/utils"
import { useUserStore } from "@/stores/userStore"

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

// Utility to remove diacritics for search
function normalizeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function CreateMatchForm({ players }: CreateMatchFormProps) {
  const router = useRouter()
  const t = useTranslations()
  const { mainPlayerId } = useUserStore()
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [matchType, setMatchType] = useState<"singles" | "doubles">("singles")
  const [playerOne, setPlayerOne] = useState("")
  const [playerTwo, setPlayerTwo] = useState("")
  const [playerThree, setPlayerThree] = useState("")
  const [playerFour, setPlayerFour] = useState("")
  const [tournamentName, setTournamentName] = useState("")
  
  // Anonymous player tracking
  const [playerOneAnonymous, setPlayerOneAnonymous] = useState(false)
  const [playerTwoAnonymous, setPlayerTwoAnonymous] = useState(false)
  const [playerThreeAnonymous, setPlayerThreeAnonymous] = useState(false)
  const [playerFourAnonymous, setPlayerFourAnonymous] = useState(false)
  
  const [sets, setSets] = useState([3]) // Best of 3 by default
  const [scoring, setScoring] = useState<"ad" | "no-ad">("ad")
  const [finalSet, setFinalSet] = useState<"full" | "super-tb">("full")
  const [detailLevel, setDetailLevel] = useState<"points" | "simple" | "complex">("simple")
  const [showCreatePlayerDialog, setShowCreatePlayerDialog] = useState(false)
  const [showCustomModeDialog, setShowCustomModeDialog] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Generate anonymous player IDs if needed
      const getPlayerIdOrAnonymous = (playerId: string, isAnonymous: boolean, defaultName: string) => {
        if (isAnonymous || !playerId) {
          return `anonymous-${defaultName.toLowerCase().replace(' ', '-')}`
        }
        return playerId
      }

      // Prepare data for validation
      const formData: CreateMatchData = {
        playerOneId: getPlayerIdOrAnonymous(playerOne, playerOneAnonymous, t('player1')),
        playerTwoId: getPlayerIdOrAnonymous(playerTwo, playerTwoAnonymous, t('player2')),
        playerThreeId: matchType === "doubles" ? getPlayerIdOrAnonymous(playerThree, playerThreeAnonymous, t('player3')) : undefined,
        playerFourId: matchType === "doubles" ? getPlayerIdOrAnonymous(playerFour, playerFourAnonymous, t('player4')) : undefined,
        tournamentName: tournamentName.trim() || undefined,
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
        tournamentName: validatedData.tournamentName,
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

    // Add create new player option
    options.push({
      value: "create-new",
      label: t('createNewPlayer'),
      group: t('actions'),
      icon: <Plus className="h-4 w-4 text-primary" />,
    })

    // Add real players if they exist
    if (players.length > 0) {
      // Filter out excluded players
      const availablePlayers = players.filter(player => !excludeIds.includes(player.$id))
      
      // Find main player - check both store mainPlayerId and isMainPlayer flag
      const mainPlayer = availablePlayers.find(player => 
        player.$id === mainPlayerId || player.isMainPlayer === true
      )
      const otherPlayers = availablePlayers.filter(player => 
        player.$id !== mainPlayer?.$id
      )
      
      // Sort other players alphabetically by full name
      const sortedOtherPlayers = otherPlayers.sort((a, b) => {
        const nameA = formatPlayerFromObject(a).toLowerCase()
        const nameB = formatPlayerFromObject(b).toLowerCase()
        return nameA.localeCompare(nameB)
      })
      
      // Add main player first with special styling (if exists and not excluded)
      if (mainPlayer) {
        const label = formatPlayerFromObject(mainPlayer)
        const normalized = normalizeDiacritics(label)
        options.push({
          value: `${mainPlayer.$id} ${normalized}`,
          label: label,
          group: t('mainPlayer'),
          icon: (
            <div className="flex items-center gap-1.5">
              <PlayerAvatar player={mainPlayer} className="h-5 w-5" />
              <Star className="h-3 w-3 text-amber-500" fill="currentColor" />
            </div>
          ),
        })
      }
      
      // Add other players alphabetically
      if (sortedOtherPlayers.length > 0) {
        sortedOtherPlayers.forEach(player => {
          const label = formatPlayerFromObject(player)
          const normalized = normalizeDiacritics(label)
          options.push({
            value: `${player.$id} ${normalized}`,
            label: label,
            group: t('trackedPlayers'),
            icon: <PlayerAvatar player={player} className="h-5 w-5" />,
          })
        })
      }
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

  const handleDetailLevelChange = (value: "points" | "simple" | "complex") => {
    setDetailLevel(value)
    // Show Custom Mode dialog when complex is selected
    if (value === "complex") {
      setShowCustomModeDialog(true)
    }
  }

  const renderPlayerSelect = (
    value: string,
    onChange: (value: string) => void,
    label: string,
    isAnonymous: boolean,
    onAnonymousChange: (checked: boolean) => void,
    excludeIds: string[] = []
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor={label.toLowerCase().replace(" ", "-")}>{label}</Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${label.toLowerCase().replace(" ", "-")}-anonymous`}
            checked={isAnonymous}
            onCheckedChange={onAnonymousChange}
            className="h-3 w-3"
          />
          <Label 
            htmlFor={`${label.toLowerCase().replace(" ", "-")}-anonymous`}
            className="text-xs text-muted-foreground cursor-pointer"
          >
            {t('dontTrackStats')}
          </Label>
        </div>
      </div>
      
      {!isAnonymous && (
        <Combobox
          options={createPlayerOptions(excludeIds)}
          value={value}
          onValueChange={(val) => handlePlayerChange(val, onChange)}
          placeholder={t('searchOrSelectPlayer')}
          emptyText={t('noPlayersFound')}
        />
      )}
      
      {isAnonymous && (
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t('anonymousPlayer')} - {t('noTracking')}
          </span>
        </div>
      )}
    </div>
  )

  // Check if form is valid
  const isFormValid = () => {
    const hasPlayerOne = playerOneAnonymous || playerOne
    const hasPlayerTwo = playerTwoAnonymous || playerTwo
    
    if (matchType === "singles") {
      return hasPlayerOne && hasPlayerTwo
    } else {
      const hasPlayerThree = playerThreeAnonymous || playerThree
      const hasPlayerFour = playerFourAnonymous || playerFour
      return hasPlayerOne && hasPlayerTwo && hasPlayerThree && hasPlayerFour
    }
  }

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
                    playerOneAnonymous,
                    setPlayerOneAnonymous,
                    [playerTwo, playerThree, playerFour].filter(Boolean)
                  )}
                  
                  {renderPlayerSelect(
                    playerTwo, 
                    setPlayerTwo, 
                    t('player2'),
                    playerTwoAnonymous,
                    setPlayerTwoAnonymous,
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
                        playerOneAnonymous,
                        setPlayerOneAnonymous,
                        [playerTwo, playerThree, playerFour].filter(Boolean)
                      )}
                      
                      {renderPlayerSelect(
                        playerThree, 
                        setPlayerThree, 
                        t('player3'),
                        playerThreeAnonymous,
                        setPlayerThreeAnonymous,
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
                        playerTwoAnonymous,
                        setPlayerTwoAnonymous,
                        [playerOne, playerThree, playerFour].filter(Boolean)
                      )}
                      
                      {renderPlayerSelect(
                        playerFour, 
                        setPlayerFour, 
                        t('player4'),
                        playerFourAnonymous,
                        setPlayerFourAnonymous,
                        [playerOne, playerTwo, playerThree].filter(Boolean)
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tournament/League */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Label htmlFor="tournament-name">{t('tournamentLeague')}</Label>
                <input
                  id="tournament-name"
                  type="text"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  placeholder={t('enterTournamentName')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground">{t('tournamentOptional')}</p>
              </div>
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
              <RadioGroup value={detailLevel} onValueChange={handleDetailLevelChange}>
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
                  <Label htmlFor="complex" className="radio-option">
                    <RadioGroupItem value="complex" id="complex" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{t("detailedStats")}</div>
                        <Badge variant="secondary" className="text-xs">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Advanced
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{t("shotPlacementRallyLength")}</div>
                      {detailLevel === "complex" && (
                        <Button
                          type="button"
                          variant="outline" 
                          size="sm"
                          className="mt-2"
                          onClick={() => setShowCustomModeDialog(true)}
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Configure Advanced Stats
                        </Button>
                      )}
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
            disabled={loading || !isFormValid()}
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

      {/* Custom Mode Dialog */}
      <CustomModeDialog
        open={showCustomModeDialog}
        onOpenChange={setShowCustomModeDialog}
      />
      
      <MobileBottomNavSpacer />
    </motion.div>
  )
} 