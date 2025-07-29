"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { PointDetail, PointOutcome, ShotType } from "@/lib/types"
import { useTranslations } from "@/i18n"
import { cn } from "@/lib/utils"

interface UltraSimplePointLoggerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (pointDetail: Partial<PointDetail>) => void
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
  pointContext
}: UltraSimplePointLoggerProps) {
  const t = useTranslations('common')
  
  // Flow state: 'outcome' -> 'serve-direction' (for ace/double fault) -> 'winner-type' -> 'shot-direction' -> 'return-type' (for receiving winners) -> done
  const [step, setStep] = useState<'outcome' | 'serve-direction' | 'winner-type' | 'shot-direction' | 'return-type'>('outcome')
  const [outcome, setOutcome] = useState<PointOutcome | null>(null)
  const [winnerType, setWinnerType] = useState<ShotType | null>(null)
  const [serveDirection, setServeDirection] = useState<'wide' | 'body' | 't' | null>(null)
  const [shotDirection, setShotDirection] = useState<'cross' | 'line' | 'body' | 'long' | 'wide' | 'net' | null>(null)
  const [returnType, setReturnType] = useState<'regular' | 'return' | null>(null)
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _returnType = returnType // Used in handleReturnTypeClick via setReturnType
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = serveDirection // Used in handleServeDirectionClick via setServeDirection
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const __ = shotDirection // Used in handleShotDirectionClick via setShotDirection

  const handleOutcomeClick = (selectedOutcome: PointOutcome) => {
    setOutcome(selectedOutcome)
    
    // For ace/double fault, collect serve placement first
    if (selectedOutcome === 'ace' || selectedOutcome === 'double_fault') {
      setStep('serve-direction')
    } else {
      // For winners and errors, skip serve placement and go to shot type
      setStep('winner-type')
    }
  }

  const handleServeDirectionClick = (direction: 'wide' | 'body' | 't') => {
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

  const handleWinnerTypeClick = (shotType: ShotType) => {
    setWinnerType(shotType)
    setStep('shot-direction')
  }

  const handleShotDirectionClick = (direction: 'cross' | 'line' | 'body' | 'long' | 'wide' | 'net') => {
    setShotDirection(direction)
    
    // If it's a winner by the receiving player, go to return type step
    if (outcome === 'winner' && pointContext.winner !== pointContext.server) {
      setStep('return-type')
      return
    }
    
    // Otherwise, save the point immediately
    savePoint(direction, 'regular')
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
      ...(outcome === 'winner' && pointContext.winner !== pointContext.server && {
        winnerType: winnerTypeValue
      })
    }
    
    onSave(pointDetail)
    onOpenChange(false)
    resetState()
  }


  const handleReturnTypeClick = (type: 'regular' | 'return') => {
    setReturnType(type)
    savePoint(shotDirection!, type)
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
  const winnerTypes = [
    {
      id: 'forehand' as const,
      label: t('forehand'),
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20'
    },
    {
      id: 'backhand' as const,
      label: t('backhand'),
      color: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
    },
    {
      id: 'volley' as const,
      label: t('volley'),
      color: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
    },
    {
      id: 'overhead' as const,
      label: t('overhead'),
      color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20'
    }
  ]


  const serveDirections = [
    {
      id: 'wide' as const,
      label: t('wide'),
      color: 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20'
    },
    {
      id: 'body' as const,
      label: t('body'),
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
    },
    {
      id: 't' as const,
      label: t('tDownTheMiddle'),
      color: 'bg-violet-500/10 text-violet-500 border-violet-500/20 hover:bg-violet-500/20'
    }
  ]

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
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('howDidTheyWin')}</h3>
              <div className="text-sm text-muted-foreground">
                <Badge variant="outline" className="mr-2">
                  {pointContext.playerNames[pointContext.winner]} {t('wins')}
                </Badge>
                <Badge variant="secondary">
                  {pointContext.playerNames[pointContext.server]} {t('serving')} ({pointContext.serveType})
                </Badge>
              </div>
            </div>
            
            <div className="text-sm font-medium text-muted-foreground">{t('selectHowPointEnded')}</div>
            
            <div className="grid grid-cols-1 gap-2">
              {outcomes.map((outcome) => (
                <Button
                  key={outcome.id}
                  variant="outline"
                  size="lg"
                  disabled={outcome.disabled}
                  className={cn(
                    "h-auto p-4 flex flex-col items-start text-left transition-all",
                    !outcome.disabled && outcome.color,
                    outcome.disabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => !outcome.disabled && handleOutcomeClick(outcome.id)}
                >
                  <div className="font-medium">{outcome.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {outcome.description}
                    {outcome.disabled && (
                      <span className="text-red-500 ml-2">
                        {outcome.id === 'ace' && t('serverMustWinForAce')}
                        {outcome.id === 'double_fault' && t('onlyOnSecondServeLoss')}
                      </span>
                    )}
                  </div>
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
                  {pointContext.playerNames[pointContext.server]} {t('serving')} ({pointContext.serveType})
                </Badge>
              </div>
            </div>
            
            <div className="text-sm font-medium text-muted-foreground">{t('selectHowPointEnded')}</div>
            
            <div className="grid grid-cols-1 gap-2">
              {serveDirections.map((direction) => (
                <Button
                  key={direction.id}
                  variant="outline"
                  size="lg"
                  className={cn(
                    "h-auto p-4 flex items-center justify-center text-center transition-all",
                    direction.color
                  )}
                  onClick={() => handleServeDirectionClick(direction.id)}
                >
                  <div className="font-medium">{direction.label}</div>
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
                  {pointContext.playerNames[pointContext.server]} {t('serving')} ({pointContext.serveType})
                </Badge>
              </div>
            </div>
            
            <div className="text-sm font-medium text-muted-foreground">{t('selectHowPointEnded')}</div>
            
            <div className="grid grid-cols-2 gap-2">
              {winnerTypes.map((type) => (
                <Button
                  key={type.id}
                  variant="outline"
                  size="lg"
                  className={cn(
                    "h-auto p-4 flex items-center justify-center text-center transition-all",
                    type.color
                  )}
                  onClick={() => handleWinnerTypeClick(type.id)}
                >
                  <div className="font-medium">{type.label}</div>
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
                  {pointContext.playerNames[pointContext.server]} {t('serving')} ({pointContext.serveType})
                </Badge>
              </div>
            </div>
            
            <div className="text-sm font-medium text-muted-foreground">{t('selectHowPointEnded')}</div>
            
            <div className="grid grid-cols-1 gap-2">
              {getShotDirections().map((direction) => (
                <Button
                  key={direction.id}
                  variant="outline"
                  size="lg"
                  className={cn(
                    "h-auto p-4 flex items-center justify-center text-center transition-all",
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

      case 'return-type':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('wasItReturn')}</h3>
              <div className="text-sm text-muted-foreground">
                <Badge variant="outline" className="mr-2">
                  {pointContext.playerNames[pointContext.winner]} {t('wins')}
                </Badge>
                <Badge variant="secondary">
                  {pointContext.playerNames[pointContext.server]} {t('serving')} ({pointContext.serveType})
                </Badge>
              </div>
            </div>
            
            <div className="text-sm font-medium text-muted-foreground">{t('selectHowPointEnded')}</div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  "h-auto p-4 flex items-center justify-center text-center transition-all",
                  "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20"
                )}
                onClick={() => handleReturnTypeClick('regular')}
              >
                <div className="font-medium">{t('regular')}</div>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  "h-auto p-4 flex items-center justify-center text-center transition-all",
                  "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
                )}
                onClick={() => handleReturnTypeClick('return')}
              >
                <div className="font-medium">{t('return')}</div>
              </Button>
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {t('point')} #{pointContext.pointNumber} {t('details')}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground space-y-1">
            <p>{t('set')} {pointContext.setNumber}, {t('game')} {pointContext.gameNumber} • {pointContext.gameScore}</p>
          </DialogDescription>
        </DialogHeader>
        
        {renderStep()}
      </DialogContent>
    </Dialog>
  )
}