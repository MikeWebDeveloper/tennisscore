"use client"

import { useTranslations } from "@/i18n"
import { motion } from '@/lib/framer-motion-config'
import { Button } from "@/components/ui/button"
import type { SetFormat } from "@/lib/utils/match-format"

interface CompactFormatStepProps {
  setFormat: SetFormat
  sets: 1 | 3 | 5 | null
  scoring: "ad" | "no-ad" | ""
  finalSet: "full" | "super-tb" | ""
  onSetFormatChange: (value: SetFormat) => void
  onSetsChange: (value: 1 | 3 | 5) => void
  onScoringChange: (value: "ad" | "no-ad") => void
  onFinalSetChange: (value: "full" | "super-tb") => void
  onComplete: () => void
}

export function CompactFormatStep({
  setFormat,
  onSetFormatChange,
  sets,
  scoring,
  finalSet,
  onSetsChange,
  onScoringChange,
  onFinalSetChange,
  onComplete
}: CompactFormatStepProps) {
  const t = useTranslations('common')
  const allSelected = sets !== null && scoring !== "" && finalSet !== ""

  const setOptions = [
    { value: 1, label: t("bestOf1") },
    { value: 3, label: t("bestOf3") },
    { value: 5, label: t("bestOf5") }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-2"
    >
      <div className="text-left mb-3">
        <h2 className="text-base font-semibold">{t("matchFormat")}</h2>
        <p className="text-xs text-muted-foreground">{t("selectMatchRules")}</p>
      </div>

      <div className="space-y-3">
        {/* Set length defaults to Standard. */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t("setLength")}</label>
          <div className="grid grid-cols-2 gap-1.5">
            {([
              ["standard", t("setFormatStandard")],
              ["short", t("setFormatShort")],
              ["fast4", t("setFormatFast4")],
              ["pro", t("setFormatPro")],
            ] as const).map(([value, label]) => (
              <motion.button
                key={value}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSetFormatChange(value)}
                aria-pressed={setFormat === value}
                className={`
                  p-1.5 rounded-md border text-center transition-all duration-200
                  ${setFormat === value
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <div className="text-sm">{label}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Sets Selection */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t("numberOfSets")}</label>
          <div className="grid grid-cols-3 gap-1.5">
            {setOptions.map((option) => (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSetsChange(option.value as 1 | 3 | 5)}
                className={`
                  p-1.5 rounded-md border text-center transition-all duration-200
                  ${sets === option.value
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <div className="text-sm">{option.label}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Scoring System */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t("scoringSystem")}</label>
          <div className="grid grid-cols-2 gap-1.5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onScoringChange("ad")}
              className={`
                p-1.5 rounded-md border transition-all duration-200
                ${scoring === "ad"
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-border hover:border-primary/50'
                }
              `}
            >
              <div className="text-sm">{t("advantage")}</div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onScoringChange("no-ad")}
              className={`
                p-1.5 rounded-md border transition-all duration-200
                ${scoring === "no-ad"
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-border hover:border-primary/50'
                }
              `}
            >
              <div className="text-sm">{t("noAdvantage")}</div>
            </motion.button>
          </div>
        </div>

        {/* Final Set */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t("finalSet")}</label>
          <div className="grid grid-cols-2 gap-1.5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onFinalSetChange("full")}
              className={`
                p-1.5 rounded-md border transition-all duration-200
                ${finalSet === "full"
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-border hover:border-primary/50'
                }
              `}
            >
              <div className="text-sm">{t("fullSet")}</div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onFinalSetChange("super-tb")}
              className={`
                p-1.5 rounded-md border transition-all duration-200
                ${finalSet === "super-tb"
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-border hover:border-primary/50'
                }
              `}
            >
              <div className="text-sm">{t("superTiebreak")}</div>
            </motion.button>
          </div>
        </div>
      </div>
      <Button type="button" className="mt-4 w-full" disabled={!allSelected} onClick={onComplete}>
        {t('continue')}
      </Button>
    </motion.div>
  )
}
