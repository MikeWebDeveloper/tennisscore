"use client"

import { Users, User } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { motion } from "framer-motion"

interface CompactMatchTypeStepProps {
  value: "singles" | "doubles"
  onChange: (value: "singles" | "doubles") => void
}

export function CompactMatchTypeStep({ value, onChange }: CompactMatchTypeStepProps) {
  const t = useTranslations()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">{t("matchType")}</h2>
        <p className="text-sm text-muted-foreground">{t("chooseMatchFormat")}</p>
      </div>

      <div className="space-y-3">
        {/* Singles Option */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange("singles")}
          className={`
            p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200
            ${value === "singles" 
              ? 'border-primary bg-primary/5 shadow-lg' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }
          `}
        >
          <div className="flex items-center space-x-4">
            <div className={`
              p-3 rounded-full transition-colors
              ${value === "singles" ? 'bg-primary text-primary-foreground' : 'bg-muted'}
            `}>
              <User className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold">{t('singles')}</div>
              <div className="text-sm text-muted-foreground">{t('oneVsOne')}</div>
            </div>
            {value === "singles" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"
              >
                <div className="w-2 h-2 bg-primary-foreground rounded-full" />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Doubles Option */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange("doubles")}
          className={`
            p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200
            ${value === "doubles" 
              ? 'border-primary bg-primary/5 shadow-lg' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }
          `}
        >
          <div className="flex items-center space-x-4">
            <div className={`
              p-3 rounded-full transition-colors
              ${value === "doubles" ? 'bg-primary text-primary-foreground' : 'bg-muted'}
            `}>
              <Users className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold">{t('doubles')}</div>
              <div className="text-sm text-muted-foreground">{t('twoVsTwo')}</div>
            </div>
            {value === "doubles" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"
              >
                <div className="w-2 h-2 bg-primary-foreground rounded-full" />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}