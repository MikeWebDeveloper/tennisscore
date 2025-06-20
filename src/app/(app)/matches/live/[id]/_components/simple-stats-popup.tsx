"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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
  const [selectedOutcome, setSelectedOutcome] = useState<SimplePointOutcome>('winner')

  const { winner, server, serveType, playerNames } = pointContext
  
  // Conditional logic for disabled buttons
  const isAceDisabled = winner !== server
  const isDoubleFaultDisabled = serveType === 'first' || winner === server

  const outcomes = [
    {
      id: 'winner' as const,
      label: 'Winner',
      description: 'Clean winner',
      disabled: false,
      color: 'bg-green-500/10 text-green-500 border-green-500/20'
    },
    {
      id: 'ace' as const,
      label: 'Ace',
      description: 'Unreturnable serve',
      disabled: isAceDisabled,
      color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    },
    {
      id: 'forced_error' as const,
      label: 'Forced Error',
      description: 'Opponent forced into error',
      disabled: false,
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    },
    {
      id: 'unforced_error' as const,
      label: 'Unforced Error',
      description: 'Unforced mistake',
      disabled: false,
      color: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    },
    {
      id: 'double_fault' as const,
      label: 'Double Fault',
      description: 'Two consecutive faults',
      disabled: isDoubleFaultDisabled,
      color: 'bg-red-500/10 text-red-500 border-red-500/20'
    }
  ]

  const handleSave = () => {
    onSave(selectedOutcome)
    onOpenChange(false)
    setSelectedOutcome('winner') // Reset for next time
  }

  const winnerName = winner === 'p1' ? playerNames.p1 : playerNames.p2
  const serverName = server === 'p1' ? playerNames.p1 : playerNames.p2

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Point #{pointContext.pointNumber} Details
          </DialogTitle>
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Set {pointContext.setNumber}, Game {pointContext.gameNumber} • {pointContext.gameScore}</p>
            <p>
              <Badge variant="outline" className="mr-2">
                {winnerName} wins point
              </Badge>
              <Badge variant="secondary">
                {serverName} serving ({serveType})
              </Badge>
            </p>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm font-medium">How did the point end?</div>
          
          <div className="grid grid-cols-1 gap-2">
            {outcomes.map((outcome) => (
              <Button
                key={outcome.id}
                variant="outline"
                size="lg"
                disabled={outcome.disabled}
                className={cn(
                  "h-auto p-4 flex flex-col items-start text-left transition-all",
                  selectedOutcome === outcome.id && !outcome.disabled && outcome.color,
                  outcome.disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !outcome.disabled && setSelectedOutcome(outcome.id)}
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

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="flex-1"
            >
              Save Point
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 