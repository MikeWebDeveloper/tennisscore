"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { PointDetail, PointOutcome, ShotType } from "@/lib/types"
import { useTranslations } from "@/hooks/use-translations"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

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
  const t = useTranslations()
  
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
    
    // If it's ace or double fault, go to serve direction
    if (selectedOutcome === 'ace' || selectedOutcome === 'double_fault') {
      setStep('serve-direction')
      return
    }
    
    // For other outcomes, go to winner type
    setStep('winner-type')
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
    }
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
      servePlacement: "wide", // Default serve placement
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

  const outcomes = [
    {
      id: 'ace' as const,
      label: t('ace'),
      color: 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600',
      textColor: 'text-white',
      disabled: pointContext.winner !== pointContext.server
    },
    {
      id: 'winner' as const,
      label: t('winner'),
      color: 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600',
      textColor: 'text-white',
      disabled: false
    },
    {
      id: 'forced_error' as const,
      label: t('forcedError'),
      color: 'bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600',
      textColor: 'text-white',
      disabled: false
    },
    {
      id: 'unforced_error' as const,
      label: t('unforcedError'),
      color: 'bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600',
      textColor: 'text-white',
      disabled: false
    },
    {
      id: 'double_fault' as const,
      label: t('doubleFault'),
      color: 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700',
      textColor: 'text-white',
      disabled: pointContext.serveType !== "second" || pointContext.winner === pointContext.server
    }
  ]

  // Shot types excluding serve (since serve winners should be classified as Ace)
  const winnerTypes = [
    {
      id: 'forehand' as const,
      label: t('forehand'),
      color: 'bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600',
      textColor: 'text-white'
    },
    {
      id: 'backhand' as const,
      label: t('backhand'),
      color: 'bg-gradient-to-r from-red-400 to-rose-500 hover:from-red-500 hover:to-rose-600',
      textColor: 'text-white'
    },
    {
      id: 'volley' as const,
      label: t('volley'),
      color: 'bg-gradient-to-r from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600',
      textColor: 'text-white'
    },
    {
      id: 'overhead' as const,
      label: t('overhead'),
      color: 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600',
      textColor: 'text-white'
    }
  ]


  const serveDirections = [
    {
      id: 'wide' as const,
      label: t('wide'),
      color: 'bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600',
      textColor: 'text-white'
    },
    {
      id: 'body' as const,
      label: t('body'),
      color: 'bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600',
      textColor: 'text-white'
    },
    {
      id: 't' as const,
      label: t('tDownTheMiddle'),
      color: 'bg-gradient-to-r from-violet-400 to-purple-500 hover:from-violet-500 hover:to-purple-600',
      textColor: 'text-white'
    }
  ]

  const getShotDirections = () => {
    if (outcome === 'winner') {
      return [
        {
          id: 'cross' as const,
          label: t('crossCourt'),
          color: 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600',
          textColor: 'text-white'
        },
        {
          id: 'line' as const,
          label: t('downTheLine'),
          color: 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600',
          textColor: 'text-white'
        },
        {
          id: 'body' as const,
          label: t('bodyShot'),
          color: 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600',
          textColor: 'text-white'
        }
      ]
    } else if (outcome === 'unforced_error' || outcome === 'forced_error') {
      return [
        {
          id: 'long' as const,
          label: t('long'),
          color: 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600',
          textColor: 'text-white'
        },
        {
          id: 'wide' as const,
          label: t('wide'),
          color: 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600',
          textColor: 'text-white'
        },
        {
          id: 'net' as const,
          label: t('net'),
          color: 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600',
          textColor: 'text-white'
        }
      ]
    }
    return []
  }

  const renderStep = () => {
    switch (step) {
      case 'outcome':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">{t('howDidTheyWin')}</h3>
              <span className="text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 block mt-1">
                {pointContext.playerNames[pointContext.winner]} {t('wins')}
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {outcomes.map((outcome) => (
                <motion.div
                  key={outcome.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    disabled={outcome.disabled}
                    className={cn(
                      "w-full h-16 text-lg font-semibold shadow-lg transition-all duration-200",
                      outcome.color,
                      outcome.textColor,
                      outcome.disabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => handleOutcomeClick(outcome.id)}
                  >
                    {outcome.label}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )

      case 'serve-direction':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">{t('servePlacement')}</h3>
              <span className="text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 block mt-1">
                {pointContext.playerNames[pointContext.winner]} {t('wins')}
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {serveDirections.map((direction) => (
                <motion.div
                  key={direction.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    className={cn(
                      "w-full h-16 text-lg font-semibold shadow-lg transition-all duration-200",
                      direction.color,
                      direction.textColor
                    )}
                    onClick={() => handleServeDirectionClick(direction.id)}
                  >
                    {direction.label}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )

      case 'winner-type':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">{t('lastShotType')}</h3>
              <span className="text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 block mt-1">
                {pointContext.playerNames[pointContext.winner]} {t('wins')}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {winnerTypes.map((type) => (
                <motion.div
                  key={type.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    className={cn(
                      "w-full h-16 text-lg font-semibold shadow-lg transition-all duration-200",
                      type.color,
                      type.textColor
                    )}
                    onClick={() => handleWinnerTypeClick(type.id)}
                  >
                    {type.label}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )

      case 'shot-direction':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">{t('shotDirection')}</h3>
              <span className="text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 block mt-1">
                {pointContext.playerNames[pointContext.winner]} {t('wins')}
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {getShotDirections().map((direction) => (
                <motion.div
                  key={direction.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    className={cn(
                      "w-full h-16 text-lg font-semibold shadow-lg transition-all duration-200",
                      direction.color,
                      direction.textColor
                    )}
                    onClick={() => handleShotDirectionClick(direction.id)}
                  >
                    {direction.label}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )

      case 'return-type':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">{t('wasItReturn')}</h3>
              <span className="text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 block mt-1">
                {pointContext.playerNames[pointContext.winner]} {t('wins')}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  className={cn(
                    "w-full h-16 text-lg font-semibold shadow-lg transition-all duration-200",
                    "bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600",
                    "text-white"
                  )}
                  onClick={() => handleReturnTypeClick('regular')}
                >
                  {t('regular')}
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  className={cn(
                    "w-full h-16 text-lg font-semibold shadow-lg transition-all duration-200",
                    "bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600",
                    "text-white"
                  )}
                  onClick={() => handleReturnTypeClick('return')}
                >
                  {t('return')}
                </Button>
              </motion.div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Sheet open={open} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) resetState()
    }}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader className="pb-2">
          <SheetTitle className="sr-only">
            {t('pointDetails')}
          </SheetTitle>
        </SheetHeader>

        <Card className="border-0 shadow-none">
          <CardContent className="p-6">
            {renderStep()}
          </CardContent>
        </Card>
      </SheetContent>
    </Sheet>
  )
}