"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useTranslations } from "@/i18n"
import { ACE_PLACEMENTS, type ServePlacement } from "@/lib/utils/serve-placement"

interface SimpleStatsPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (outcome: SimplePointOutcome, extra?: { servePlacement: ServePlacement }) => void
  pointContext: {
    pointNumber: number
    setNumber: number
    gameNumber: number
    gameScore: string
    winner: 'p1' | 'p2'
    server: 'p1' | 'p2'
    serveType: 'first' | 'second'
    playerNames: { p1: string; p2: string }
  }
}

export type SimplePointOutcome = 
  | 'winner'
  | 'ace' 
  | 'forced_error'
  | 'unforced_error'
  | 'double_fault'

export function SimpleStatsPopup({ 
  open, 
  onOpenChange, 
  onSave, 
  pointContext 
}: SimpleStatsPopupProps) {
  const { winner, server, serveType, playerNames } = pointContext
  const t = useTranslations('common')
  
  // Conditional logic for disabled buttons
  const isAceDisabled = winner !== server
  const isDoubleFaultDisabled = serveType === 'first' || winner === server

  // An ace asks where it landed (net cord, out of the court, on the T); every other outcome saves in one tap
  const [askAcePlacement, setAskAcePlacement] = useState(false)

  const close = () => {
    setAskAcePlacement(false)
    onOpenChange(false)
  }

  const handleOutcomeClick = (outcome: SimplePointOutcome) => {
    if (outcome === 'ace') {
      setAskAcePlacement(true)
      return
    }
    onSave(outcome, undefined)
    close()
  }

  const handleAcePlacementClick = (servePlacement: ServePlacement) => {
    onSave('ace', { servePlacement })
    close()
  }

  const outcomes = [
    {
      id: 'winner' as const,
      label: t('pointWinner'),
      description: t('cleanWinner'),
      disabled: false,
      color: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
    },
    {
      id: 'ace' as const,
      label: t('ace'),
      description: t('unreturnableServe'),
      disabled: isAceDisabled,
      color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20'
    },
    {
      id: 'forced_error' as const,
      label: t('forcedError'),
      description: t('opponentForcedIntoError'),
      disabled: false,
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20'
    },
    {
      id: 'unforced_error' as const,
      label: t('unforcedError'),
      description: t('unforcedMistake'),
      disabled: false,
      color: 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20'
    },
    {
      id: 'double_fault' as const,
      label: t('doubleFault'),
      description: t('twoConsecutiveFaults'),
      disabled: isDoubleFaultDisabled,
      color: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
    }
  ]

  const winnerName = winner === 'p1' ? playerNames.p1 : playerNames.p2
  const serverName = server === 'p1' ? playerNames.p1 : playerNames.p2

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="gap-3 sm:max-w-md">
        <DialogHeader className="gap-0.5">
          <DialogTitle className="text-center text-base">
            {t('pointTitle', { number: pointContext.pointNumber })}
          </DialogTitle>
          <div className="text-center text-xs text-muted-foreground space-y-1.5">
            <p>{t('pointContextLine', { set: pointContext.setNumber, game: pointContext.gameNumber, score: pointContext.gameScore.replace(/\s*-\s*/g, ':') })}</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              <Badge variant="outline" className="text-xs">
                {t('pointWonBy', { name: winnerName })}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {t('servingWith', { name: serverName, serve: t(serveType === 'first' ? 'firstServeShort' : 'secondServeShort') })}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {askAcePlacement ? (
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">{t('selectWhereServeLanded')}</div>
            <div className="grid grid-cols-1 gap-2">
              {ACE_PLACEMENTS.map(option => (
                <Button
                  key={option.id}
                  variant="outline"
                  size="lg"
                  data-option
                  className={cn("h-auto p-3 font-medium", option.color)}
                  onClick={() => handleAcePlacementClick(option.id)}
                >
                  {t(option.labelKey)}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">{t('selectHowPointEnded')}</div>

            <div className="grid grid-cols-1 gap-2">
              {outcomes.map((outcome) => (
                <Button
                  key={outcome.id}
                  variant="outline"
                  size="lg"
                  disabled={outcome.disabled}
                  className={cn(
                    "h-auto gap-0 px-3 py-2.5 flex flex-col items-start text-left whitespace-normal transition-all",
                    !outcome.disabled && outcome.color,
                    outcome.disabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => !outcome.disabled && handleOutcomeClick(outcome.id)}
                >
                  <div className="font-medium">{outcome.label}</div>
                  {/* An unavailable option shows why instead of what it means, so all five fit a phone */}
                  {!outcome.disabled && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {outcome.description}
                    </div>
                  )}
                  {/* Own line so the reason wraps inside the card on narrow phones */}
                  {outcome.disabled && (
                    <div data-unavailable-reason className="text-xs text-red-500 mt-0.5">
                      {outcome.id === 'ace' && t('serverMustWinForAce')}
                      {outcome.id === 'double_fault' && t('onlyOnSecondServeLoss')}
                    </div>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 