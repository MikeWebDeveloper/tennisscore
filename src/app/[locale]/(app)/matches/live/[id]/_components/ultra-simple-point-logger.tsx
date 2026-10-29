"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { PointDetail, PointOutcome, ShotType } from "@/lib/types"
import { useTranslations } from "@/i18n"
import { cn } from "@/lib/utils"
import { ACE_PLACEMENTS, SERVE_PLACEMENTS, type ServePlacement } from "@/lib/utils/serve-placement"

type Step = 'outcome' | 'serve-direction' | 'winner-type' | 'shot-direction'

// Each step says exactly what it asks for
const STEP_SUBTITLE_KEYS: Record<Step, string> = {
  'outcome': 'selectHowPointEnded',
  'serve-direction': 'selectWhereServeLanded',
  'winner-type': 'selectShotThatEndedPoint',
  'shot-direction': 'selectWhereShotWent',
}

interface UltraSimplePointLoggerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (pointDetail: Partial<PointDetail>) => void
  /** 'shot-type' records the outcome and, for rallies, the shot type only: no placement, direction or rally length. */
  mode?: 'detailed' | 'shot-type'
  pointContext: {
    pointNumber: number
    setNumber: number
    gameNumber: number
    gameScore: string
    winner: "p1" | "p2"
    server: "p1" | "p2"
    serveType: "first" | "second"
    isBreakPoint: boolean
    isSetPoint: boolean
    isMatchPoint: boolean
    playerNames: { p1: string; p2: string }
  }
}

