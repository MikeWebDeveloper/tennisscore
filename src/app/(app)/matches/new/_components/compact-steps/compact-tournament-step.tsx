"use client"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Trophy, SkipForward, Check } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { motion } from "framer-motion"

interface CompactTournamentStepProps {
  value: string
  onChange: (value: string) => void
  onSkip: () => void
  onComplete: () => void
}

export function CompactTournamentStep({ value, onChange, onSkip, onComplete }: CompactTournamentStepProps) {
  const t = useTranslations()

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue)
    if (inputValue.trim().length > 0) {
      // Auto-advance when user starts typing
      setTimeout(() => onComplete(), 1500)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2">{t("tournamentLeague")}</h2>
        <p className="text-sm text-muted-foreground">{t("addTournamentOptional")}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tournament-name" className="text-sm font-medium">
            {t('tournamentName')}
          </Label>
          <div className="relative">
            <input
              id="tournament-name"
              type="text"
              value={value}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={t('enterTournamentName')}
              className="flex h-12 w-full rounded-lg border border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
        
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <SkipForward className="h-4 w-4" />
            {t('skipTournament')}
          </Button>
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-3 border">
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
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