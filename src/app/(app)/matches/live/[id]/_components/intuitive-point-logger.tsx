"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { PointDetail, PointOutcome } from "@/lib/types"
import { AlertTriangle } from "lucide-react"
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
  
  // Validation
  const [validationError, setValidationError] = useState<string>("")

  // Reset form when opening
  useEffect(() => {
    if (open) {
      setValidationError("")
    }
  }, [open])

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
    
    // Validate the selection
    let error = ""
    if (outcome === "double_fault") {
      if (pointContext.serveType !== "second") {
        error = t('doubleFaultSecondServeError')
      } else if (pointContext.winner === pointContext.server) {
        error = t('doubleFaultReceiverError')
      }
    }
    
    if (outcome === "ace") {
      if (pointContext.winner !== pointContext.server) {
        error = t('aceServerError')
      }
    }

    if (error) {
      setValidationError(error)
      return
    }

    // Create point detail and save immediately
    const pointDetail: Partial<PointDetail> = {
      serveType: pointContext.serveType,
      serveOutcome: outcome === 'ace' ? 'ace' : outcome === 'double_fault' ? 'double_fault' : 'winner',
      servePlacement: "wide", // Default
      rallyLength: outcome === 'ace' || outcome === 'double_fault' ? 1 : 1,
      pointOutcome: outcome,
      lastShotType: outcome === 'ace' || outcome === 'double_fault' ? 'serve' : 'forehand',
      lastShotPlayer: pointContext.winner,
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-center">
            {t('howDidTheyWin')}
          </SheetTitle>
          <div className="text-sm text-muted-foreground text-center">
            {pointContext.playerNames[pointContext.winner]} {t('wins')}
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
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}