export function UltraSimplePointLogger({ 
  open, 
  onOpenChange, 
  onSave,
  pointContext,
  mode = 'detailed'
}: UltraSimplePointLoggerProps) {
  const t = useTranslations('common')

  // Flow state: 'outcome' -> 'serve-direction' (for ace/double fault) -> 'winner-type' (return shots offered to the receiver) -> 'shot-direction' -> done
  const [step, setStep] = useState<Step>('outcome')
  const [outcome, setOutcome] = useState<PointOutcome | null>(null)
  const [winnerType, setWinnerType] = useState<ShotType | null>(null)
  const [serveDirection, setServeDirection] = useState<ServePlacement | null>(null)
  const [shotDirection, setShotDirection] = useState<'cross' | 'line' | 'body' | 'long' | 'wide' | 'net' | null>(null)
  const [returnType, setReturnType] = useState<'regular' | 'return' | null>(null)
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = serveDirection // Used in handleServeDirectionClick via setServeDirection
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const __ = shotDirection // Used in handleShotDirectionClick via setShotDirection

  const finish = (pointDetail: Partial<PointDetail>) => {
    onSave(pointDetail)
    onOpenChange(false)
    resetState()
  }

  const handleOutcomeClick = (selectedOutcome: PointOutcome) => {
    setOutcome(selectedOutcome)
    const isServePoint = selectedOutcome === 'ace' || selectedOutcome === 'double_fault'

    // The shot-type level records serve points without placement
    if (mode === 'shot-type' && isServePoint) {
      finish({
        serveType: pointContext.serveType,
        serveOutcome: selectedOutcome,
        rallyLength: 1,
        pointOutcome: selectedOutcome,
        lastShotType: 'serve',
        lastShotPlayer: pointContext.server,
      })
      return
    }

    // For ace/double fault, collect serve placement first
    if (isServePoint) {
      setStep('serve-direction')
    } else {
      // For winners and errors, skip serve placement and go to shot type
      setStep('winner-type')
    }
  }

  const handleServeDirectionClick = (direction: ServePlacement) => {
    setServeDirection(direction)
    
    // For ace/double fault, save immediately after serve direction
    if (outcome === 'ace' || outcome === 'double_fault') {
      const pointDetail: Partial<PointDetail> = {
        serveType: pointContext.serveType,
        serveOutcome: outcome,
        servePlacement: direction,
        rallyLength: 1,
        pointOutcome: outcome,
        lastShotType: 'serve',
        lastShotPlayer: pointContext.server, // Ace/double fault is always by server
      }
      onSave(pointDetail)
      onOpenChange(false)
      resetState()
      return
    }
    
    // For other outcomes, continue to shot type selection
    setStep('winner-type')
  }

  // A return can end the point as the receiver's winner or as the receiver's error (forced or unforced),
  // which hands the point to the server; the old separate "was it a return?" step is part of the shot choice
  const isError = outcome === 'forced_error' || outcome === 'unforced_error'
  const receiverEndedPoint =
    (outcome === 'winner' && pointContext.winner !== pointContext.server) ||
    (isError && pointContext.winner === pointContext.server)

  const handleWinnerTypeClick = (option: { shot: ShotType; isReturn: boolean }) => {
    const chosenReturnType = option.isReturn ? 'return' : 'regular'
    setWinnerType(option.shot)
    setReturnType(chosenReturnType)
    if (mode === 'shot-type' && outcome) {
      // Shot type is the last detail at this level: no direction or rally length
      finish({
        serveType: pointContext.serveType,
        serveOutcome: 'winner',
        pointOutcome: outcome,
        lastShotType: option.shot,
        lastShotPlayer: outcome === 'winner' ? pointContext.winner : (pointContext.winner === 'p1' ? 'p2' : 'p1'),
        ...(receiverEndedPoint && { winnerType: chosenReturnType }),
      })
      return
    }
    setStep('shot-direction')
  }

  const handleShotDirectionClick = (direction: 'cross' | 'line' | 'body' | 'long' | 'wide' | 'net') => {
    setShotDirection(direction)
    // Direction is the last step; whether it was a return was chosen with the shot
    savePoint(direction, returnType ?? 'regular')
  }

  const savePoint = (direction: 'cross' | 'line' | 'body' | 'long' | 'wide' | 'net', winnerTypeValue: 'regular' | 'return' = 'regular') => {
    if (!outcome || !winnerType) return
    
    const pointDetail: Partial<PointDetail> = {
      serveType: pointContext.serveType,
      serveOutcome: outcome === 'ace' ? 'ace' : outcome === 'double_fault' ? 'double_fault' : 'winner',
      // Only include serve placement if it was collected (for ace/double fault)
      ...(serveDirection && { servePlacement: serveDirection }),
      rallyLength: outcome === 'ace' || outcome === 'double_fault' ? 1 : 3,
      pointOutcome: outcome,
      lastShotType: winnerType,
      lastShotPlayer: pointContext.winner,
      shotDirection: direction,
      ...(receiverEndedPoint && {
        winnerType: winnerTypeValue
      })
    }
    
    onSave(pointDetail)
    onOpenChange(false)
    resetState()
  }


  const resetState = () => {
    setStep('outcome')
    setOutcome(null)
    setWinnerType(null)
    setServeDirection(null)
    setShotDirection(null)
    setReturnType(null)
  }

  // Conditional logic matching SimpleStatsPopup exactly
  const isAceDisabled = pointContext.winner !== pointContext.server
  const isDoubleFaultDisabled = pointContext.serveType === 'first' || pointContext.winner === pointContext.server

  const outcomes = [
    {
      id: 'winner' as const,
      label: t('winner'),
      description: t('cleanWinner'),
      color: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20',
      disabled: false
    },
    {
      id: 'ace' as const,
      label: t('aces'),
      description: t('unreturnableServe'),
      color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20',
      disabled: isAceDisabled
    },
    {
      id: 'forced_error' as const,
      label: t('forcedError'),
      description: t('opponentForcedIntoError'),
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20',
      disabled: false
    },
    {
      id: 'unforced_error' as const,
      label: t('unforcedError'),
      description: t('unforcedMistake'),
      color: 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20',
      disabled: false
    },
    {
      id: 'double_fault' as const,
      label: t('doubleFaults'),
      description: t('twoConsecutiveFaults'),
      color: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20',
      disabled: isDoubleFaultDisabled
    }
  ]

  // Shot types excluding serve (since serve winners should be classified as Ace)
  // Rows: forehand/backhand, return forehand/backhand (only when the receiver's shot ended the point), volley/smash
  const winnerTypes = [
    { key: 'forehand', shot: 'forehand' as const, isReturn: false, label: t('forehand'), color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20' },
    { key: 'backhand', shot: 'backhand' as const, isReturn: false, label: t('backhand'), color: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' },
    ...(receiverEndedPoint ? [
      { key: 'return-forehand', shot: 'forehand' as const, isReturn: true, label: t('returnForehand'), color: 'bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500/20' },
      { key: 'return-backhand', shot: 'backhand' as const, isReturn: true, label: t('returnBackhand'), color: 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20' },
    ] : []),
    { key: 'volley', shot: 'volley' as const, isReturn: false, label: t('volley'), color: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' },
    { key: 'overhead', shot: 'overhead' as const, isReturn: false, label: t('overhead'), color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20' },
  ]


  // Aces have their own placements (net cord, out of the court, on the T); double faults keep the general ones
  const serveDirections = (outcome === 'ace' ? ACE_PLACEMENTS : SERVE_PLACEMENTS).map(option => ({
    id: option.id,
    label: t(option.labelKey),
    color: option.color
  }))

  const subtitle = (
    <div data-step-subtitle className="text-sm font-medium text-muted-foreground">{t(STEP_SUBTITLE_KEYS[step])}</div>
  )

  const getShotDirections = () => {
    if (outcome === 'winner') {
      return [
        {
          id: 'cross' as const,
          label: t('crossCourt'),
          color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20 hover:bg-cyan-500/20'
        },
        {
          id: 'line' as const,
          label: t('downTheLine'),
          color: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
        },
        {
          id: 'body' as const,
          label: t('bodyShot'),
          color: 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
        }
      ]
    } else if (outcome === 'unforced_error' || outcome === 'forced_error') {
      return [
        {
          id: 'long' as const,
          label: t('long'),
          color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20 hover:bg-cyan-500/20'
        },
        {
          id: 'wide' as const,
          label: t('wide'),
          color: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
        },
        {
          id: 'net' as const,
          label: t('net'),
          color: 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
        }
      ]
    }
    return []
  }

  const renderStep = () => {
    switch (step) {
      case 'outcome':
        return (
          <div className="space-y-3">
            <div className="text-center">
              <h3 className="text-base font-semibold mb-1.5">{t('howDidTheyWin')}</h3>
              <div className="flex flex-wrap justify-center gap-1.5">
                <Badge variant="outline" className="text-xs">
                  {pointContext.playerNames[pointContext.winner]} {t('wins')}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {pointContext.playerNames[pointContext.server]} {t('serving')} ({t(pointContext.serveType === 'first' ? 'firstServe' : 'secondServe').toLowerCase()})
                </Badge>
              </div>
            </div>
            
            {subtitle}
            
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
                  {/* An unavailable option shows why instead of what it means: one line, so all five fit a phone */}
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
        )

      case 'serve-direction':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('servePlacement')}</h3>
              <div className="text-sm text-muted-foreground">
                <Badge variant="outline" className="mr-2">
                  {pointContext.playerNames[pointContext.winner]} {t('wins')}
                </Badge>
                <Badge variant="secondary">
                  {pointContext.playerNames[pointContext.server]} {t('serving')} ({t(pointContext.serveType === 'first' ? 'firstServe' : 'secondServe').toLowerCase()})
                </Badge>
              </div>
            </div>
            
            {subtitle}
            
            <div className="grid grid-cols-1 gap-2">
              {serveDirections.map((direction) => (
                <Button
                  key={direction.id}
                  variant="outline"
                  size="lg"
                  className={cn(
                    "h-auto p-3 flex items-center justify-center text-center transition-all",
                    direction.color
                  )}
                  onClick={() => handleServeDirectionClick(direction.id)}
                >
                  <div data-option className="font-medium">{direction.label}</div>
                </Button>
              ))}
            </div>
          </div>
        )

      case 'winner-type':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('lastShotType')}</h3>
              <div className="text-sm text-muted-foreground">
                <Badge variant="outline" className="mr-2">
                  {pointContext.playerNames[pointContext.winner]} {t('wins')}
                </Badge>
                <Badge variant="secondary">
                  {pointContext.playerNames[pointContext.server]} {t('serving')} ({t(pointContext.serveType === 'first' ? 'firstServe' : 'secondServe').toLowerCase()})
                </Badge>
              </div>
            </div>
            
            {subtitle}
            
            <div className="grid grid-cols-2 gap-2">
              {winnerTypes.map((type) => (
                <Button
                  key={type.key}
                  variant="outline"
                  size="lg"
                  className={cn(
                    "h-auto p-3 flex items-center justify-center text-center whitespace-normal transition-all",
                    type.color
                  )}
                  onClick={() => handleWinnerTypeClick(type)}
                >
                  <div data-option className="font-medium">{type.label}</div>
                </Button>
              ))}
            </div>
          </div>
        )

      case 'shot-direction':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('shotDirection')}</h3>
              <div className="text-sm text-muted-foreground">
                <Badge variant="outline" className="mr-2">
                  {pointContext.playerNames[pointContext.winner]} {t('wins')}
                </Badge>
                <Badge variant="secondary">
                  {pointContext.playerNames[pointContext.server]} {t('serving')} ({t(pointContext.serveType === 'first' ? 'firstServe' : 'secondServe').toLowerCase()})
                </Badge>
              </div>
            </div>
            
            {subtitle}
            
            <div className="grid grid-cols-1 gap-2">
              {getShotDirections().map((direction) => (
                <Button
                  key={direction.id}
                  variant="outline"
                  size="lg"
                  className={cn(
                    "h-auto p-3 flex items-center justify-center text-center transition-all",
                    direction.color
                  )}
                  onClick={() => handleShotDirectionClick(direction.id)}
                >
                  <div className="font-medium">{direction.label}</div>
                </Button>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) resetState()
    }}>
      <DialogContent className="gap-3 sm:max-w-md">
        <DialogHeader className="gap-0.5">
          <DialogTitle className="text-center text-base">
            {t('point')} #{pointContext.pointNumber} {t('details')}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            <p>{t('set')} {pointContext.setNumber}, {t('game')} {pointContext.gameNumber} • {pointContext.gameScore}</p>
          </DialogDescription>
        </DialogHeader>
        
        {renderStep()}
      </DialogContent>
    </Dialog>
  )
}