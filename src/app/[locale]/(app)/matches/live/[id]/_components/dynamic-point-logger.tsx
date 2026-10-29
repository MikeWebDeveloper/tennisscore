"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { PointDetail, PointOutcome, ShotType } from "@/lib/types"
import { useTranslations } from "@/i18n"
import { cn } from "@/lib/utils"
import { ACE_PLACEMENTS, SERVE_PLACEMENTS, type ServePlacement } from "@/lib/utils/serve-placement"

// Each step says exactly what it asks for
const STEP_SUBTITLE_KEYS: Partial<Record<string, string>> = {
  'outcome': 'selectHowPointEnded',
  'serve-direction': 'selectWhereServeLanded',
  'winner-type': 'selectShotThatEndedPoint',
  'shot-direction': 'selectWhereShotWent',
  'return-type': 'selectIfReturn',
}
import { useMatchStore } from "@/stores/matchStore"
import { Clock, Zap, Target, Activity, Ruler } from "lucide-react"

interface DynamicPointLoggerProps {
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
    isBreakPoint?: boolean
    isSetPoint?: boolean
    isMatchPoint?: boolean
    playerNames: { p1: string; p2: string }
  }
}

export function DynamicPointLogger({
  open,
  onOpenChange,
  onSave,
  pointContext
}: DynamicPointLoggerProps) {
  const t = useTranslations('common')

  const { customMode } = useMatchStore()

  // Dynamic step flow based on enabled categories
  type Step = 'outcome' | 'serve-direction' | 'serve-speed' | 'return-quality' | 'winner-type' | 'shot-direction' | 'rally-length' | 'return-type'
  const [step, setStep] = useState<Step>('outcome')

  // Standard state
  const [outcome, setOutcome] = useState<PointOutcome | null>(null)
  const [winnerType, setWinnerType] = useState<ShotType | null>(null)
  const [serveDirection, setServeDirection] = useState<ServePlacement | null>(null)
  const [shotDirection, setShotDirection] = useState<'cross' | 'line' | 'body' | 'long' | 'wide' | 'net' | null>(null)
  const [returnType, setReturnType] = useState<'regular' | 'return' | null>(null)

  // Advanced/Custom state
  const [serveSpeed, setServeSpeed] = useState<'slow' | 'medium' | 'fast' | null>(null)
  const [rallyLength, setRallyLength] = useState<number>(3)
  const [returnQuality, setReturnQuality] = useState<'defensive' | 'neutral' | 'offensive' | null>(null)
  const [courtPosition, setCourtPosition] = useState<'net' | 'baseline'>('baseline')

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _returnType = returnType // Used in handleReturnTypeClick via setReturnType

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = serveDirection // Used in handleServeDirectionClick via setServeDirection
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const __ = shotDirection // Used in handleShotDirectionClick via setShotDirection

  // Helper to determine next step based on configuration
  const getNextStep = (currentStep: Step, context?: any): Step | 'done' => {
    const categories = customMode.selectedCategories || []
    const afterServe = (): Step | 'done' => categories.includes('shot-tracking') ? 'winner-type' : categories.includes('rally-type') ? 'rally-length' : 'done'

    if (currentStep === 'outcome') {
      const isAceOrDF = context?.outcome === 'ace' || context?.outcome === 'double_fault'

      // If Ace/DF, check for serve placement first
      if (isAceOrDF) {
        if (categories.includes('serve-placement')) return 'serve-direction'
        if (categories.includes('serve-speed')) return 'serve-speed'
        return 'done' // End for Ace/DF if no serve stats
      }

      // For Winner/Error, check serve placedment first
      if (categories.includes('serve-placement')) return 'serve-direction'
      if (categories.includes('serve-speed')) return 'serve-speed'
      if (categories.includes('return-quality')) return 'return-quality'

      return afterServe()
    }

    if (currentStep === 'serve-direction') {
      if (categories.includes('serve-speed')) return 'serve-speed'
      // If it's Ace/DF, we might be done unless we track other stuff (unlikely for Ace/DF except maybe speed)
      if (outcome === 'ace' || outcome === 'double_fault') return 'done'

      if (categories.includes('return-quality')) return 'return-quality'
      return afterServe()
    }

    if (currentStep === 'serve-speed') {
      // If it's Ace/DF, we are done
      if (outcome === 'ace' || outcome === 'double_fault') return 'done'

      if (categories.includes('return-quality')) return 'return-quality'
      return afterServe()
    }

    if (currentStep === 'return-quality') {
      return afterServe()
    }

    if (currentStep === 'winner-type') {
      return 'shot-direction'
    }

    if (currentStep === 'shot-direction') {
      // Check for return type logic for winners
      if (outcome === 'winner' && pointContext.winner !== pointContext.server) {
        return 'return-type'
      }

      // Check for rally length
      if (categories.includes('rally-type')) {
        return 'rally-length'
      }

      return 'done'
    }

    if (currentStep === 'return-type') {
      if (categories.includes('rally-type')) return 'rally-length'
      return 'done'
    }

    if (currentStep === 'rally-length') {
      return 'done'
    }

    return 'done'
  }

  const handleOutcomeClick = (selectedOutcome: PointOutcome) => {
    setOutcome(selectedOutcome)
    const next = getNextStep('outcome', { outcome: selectedOutcome })

    if (next === 'done') {
      savePoint(selectedOutcome)
    } else {
      setStep(next)
    }
  }

  const handleServeDirectionClick = (direction: ServePlacement) => {
    setServeDirection(direction)
    const next = getNextStep('serve-direction')
    if (next === 'done') {
      savePoint(outcome!, { serveDirection: direction })
    } else {
      setStep(next)
    }
  }

  const handleServeSpeedClick = (speed: 'slow' | 'medium' | 'fast') => {
    setServeSpeed(speed)
    const next = getNextStep('serve-speed')
    if (next === 'done') {
      savePoint(outcome!, { serveSpeed: speed })
    } else {
      setStep(next)
    }
  }

  const handleReturnQualityClick = (quality: 'defensive' | 'neutral' | 'offensive') => {
    setReturnQuality(quality)
    const next = getNextStep('return-quality')
    if (next === 'done') {
      savePoint(outcome!, { returnQuality: quality })
    } else {
      setStep(next)
    }
  }

  const handleWinnerTypeClick = (shotType: ShotType) => {
    setWinnerType(shotType)
    const next = getNextStep('winner-type')
    setStep(next as Step)
  }

  const handleShotDirectionClick = (direction: 'cross' | 'line' | 'body' | 'long' | 'wide' | 'net') => {
    setShotDirection(direction)
    const next = getNextStep('shot-direction')
    if (next === 'done') {
      savePoint(outcome!, { shotDirection: direction })
    } else {
      setStep(next as Step)
    }
  }

  const handleRallyLengthChange = (value: number) => {
    setRallyLength(value)
  }

  const handleRallyLengthSubmit = () => {
    savePoint(outcome!, { rallyLength })
  }

  const savePoint = (
    finalOutcome: PointOutcome,
    updates: Partial<any> = {}
  ) => {
    // Combine state with updates
    const currentData = {
      serveDirection,
      serveSpeed,
      returnQuality,
      winnerType,
      shotDirection,
      rallyLength,
      ...updates
    }

    const pointDetail: Partial<PointDetail> = {
      serveType: pointContext.serveType,
      serveOutcome: finalOutcome === 'ace' ? 'ace' : finalOutcome === 'double_fault' ? 'double_fault' : 'winner', // Approximation

      // Standard fields if available
      ...(currentData.serveDirection && { servePlacement: currentData.serveDirection }),

      // Default rally length logic if not explicitly set
      rallyLength: currentData.rallyLength || (finalOutcome === 'ace' || finalOutcome === 'double_fault' ? 1 : 3),

      pointOutcome: finalOutcome,
      lastShotType: currentData.winnerType as ShotType | undefined,
      lastShotPlayer: pointContext.winner,
      shotDirection: currentData.shotDirection ?? undefined,

      // Custom fields bucket
      ...((currentData.serveSpeed || currentData.returnQuality || typeof updates.rallyLength === 'number') ? {
        customFields: {
          ...(currentData.serveSpeed ? { serveSpeed: currentData.serveSpeed } : {}),
          ...(currentData.returnQuality ? { returnQuality: currentData.returnQuality } : {}),
          ...(typeof updates.rallyLength === 'number' ? { rallyLength: updates.rallyLength } : {})
        }
      } : {})
    }

    // Add return type if applicable
    if (returnType) {
      // @ts-ignore
      pointDetail.winnerType = returnType
    }

    if (updates.winnerType) {
      // @ts-ignore
      pointDetail.winnerType = updates.winnerType
    }

    onSave(pointDetail)
    onOpenChange(false)
    resetState()
  }


  const handleReturnTypeClick = (type: 'regular' | 'return') => {
    setReturnType(type)
    const next = getNextStep('return-type')
    if (next === 'done') {
      savePoint(outcome!, { winnerType: type })
    } else {
      setStep(next as Step)
    }
  }

  const resetState = () => {
    setStep('outcome')
    setOutcome(null)
    setWinnerType(null)
    setServeDirection(null)
    setShotDirection(null)
    setReturnType(null)
    setServeSpeed(null)
    setReturnQuality(null)
    setRallyLength(3)
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


  // Aces have their own placements (net cord, out of the court, on the T); other serves keep the general ones
  const serveDirections = (outcome === 'ace' ? ACE_PLACEMENTS : SERVE_PLACEMENTS).map(option => ({
    id: option.id,
    label: t(option.labelKey),
    color: option.color
  }))

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
                  {pointContext.playerNames[pointContext.server]} {t('serving')} ({t(pointContext.serveType === 'first' ? 'firstServe' : 'secondServe').toLowerCase()})
                </Badge>
              </div>
            </div>

            <div data-step-subtitle className="text-sm font-medium text-muted-foreground">{t(STEP_SUBTITLE_KEYS[step] ?? 'selectHowPointEnded')}</div>

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
                  <div className="text-xs text-muted-foreground mt-1">
                    {outcome.description}
                  </div>
                  {/* Own line so the reason wraps inside the card on narrow phones */}
                  {outcome.disabled && (
                    <div data-unavailable-reason className="text-xs text-red-500">
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

            <div data-step-subtitle className="text-sm font-medium text-muted-foreground">{t(STEP_SUBTITLE_KEYS[step] ?? 'selectHowPointEnded')}</div>

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
                  <div className="font-medium">{direction.label}</div>
                </Button>
              ))}
            </div>
          </div>
        )

      case 'serve-speed':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('serveSpeed')}</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {['slow', 'medium', 'fast'].map((speed) => (
                <Button
                  key={speed}
                  variant="outline"
                  size="lg"
                  className={cn(
                    "h-auto p-3 flex items-center justify-center text-center transition-all",
                    speed === 'fast' && "bg-red-500/10 text-red-500 hover:bg-red-500/20",
                    speed === 'medium' && "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
                    speed === 'slow' && "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                  )}
                  onClick={() => handleServeSpeedClick(speed as 'slow' | 'medium' | 'fast')}
                >
                  <div className="font-medium">{t(`customValue_${speed}`)}</div>
                </Button>
              ))}
            </div>
          </div>
        )

      case 'return-quality':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('returnQuality')}</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {['defensive', 'neutral', 'offensive'].map((quality) => (
                <Button
                  key={quality}
                  variant="outline"
                  size="lg"
                  onClick={() => handleReturnQualityClick(quality as 'defensive' | 'neutral' | 'offensive')}
                >
                  <div className="font-medium">{t(`customValue_${quality}`)}</div>
                </Button>
              ))}
            </div>
          </div>
        )

      case 'rally-length':
        return (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('rallyLength')}</h3>
              <div className="text-4xl font-bold font-mono text-primary my-4">
                {rallyLength}
              </div>
            </div>

            <div className="px-4">
              <Slider
                value={[rallyLength]}
                min={1}
                max={30}
                step={1}
                onValueChange={(vals) => handleRallyLengthChange(vals[0])}
              />
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => handleRallyLengthChange(Math.max(1, rallyLength - 1))}>-</Button>
              <Button variant="outline" onClick={() => handleRallyLengthChange(rallyLength + 1)}>+</Button>
            </div>

            <Button className="w-full" size="lg" onClick={handleRallyLengthSubmit}>
              {t('savePoint')}
            </Button>
          </div>
        )

      case 'serve-speed':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('serveSpeed')}</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {['slow', 'medium', 'fast'].map((speed) => (
                <Button
                  key={speed}
                  variant="outline"
                  size="lg"
                  className={cn(
                    "h-auto p-3 flex items-center justify-center text-center transition-all",
                    speed === 'fast' && "bg-red-500/10 text-red-500 hover:bg-red-500/20",
                    speed === 'medium' && "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
                    speed === 'slow' && "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                  )}
                  onClick={() => handleServeSpeedClick(speed as 'slow' | 'medium' | 'fast')}
                >
                  <div className="font-medium">{t(`customValue_${speed}`)}</div>
                </Button>
              ))}
            </div>
          </div>
        )

      case 'return-quality':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('returnQuality')}</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {['defensive', 'neutral', 'offensive'].map((quality) => (
                <Button
                  key={quality}
                  variant="outline"
                  size="lg"
                  onClick={() => handleReturnQualityClick(quality as 'defensive' | 'neutral' | 'offensive')}
                >
                  <div className="font-medium">{t(`customValue_${quality}`)}</div>
                </Button>
              ))}
            </div>
          </div>
        )

      case 'rally-length':
        return (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('rallyLength')}</h3>
              <div className="text-4xl font-bold font-mono text-primary my-4">
                {rallyLength}
              </div>
            </div>

            <div className="px-4">
              <Slider
                value={[rallyLength]}
                min={1}
                max={30}
                step={1}
                onValueChange={(vals) => handleRallyLengthChange(vals[0])}
              />
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => handleRallyLengthChange(Math.max(1, rallyLength - 1))}>-</Button>
              <Button variant="outline" onClick={() => handleRallyLengthChange(rallyLength + 1)}>+</Button>
            </div>

            <Button className="w-full" size="lg" onClick={handleRallyLengthSubmit}>
              {t('savePoint')}
            </Button>
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

            <div data-step-subtitle className="text-sm font-medium text-muted-foreground">{t(STEP_SUBTITLE_KEYS[step] ?? 'selectHowPointEnded')}</div>

            <div className="grid grid-cols-2 gap-2">
              {winnerTypes.map((type) => (
                <Button
                  key={type.id}
                  variant="outline"
                  size="lg"
                  className={cn(
                    "h-auto p-3 flex items-center justify-center text-center transition-all",
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
                  {pointContext.playerNames[pointContext.server]} {t('serving')} ({t(pointContext.serveType === 'first' ? 'firstServe' : 'secondServe').toLowerCase()})
                </Badge>
              </div>
            </div>

            <div data-step-subtitle className="text-sm font-medium text-muted-foreground">{t(STEP_SUBTITLE_KEYS[step] ?? 'selectHowPointEnded')}</div>

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
                  {pointContext.playerNames[pointContext.server]} {t('serving')} ({t(pointContext.serveType === 'first' ? 'firstServe' : 'secondServe').toLowerCase()})
                </Badge>
              </div>
            </div>

            <div data-step-subtitle className="text-sm font-medium text-muted-foreground">{t(STEP_SUBTITLE_KEYS[step] ?? 'selectHowPointEnded')}</div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  "h-auto p-3 flex items-center justify-center text-center transition-all",
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
                  "h-auto p-3 flex items-center justify-center text-center transition-all",
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
