"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { PointDetail, ServeType, PointOutcome, ShotType, CourtPosition } from "@/lib/types"
import { Target, Zap, Trophy, AlertTriangle } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { cn } from "@/lib/utils"

interface IntuitivePointLoggerProps {
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

export function IntuitivePointLogger({ 
  open, 
  onOpenChange, 
  onSave, 
  pointContext
}: IntuitivePointLoggerProps) {
  const t = useTranslations()
  
  // Step tracking for the flow
  const [currentStep, setCurrentStep] = useState<'outcome' | 'serve-type' | 'court-position' | 'shot-type'>('outcome')
  
  // State for the point logging
  const [selectedOutcome, setSelectedOutcome] = useState<PointOutcome | null>(null)
  const [selectedServeType, setSelectedServeType] = useState<ServeType>(pointContext.serveType)
  const [selectedCourtPosition, setSelectedCourtPosition] = useState<CourtPosition>("deuce")
  const [selectedShotType, setSelectedShotType] = useState<ShotType>("serve")
  
  // Validation
  const [validationError, setValidationError] = useState<string>("")

  // Reset form when opening
  useEffect(() => {
    if (open) {
      setCurrentStep('outcome')
      setSelectedOutcome(null)
      setSelectedServeType(pointContext.serveType)
      setSelectedCourtPosition("deuce")
      setSelectedShotType("serve")
      setValidationError("")
    }
  }, [open, pointContext.serveType])

  // Validation logic
  useEffect(() => {
    if (!selectedOutcome) return
    
    let error = ""

    // Double fault validation
    if (selectedOutcome === "double_fault") {
      if (pointContext.serveType !== "second") {
        error = t('doubleFaultSecondServeError')
      } else if (pointContext.winner === pointContext.server) {
        error = t('doubleFaultReceiverError')
      }
    }

    // Ace validation
    if (selectedOutcome === "ace") {
      if (pointContext.winner !== pointContext.server) {
        error = t('aceServerError')
      }
    }

    setValidationError(error)
  }, [selectedOutcome, pointContext, t])

  const getContextBadges = () => {
    const badges = []
    if (pointContext.isBreakPoint) badges.push({ label: t('breakPoint'), icon: Target, color: "destructive" })
    if (pointContext.isSetPoint) badges.push({ label: t('setPoint'), icon: Zap, color: "secondary" })
    if (pointContext.isMatchPoint) badges.push({ label: t('matchPoint'), icon: Trophy, color: "default" })
    return badges
  }

  const isOutcomeDisabled = (outcome: PointOutcome) => {
    switch (outcome) {
      case 'ace':
        return pointContext.winner !== pointContext.server
      case 'double_fault':
        return pointContext.serveType !== "second" || pointContext.winner === pointContext.server
      default:
        return false
    }
  }

  const handleOutcomeSelect = (outcome: PointOutcome) => {
    if (isOutcomeDisabled(outcome)) return
    
    setSelectedOutcome(outcome)
    
    // For ace and double fault, skip to final save
    if (outcome === 'ace' || outcome === 'double_fault') {
      handleQuickSave(outcome)
      return
    }
    
    // For other outcomes, proceed to serve type selection if server won
    if (pointContext.winner === pointContext.server) {
      setCurrentStep('serve-type')
    } else {
      // Skip serve type for non-server winners
      setCurrentStep('court-position')
    }
  }

  const handleQuickSave = (outcome: PointOutcome) => {
    const pointDetail: Partial<PointDetail> = {
      serveType: selectedServeType,
      serveOutcome: outcome === 'ace' ? 'ace' : outcome === 'double_fault' ? 'double_fault' : 'winner',
      servePlacement: "wide", // Default
      rallyLength: outcome === 'ace' || outcome === 'double_fault' ? 1 : 1,
      pointOutcome: outcome,
      lastShotType: outcome === 'ace' || outcome === 'double_fault' ? 'serve' : selectedShotType,
      lastShotPlayer: pointContext.winner,
      courtPosition: selectedCourtPosition,
    }

    onSave(pointDetail)
    onOpenChange(false)
  }

  const handleServeTypeNext = () => {
    setCurrentStep('court-position')
  }

  const handleCourtPositionNext = () => {
    if (selectedOutcome === 'ace' || selectedOutcome === 'double_fault') {
      // Direct save
      handleQuickSave(selectedOutcome)
    } else {
      setCurrentStep('shot-type')
    }
  }

  const handleFinalSave = () => {
    if (validationError || !selectedOutcome) return

    const pointDetail: Partial<PointDetail> = {
      serveType: selectedServeType,
      serveOutcome: selectedOutcome === 'ace' ? 'ace' : selectedOutcome === 'double_fault' ? 'double_fault' : 'winner',
      servePlacement: "wide", // Default
      rallyLength: selectedOutcome === 'ace' || selectedOutcome === 'double_fault' ? 1 : 3,
      pointOutcome: selectedOutcome,
      lastShotType: selectedShotType,
      lastShotPlayer: pointContext.winner,
      courtPosition: selectedCourtPosition,
    }

    onSave(pointDetail)
    onOpenChange(false)
  }

  const outcomes = [
    {
      id: 'winner' as const,
      label: t('winner'),
      description: t('cleanWinner'),
      color: 'bg-green-500 hover:bg-green-600 text-white',
      disabled: false
    },
    {
      id: 'ace' as const,
      label: t('ace'),
      description: t('unreturnableServe'),
      color: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      disabled: isOutcomeDisabled('ace')
    },
    {
      id: 'forced_error' as const,
      label: t('forcedError'),
      description: t('opponentForcedIntoError'),
      color: 'bg-blue-500 hover:bg-blue-600 text-white',
      disabled: false
    },
    {
      id: 'unforced_error' as const,
      label: t('unforcedError'),
      description: t('unforcedMistake'),
      color: 'bg-orange-500 hover:bg-orange-600 text-white',
      disabled: false
    },
    {
      id: 'double_fault' as const,
      label: t('doubleFault'),
      description: t('twoConsecutiveFaults'),
      color: 'bg-red-500 hover:bg-red-600 text-white',
      disabled: isOutcomeDisabled('double_fault')
    }
  ]

  const serveTypes = [
    {
      id: 'first' as const,
      label: t('firstServe'),
      color: 'bg-primary hover:bg-primary/90 text-primary-foreground'
    },
    {
      id: 'second' as const,
      label: t('secondServe'),
      color: 'bg-secondary hover:bg-secondary/90 text-secondary-foreground'
    }
  ]

  const courtPositions = [
    {
      id: 'deuce' as const,
      label: t('deuceSide'),
      color: 'bg-purple-500 hover:bg-purple-600 text-white'
    },
    {
      id: 'ad' as const,
      label: t('adSide'),
      color: 'bg-indigo-500 hover:bg-indigo-600 text-white'
    }
  ]

  const shotTypes = [
    {
      id: 'serve' as const,
      label: t('serve'),
      color: 'bg-green-500 hover:bg-green-600 text-white'
    },
    {
      id: 'forehand' as const,
      label: t('forehand'),
      color: 'bg-blue-500 hover:bg-blue-600 text-white'
    },
    {
      id: 'backhand' as const,
      label: t('backhand'),
      color: 'bg-red-500 hover:bg-red-600 text-white'
    },
    {
      id: 'volley' as const,
      label: t('volley'),
      color: 'bg-yellow-500 hover:bg-yellow-600 text-white'
    },
    {
      id: 'overhead' as const,
      label: t('overhead'),
      color: 'bg-orange-500 hover:bg-orange-600 text-white'
    }
  ]

  const renderStepContent = () => {
    switch (currentStep) {
      case 'outcome':
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">{t('howDidTheyWin')}</h3>
              <p className="text-sm text-muted-foreground">{t('selectHowPointEnded')}</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {outcomes.map((outcome) => (
                <Button
                  key={outcome.id}
                  variant="outline"
                  size="lg"
                  disabled={outcome.disabled}
                  className={cn(
                    "h-20 flex flex-col items-center justify-center text-center transition-all border-2",
                    !outcome.disabled && outcome.color,
                    outcome.disabled && "opacity-50 cursor-not-allowed bg-gray-100",
                    "hover:scale-[1.02] active:scale-[0.98]"
                  )}
                  onClick={() => handleOutcomeSelect(outcome.id)}
                >
                  <div className="font-semibold text-base">{outcome.label}</div>
                  <div className="text-xs opacity-80 mt-1">{outcome.description}</div>
                </Button>
              ))}
            </div>
            
            {(isOutcomeDisabled('ace') || isOutcomeDisabled('double_fault')) && (
              <div className="mt-4 p-3 text-xs text-muted-foreground bg-muted rounded-lg">
                {isOutcomeDisabled('ace') && <p>• {t('aceDisabledHint')}</p>}
                {isOutcomeDisabled('double_fault') && <p>• {t('doubleFaultDisabledHint')}</p>}
              </div>
            )}
          </div>
        )

      case 'serve-type':
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">{t('serveType')}</h3>
              <p className="text-sm text-muted-foreground">Which serve was it?</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {serveTypes.map((serveType) => (
                <Button
                  key={serveType.id}
                  variant={selectedServeType === serveType.id ? "default" : "outline"}
                  size="lg"
                  className={cn(
                    "h-16 flex flex-col items-center justify-center transition-all border-2",
                    selectedServeType === serveType.id ? serveType.color : "hover:border-primary",
                    "hover:scale-[1.02] active:scale-[0.98]"
                  )}
                  onClick={() => setSelectedServeType(serveType.id)}
                >
                  <div className="font-semibold">{serveType.label}</div>
                </Button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep('outcome')} className="flex-1">
                {t('back')}
              </Button>
              <Button onClick={handleServeTypeNext} className="flex-1">
                {t('next')}
              </Button>
            </div>
          </div>
        )

      case 'court-position':
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">{t('courtPosition')}</h3>
              <p className="text-sm text-muted-foreground">Which side of the court?</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {courtPositions.map((position) => (
                <Button
                  key={position.id}
                  variant={selectedCourtPosition === position.id ? "default" : "outline"}
                  size="lg"
                  className={cn(
                    "h-16 flex flex-col items-center justify-center transition-all border-2",
                    selectedCourtPosition === position.id ? position.color : "hover:border-primary",
                    "hover:scale-[1.02] active:scale-[0.98]"
                  )}
                  onClick={() => setSelectedCourtPosition(position.id)}
                >
                  <div className="font-semibold">{position.label}</div>
                </Button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(pointContext.winner === pointContext.server ? 'serve-type' : 'outcome')} 
                className="flex-1"
              >
                {t('back')}
              </Button>
              <Button onClick={handleCourtPositionNext} className="flex-1">
                {t('next')}
              </Button>
            </div>
          </div>
        )

      case 'shot-type':
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">{t('lastShotType')}</h3>
              <p className="text-sm text-muted-foreground">What type of shot ended the point?</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {shotTypes.map((shotType) => (
                <Button
                  key={shotType.id}
                  variant={selectedShotType === shotType.id ? "default" : "outline"}
                  size="lg"
                  className={cn(
                    "h-16 flex flex-col items-center justify-center transition-all border-2",
                    selectedShotType === shotType.id ? shotType.color : "hover:border-primary",
                    "hover:scale-[1.02] active:scale-[0.98]"
                  )}
                  onClick={() => setSelectedShotType(shotType.id)}
                >
                  <div className="font-semibold">{shotType.label}</div>
                </Button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep('court-position')} className="flex-1">
                {t('back')}
              </Button>
              <Button 
                onClick={handleFinalSave} 
                className="flex-1"
                disabled={!!validationError}
              >
                {t('recordPoint')}
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 justify-center">
            {t('point')} #{pointContext.pointNumber} {t('details')}
            <div className="flex gap-1">
              {getContextBadges().map((badge, index) => {
                const Icon = badge.icon
                return (
                  <Badge key={index} variant={badge.color as "default" | "destructive" | "secondary"} className="text-xs">
                    <Icon className="h-3 w-3 mr-1" />
                    {badge.label}
                  </Badge>
                )
              })}
            </div>
          </SheetTitle>
          <div className="text-sm text-muted-foreground text-center">
            {t('set')} {pointContext.setNumber}, {t('game')} {pointContext.gameNumber} • {pointContext.gameScore} • {pointContext.playerNames[pointContext.winner]} {t('wins')}
          </div>
          
          {/* Step Progress Indicator */}
          <div className="flex items-center justify-center mt-4">
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-3 h-3 rounded-full", 
                currentStep === 'outcome' ? "bg-primary" : "bg-muted"
              )} />
              <div className={cn(
                "w-8 h-0.5", 
                ['serve-type', 'court-position', 'shot-type'].includes(currentStep) ? "bg-primary" : "bg-muted"
              )} />
              <div className={cn(
                "w-3 h-3 rounded-full", 
                ['serve-type', 'court-position', 'shot-type'].includes(currentStep) ? "bg-primary" : "bg-muted"
              )} />
              <div className={cn(
                "w-8 h-0.5", 
                ['court-position', 'shot-type'].includes(currentStep) ? "bg-primary" : "bg-muted"
              )} />
              <div className={cn(
                "w-3 h-3 rounded-full", 
                ['court-position', 'shot-type'].includes(currentStep) ? "bg-primary" : "bg-muted"
              )} />
              <div className={cn(
                "w-8 h-0.5", 
                currentStep === 'shot-type' ? "bg-primary" : "bg-muted"
              )} />
              <div className={cn(
                "w-3 h-3 rounded-full", 
                currentStep === 'shot-type' ? "bg-primary" : "bg-muted"
              )} />
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Validation Error Alert */}
          {validationError && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <Card>
            <CardContent className="p-6">
              {renderStepContent()}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}