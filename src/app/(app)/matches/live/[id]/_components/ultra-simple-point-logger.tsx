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
  
  // Flow state: 'outcome' -> 'winner-type' -> 'side' -> done
  const [step, setStep] = useState<'outcome' | 'winner-type' | 'side'>('outcome')
  const [outcome, setOutcome] = useState<PointOutcome | null>(null)
  const [winnerType, setWinnerType] = useState<ShotType | null>(null)

  const handleOutcomeClick = (selectedOutcome: PointOutcome) => {
    setOutcome(selectedOutcome)
    
    // If it's ace or double fault, save immediately (1 click)
    if (selectedOutcome === 'ace' || selectedOutcome === 'double_fault') {
      const pointDetail: Partial<PointDetail> = {
        serveType: pointContext.serveType,
        serveOutcome: selectedOutcome,
        servePlacement: "t",
        rallyLength: 1,
        pointOutcome: selectedOutcome,
        lastShotType: 'serve',
        lastShotPlayer: pointContext.winner,
        courtPosition: "deuce",
      }
      onSave(pointDetail)
      onOpenChange(false)
      resetState()
      return
    }
    
    // For other outcomes, go to winner type
    setStep('winner-type')
  }

  const handleWinnerTypeClick = (shotType: ShotType) => {
    setWinnerType(shotType)
    setStep('side')
  }

  const handleSideClick = (side: 'deuce' | 'ad') => {
    if (!outcome || !winnerType) return
    
    const pointDetail: Partial<PointDetail> = {
      serveType: pointContext.serveType,
      serveOutcome: outcome === 'ace' ? 'ace' : outcome === 'double_fault' ? 'double_fault' : 'winner',
      servePlacement: "t",
      rallyLength: outcome === 'ace' || outcome === 'double_fault' ? 1 : 3,
      pointOutcome: outcome,
      lastShotType: winnerType,
      lastShotPlayer: pointContext.winner,
      courtPosition: side,
    }
    
    onSave(pointDetail)
    onOpenChange(false)
    resetState()
  }

  const resetState = () => {
    setStep('outcome')
    setOutcome(null)
    setWinnerType(null)
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

  const winnerTypes = [
    {
      id: 'serve' as const,
      label: t('serve'),
      color: 'bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600',
      textColor: 'text-white'
    },
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

  const sides = [
    {
      id: 'deuce' as const,
      label: t('deuceSide'),
      color: 'bg-gradient-to-r from-indigo-400 to-purple-500 hover:from-indigo-500 hover:to-purple-600',
      textColor: 'text-white'
    },
    {
      id: 'ad' as const,
      label: t('adSide'),
      color: 'bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600',
      textColor: 'text-white'
    }
  ]

  const renderStep = () => {
    switch (step) {
      case 'outcome':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">{t('howDidTheyWin')}</h3>
              <p className="text-muted-foreground">{pointContext.playerNames[pointContext.winner]} {t('wins')}</p>
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

      case 'winner-type':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">{t('lastShotType')}</h3>
              <p className="text-muted-foreground">{t('whatShotWasIt')}</p>
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

      case 'side':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">{t('courtSide')}</h3>
              <p className="text-muted-foreground">{t('whichSideOfCourt')}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {sides.map((side) => (
                <motion.div
                  key={side.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    className={cn(
                      "w-full h-16 text-lg font-semibold shadow-lg transition-all duration-200",
                      side.color,
                      side.textColor
                    )}
                    onClick={() => handleSideClick(side.id)}
                  >
                    {side.label}
                  </Button>
                </motion.div>
              ))}
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
        <SheetHeader className="pb-6">
          <SheetTitle className="text-center text-xl">
            {t('point')} #{pointContext.pointNumber}
          </SheetTitle>
          <div className="text-center text-sm text-muted-foreground">
            {t('set')} {pointContext.setNumber} • {t('game')} {pointContext.gameNumber} • {pointContext.gameScore}
          </div>
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