"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Settings, Clock, Zap } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { motion } from "framer-motion"

interface FormatStepProps {
  sets: number[]
  scoring: "ad" | "no-ad"
  finalSet: "full" | "super-tb"
  onSetsChange: (value: number[]) => void
  onScoringChange: (value: "ad" | "no-ad") => void
  onFinalSetChange: (value: "full" | "super-tb") => void
}

export function FormatStep({
  sets,
  scoring,
  finalSet,
  onSetsChange,
  onScoringChange,
  onFinalSetChange
}: FormatStepProps) {
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

  const getSetsLabel = (value: number) => {
    switch (value) {
      case 1: return t("bestOf1")
      case 3: return t("bestOf3")
      case 5: return t("bestOf5")
      default: return `Best of ${value}`
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Settings className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">{t("matchFormat")}</h2>
        <p className="text-muted-foreground">{t("configureMatchSettings")}</p>
      </motion.div>

      {/* Sets */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="space-y-3">
          <Label className="text-base font-medium">{t("numberOfSets")}</Label>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">
              {getSetsLabel(sets[0])}
            </div>
          </div>
          <Slider
            value={sets}
            onValueChange={onSetsChange}
            min={1}
            max={5}
            step={2}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground px-2">
            <span>{t('bestOf1')}</span>
            <span>{t('bestOf3')}</span>
            <span>{t('bestOf5')}</span>
          </div>
        </div>
      </motion.div>

      {/* Scoring System */}
      <motion.div variants={itemVariants} className="space-y-4">
        <Label className="text-base font-medium">{t("scoringSystem")}</Label>
        <RadioGroup value={scoring} onValueChange={onScoringChange}>
          <div className="space-y-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Label 
                htmlFor="ad" 
                className={`
                  flex items-center space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${scoring === "ad" 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                <RadioGroupItem value="ad" id="ad" />
                <div className="flex items-center space-x-3 flex-1">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{t("advantage")}</div>
                    <div className="text-sm text-muted-foreground">{t("traditionalScoring")}</div>
                  </div>
                </div>
              </Label>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Label 
                htmlFor="no-ad" 
                className={`
                  flex items-center space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${scoring === "no-ad" 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                <RadioGroupItem value="no-ad" id="no-ad" />
                <div className="flex items-center space-x-3 flex-1">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{t("noAdvantage")}</div>
                    <div className="text-sm text-muted-foreground">{t("fasterGameplay")}</div>
                  </div>
                </div>
              </Label>
            </motion.div>
          </div>
        </RadioGroup>
      </motion.div>

      {/* Final Set */}
      <motion.div variants={itemVariants} className="space-y-4">
        <Label className="text-base font-medium">{t("finalSet")}</Label>
        <RadioGroup value={finalSet} onValueChange={onFinalSetChange}>
          <div className="space-y-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Label 
                htmlFor="full" 
                className={`
                  flex items-center space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${finalSet === "full" 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                <RadioGroupItem value="full" id="full" />
                <div className="flex items-center space-x-3 flex-1">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{t("fullSet")}</div>
                    <div className="text-sm text-muted-foreground">{t("traditionalFinalSet")}</div>
                  </div>
                </div>
              </Label>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Label 
                htmlFor="super-tb" 
                className={`
                  flex items-center space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${finalSet === "super-tb" 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                <RadioGroupItem value="super-tb" id="super-tb" />
                <div className="flex items-center space-x-3 flex-1">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{t("superTiebreak")}</div>
                    <div className="text-sm text-muted-foreground">{t("quickerFinish")}</div>
                  </div>
                </div>
              </Label>
            </motion.div>
          </div>
        </RadioGroup>
      </motion.div>
    </motion.div>
  )
}