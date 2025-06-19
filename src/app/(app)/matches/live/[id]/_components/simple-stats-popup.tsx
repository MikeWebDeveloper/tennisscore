"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PointOutcome } from "@/lib/types"

interface SimpleStatsPopupProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSelectOutcome: (outcome: PointOutcome) => void
  serveType: "first" | "second"
}

export function SimpleStatsPopup({
  isOpen,
  onOpenChange,
  onSelectOutcome,
  serveType,
}: SimpleStatsPopupProps) {
  const handleSelect = (outcome: PointOutcome) => {
    onSelectOutcome(outcome)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>How did the point end?</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          <Button
            variant="outline"
            className="h-16 text-base"
            onClick={() => handleSelect("ace")}
          >
            Ace
          </Button>
          <Button
            variant="outline"
            className="h-16 text-base"
            onClick={() => handleSelect("winner")}
          >
            Winner
          </Button>
          <Button
            variant="outline"
            className="h-16 text-base"
            onClick={() => handleSelect("unforced_error")}
          >
            Unforced Error
          </Button>
          {serveType === "second" ? (
            <Button
              variant="destructive"
              className="h-16 text-base"
              onClick={() => handleSelect("double_fault")}
            >
              Double Fault
            </Button>
          ) : (
            <Button
              variant="outline"
              className="h-16 text-base"
              onClick={() => handleSelect("forced_error")}
            >
              Forced Error
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 