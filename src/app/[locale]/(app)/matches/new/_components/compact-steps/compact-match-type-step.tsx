"use client"

import { Users } from "lucide-react"
import { User } from "lucide-react"
import { useTranslations } from "@/i18n"
import { motion } from '@/lib/framer-motion-config'
import { useRef, useState } from "react"

interface CompactMatchTypeStepProps {
  onChange: (value: "singles" | "doubles") => void
}

export function CompactMatchTypeStep({ onChange, onComplete }: CompactMatchTypeStepProps & { onComplete: () => void }) {
  const t = useTranslations('common')
  const [selected, setSelected] = useState<"singles" | "doubles" | null>(null)
  const completed = useRef(false)

  const handleSelect = (val: "singles" | "doubles") => {
    if (completed.current) return
    completed.current = true
    setSelected(val)
    onChange(val)
    onComplete()
  }

  return (
    <motion.div
      className="p-2"
    >
      <div className="text-left mb-3">
        <h2 className="text-base font-semibold">{t("matchType")}</h2>
        <p className="text-xs text-muted-foreground">{t("chooseMatchFormat")}</p>
      </div>

      <div className="space-y-2">
        {/* Singles Option */}
        <motion.button
          type="button"
          aria-pressed={selected === "singles"}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => handleSelect("singles")}
          className={`
            w-full p-3 rounded-lg border text-left cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
            ${selected === "singles" 
              ? 'border-primary bg-primary/10' 
              : 'border-border hover:border-primary/50'
            }
          `}
        >
          <div className="flex items-center space-x-3">
            <div className={`
              p-1.5 rounded-md transition-colors
              ${selected === "singles" ? 'bg-primary text-primary-foreground' : 'bg-muted'}
            `}>
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{t('singles')}</div>
              <div className="text-xs text-muted-foreground">{t('oneVsOne')}</div>
            </div>
            {selected === "singles" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 bg-primary rounded-full"
              />
            )}
          </div>
        </motion.button>

        {/* Doubles Option */}
        <motion.button
          type="button"
          aria-pressed={selected === "doubles"}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => handleSelect("doubles")}
          className={`
            w-full p-3 rounded-lg border text-left cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
            ${selected === "doubles" 
              ? 'border-primary bg-primary/10' 
              : 'border-border hover:border-primary/50'
            }
          `}
        >
          <div className="flex items-center space-x-3">
            <div className={`
              p-1.5 rounded-md transition-colors
              ${selected === "doubles" ? 'bg-primary text-primary-foreground' : 'bg-muted'}
            `}>
              <Users className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{t('doubles')}</div>
              <div className="text-xs text-muted-foreground">{t('twoVsTwo')}</div>
            </div>
            {selected === "doubles" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 bg-primary rounded-full"
              />
            )}
          </div>
        </motion.button>
      </div>
    </motion.div>
  )
}
