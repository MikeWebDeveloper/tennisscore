"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { PointOutcome } from "@/lib/types"

interface SimpleStatsPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (outcome: PointOutcome) => void
  playerWinning: string
}

const pointOutcomes: { value: PointOutcome; label: string }[] = [
  { value: "winner", label: "Winner" },
  { value: "ace", label: "Ace" },
  { value: "unforced_error", label: "Unforced Error" },
  { value: "double_fault", label: "Double Fault" },
]

export function SimpleStatsPopup({
  open,
  onOpenChange,
  onSave,
  playerWinning,
}: SimpleStatsPopupProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<PointOutcome>("winner")

  const handleSave = () => {
    onSave(selectedOutcome)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Point to {playerWinning}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup
            value={selectedOutcome}
            onValueChange={(value: PointOutcome) => setSelectedOutcome(value)}
            className="space-y-2"
          >
            {pointOutcomes.map((outcome) => (
              <Label
                key={outcome.value}
                htmlFor={outcome.value}
                className="flex items-center justify-between rounded-md border p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary"
              >
                {outcome.label}
                <RadioGroupItem value={outcome.value} id={outcome.value} />
              </Label>
            ))}
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="w-full">
            Save Point
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 