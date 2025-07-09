"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/hooks/use-translations"

interface SimpleStatsPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (outcome: SimplePointOutcome) => void
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
  const { winner, server, serveType } = pointContext
  const t = useTranslations()
  
  // Conditional logic for disabled buttons
  const isAceDisabled = winner !== server
  const isDoubleFaultDisabled = serveType === 'first' || winner === server

  const handleOutcomeClick = (outcome: SimplePointOutcome) => {
    // Immediately save and close
    onSave(outcome)
    onOpenChange(false)
  }

  const outcomes = [
    {
      id: 'ace' as const,
      label: t('aces'),
      disabled: isAceDisabled,
      color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20'
    },
    {
      id: 'winner' as const,
      label: t('winner'),
      disabled: false,
      color: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
    },
    {
      id: 'forced_error' as const,
      label: t('forcedError'),
      disabled: false,
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20'
    },
    {
      id: 'unforced_error' as const,
      label: t('unforcedError'),
      disabled: false,
      color: 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20'
    },
    {
      id: 'double_fault' as const,
      label: t('doubleFaults'),
      disabled: isDoubleFaultDisabled,
      color: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">{t('selectHowPointEnded')}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 p-6">
          {outcomes
            .filter(outcome => !outcome.disabled)
            .map((outcome) => (
              <Button
                key={outcome.id}
                variant="outline"
                size="lg"
                className={cn(
                  "h-12 justify-center text-base font-medium transition-all",
                  outcome.color
                )}
                onClick={() => handleOutcomeClick(outcome.id)}
              >
                {outcome.label}
              </Button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  )
} 