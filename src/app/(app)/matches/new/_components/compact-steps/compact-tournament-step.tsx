"use client"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Trophy, SkipForward, Check } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { motion } from "framer-motion"
import { useState, useRef } from "react"

interface CompactTournamentStepProps {
  value: string
  onChange: (value: string) => void
  onSkip: () => void
  onComplete: () => void
}

export function CompactTournamentStep({ value, onChange, onSkip, onComplete }: CompactTournamentStepProps) {
  const t = useTranslations()
  const [advanceScheduled, setAdvanceScheduled] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scheduleAdvance = () => {
    if (!advanceScheduled) {
      setAdvanceScheduled(true)
      timeoutRef.current = setTimeout(() => {
        onComplete()
      }, 300)
    }
  }

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue)
    if (inputValue.trim().length > 0) {
      scheduleAdvance()
    }
  }

  const handleSkip = () => {
    onSkip()
    scheduleAdvance()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-2"
    >
      <div className="text-left mb-3">
        <h2 className="text-base font-semibold">{t("tournamentLeague")}</h2>
        <p className="text-xs text-muted-foreground">{t("addTournamentOptional")}</p>
      </div>

      <div className="space-y-2.5">
        <div className="space-y-1.5">
          <Label htmlFor="tournament-name" className="text-xs font-medium">
            {t('tournamentName')}
          </Label>
          <div className="relative">
            <input
              id="tournament-name"
              type="text"
              value={value}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={t('enterTournamentName')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {value.trim().length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <Check className="h-4 w-4 text-green-500" />
              </motion.div>
            )}
          </div>
        </div>
        
        <div className="flex justify-start pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground -ml-2"
          >
            <SkipForward className="h-3 w-3" />
            {t('skipTournament')}
          </Button>
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-2.5 border mt-3">
        <div className="flex items-start gap-2">
          <Trophy className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">
              {t('tournamentOptionalDescription')}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}