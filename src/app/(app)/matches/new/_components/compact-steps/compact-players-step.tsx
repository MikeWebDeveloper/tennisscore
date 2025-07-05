"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { User, Plus, Star, Check } from "lucide-react"
import { Player } from "@/lib/types"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { useTranslations } from "@/hooks/use-translations"
import { PlayerAvatar } from "@/components/shared/player-avatar"
import { formatPlayerFromObject } from "@/lib/utils"
import { useUserStore } from "@/stores/userStore"
import { CreatePlayerDialog } from "../../../../players/_components/create-player-dialog"
import { motion } from "framer-motion"

interface CompactPlayersStepProps {
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
  onPlayerChange: (player: "one" | "two" | "three" | "four", value: string) => void
  onAnonymousChange: (player: "one" | "two" | "three" | "four", checked: boolean) => void
  onComplete: () => void
}

function normalizeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
}

export function CompactPlayersStep({
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
  onPlayerChange,
  onAnonymousChange,
  onComplete
}: CompactPlayersStepProps) {
  const t = useTranslations()
  const { mainPlayerId } = useUserStore()
  const [showCreatePlayerDialog, setShowCreatePlayerDialog] = useState(false)

  // Check if form is complete and auto-advance
  useEffect(() => {
    const isComplete = matchType === "singles" 
      ? (playerOneAnonymous || playerOne) && (playerTwoAnonymous || playerTwo)
      : (playerOneAnonymous || playerOne) && (playerTwoAnonymous || playerTwo) && 
        (playerThreeAnonymous || playerThree) && (playerFourAnonymous || playerFour)
    
    if (isComplete) {
      onComplete()
    }
  }, [matchType, playerOne, playerTwo, playerThree, playerFour, 
      playerOneAnonymous, playerTwoAnonymous, playerThreeAnonymous, playerFourAnonymous, onComplete])

  const createPlayerOptions = (excludeIds: string[] = []): ComboboxOption[] => {
    const options: ComboboxOption[] = []

    options.push({
      value: "create-new",
      label: t('createNewPlayer'),
      group: t('actions'),
      icon: <Plus className="h-4 w-4 text-primary" />,
    })

    if (players.length > 0) {
      const availablePlayers = players.filter(player => !excludeIds.includes(player.$id))
      
      const mainPlayer = availablePlayers.find(player => 
        player.$id === mainPlayerId || player.isMainPlayer === true
      )
      const otherPlayers = availablePlayers.filter(player => 
        player.$id !== mainPlayer?.$id
      )
      
      const sortedOtherPlayers = otherPlayers.sort((a, b) => {
        const nameA = formatPlayerFromObject(a).toLowerCase()
        const nameB = formatPlayerFromObject(b).toLowerCase()
        return nameA.localeCompare(nameB)
      })
      
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

  const handlePlayerChange = (player: "one" | "two" | "three" | "four", value: string) => {
    if (value === "create-new") {
      setShowCreatePlayerDialog(true)
    } else {
      onPlayerChange(player, value)
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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 p-4 rounded-xl border bg-card"
    >
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
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
      
      {!isAnonymous ? (
        <Combobox
          options={createPlayerOptions(excludeIds)}
          value={value}
          onValueChange={onChange}
          placeholder={t('searchOrSelectPlayer')}
          emptyText={t('noPlayersFound')}
        />
      ) : (
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t('anonymousPlayer')} - {t('noTracking')}
          </span>
          <Check className="h-4 w-4 text-green-500 ml-auto" />
        </div>
      )}
    </motion.div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">{t("players")}</h2>
        <p className="text-sm text-muted-foreground">
          {matchType === "singles" ? t("selectTwoPlayers") : t("selectFourPlayers")}
        </p>
      </div>

      <div className="space-y-3">
        {matchType === "singles" ? (
          <>
            {renderPlayerSelect(
              playerOne, 
              (value) => handlePlayerChange("one", value), 
              t('player1'),
              playerOneAnonymous,
              (checked) => onAnonymousChange("one", checked),
              [playerTwo, playerThree, playerFour].filter(Boolean)
            )}
            
            {renderPlayerSelect(
              playerTwo, 
              (value) => handlePlayerChange("two", value), 
              t('player2'),
              playerTwoAnonymous,
              (checked) => onAnonymousChange("two", checked),
              [playerOne, playerThree, playerFour].filter(Boolean)
            )}
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="text-sm font-medium text-primary mb-2">{t("team1")}</div>
            </div>
            
            {renderPlayerSelect(
              playerOne, 
              (value) => handlePlayerChange("one", value), 
              t('player1'),
              playerOneAnonymous,
              (checked) => onAnonymousChange("one", checked),
              [playerTwo, playerThree, playerFour].filter(Boolean)
            )}
            
            {renderPlayerSelect(
              playerThree, 
              (value) => handlePlayerChange("three", value), 
              t('player3'),
              playerThreeAnonymous,
              (checked) => onAnonymousChange("three", checked),
              [playerOne, playerTwo, playerFour].filter(Boolean)
            )}

            <div className="text-center">
              <div className="text-sm font-medium text-destructive mb-2">{t("team2")}</div>
            </div>
            
            {renderPlayerSelect(
              playerTwo, 
              (value) => handlePlayerChange("two", value), 
              t('player2'),
              playerTwoAnonymous,
              (checked) => onAnonymousChange("two", checked),
              [playerOne, playerThree, playerFour].filter(Boolean)
            )}
            
            {renderPlayerSelect(
              playerFour, 
              (value) => handlePlayerChange("four", value), 
              t('player4'),
              playerFourAnonymous,
              (checked) => onAnonymousChange("four", checked),
              [playerOne, playerTwo, playerThree].filter(Boolean)
            )}
          </>
        )}
      </div>

      <CreatePlayerDialog 
        isOpen={showCreatePlayerDialog}
        onOpenChange={setShowCreatePlayerDialog}
      />
    </motion.div>
  )
}