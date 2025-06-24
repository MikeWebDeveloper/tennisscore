"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  const { winner, server, serveType, playerNames } = pointContext
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
      id: 'winner' as const,
      label: 'Winner',
      description: 'Clean winner',
      disabled: false,
      color: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
    },
    {
      id: 'ace' as const,
      label: 'Ace',
      description: 'Unreturnable serve',
      disabled: isAceDisabled,
      color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20'
    },
    {
      id: 'forced_error' as const,
      label: 'Forced Error',
      description: 'Opponent forced into error',
      disabled: false,
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20'
    },
    {
      id: 'unforced_error' as const,
      label: 'Unforced Error',
      description: 'Unforced mistake',
      disabled: false,
      color: 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20'
    },
    {
      id: 'double_fault' as const,
      label: 'Double Fault',
      description: 'Two consecutive faults',
      disabled: isDoubleFaultDisabled,
      color: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
    }
  ]

  const winnerName = winner === 'p1' ? playerNames.p1 : playerNames.p2
  const serverName = server === 'p1' ? playerNames.p1 : playerNames.p2

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {t('point')} #{pointContext.pointNumber} {t('details')}
          </DialogTitle>
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>{t('set')} {pointContext.setNumber}, {t('game')} {pointContext.gameNumber} • {pointContext.gameScore}</p>
            <p>
              <Badge variant="outline" className="mr-2">
{winnerName} {t('winsPoint')}
              </Badge>
              <Badge variant="secondary">
{serverName} {t('serving')} ({serveType})
              </Badge>
            </p>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
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
                      {outcome.id === 'ace' && '(Server must win for ace)'}
                      {outcome.id === 'double_fault' && '(Only on 2nd serve loss)'}
                    </span>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 