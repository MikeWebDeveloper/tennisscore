"use client"

import { Label } from "@/components/ui/label"
import { Trophy, SkipForward } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface TournamentStepProps {
  value: string
  onChange: (value: string) => void
  onSkip: () => void
}

export function TournamentStep({ value, onChange, onSkip }: TournamentStepProps) {
  const t = useTranslations()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">{t("tournamentLeague")}</h2>
        <p className="text-muted-foreground">{t("addTournamentOptional")}</p>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tournament-name" className="text-sm font-medium">
            {t('tournamentName')}
          </Label>
          <input
            id="tournament-name"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t('enterTournamentName')}
            className="flex h-12 w-full rounded-lg border border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        
        <div className="flex justify-center pt-4">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <SkipForward className="h-4 w-4" />
            {t('skipTournament')}
          </Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="bg-muted/30 rounded-lg p-4 border">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">
                {t('tournamentOptionalDescription')}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}