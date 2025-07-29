"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MatchFormat } from "@/lib/types"
import { useTranslations } from "@/i18n"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { updateMatchFormat } from "@/lib/actions/matches"

interface MatchForSettings {
  $id: string
  matchFormat: string
}

interface MatchSettingsDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  match: MatchForSettings
}

export function MatchSettingsDialog({ isOpen, onOpenChange, match }: MatchSettingsDialogProps) {
  const t = useTranslations('common')
  const [loading, setLoading] = useState(false)
  
  // Parse match format from JSON string
  const parsedMatchFormat = (() => {
    try {
      return JSON.parse(match.matchFormat)
    } catch (error) {
      console.error("Failed to parse match format:", error)
      return {
        sets: 3,
        noAd: false,
        finalSetTiebreak: "standard"
      }
    }
  })()
  
  const [format, setFormat] = useState<MatchFormat>(parsedMatchFormat)

  useEffect(() => {
    const parsed = (() => {
      try {
        return JSON.parse(match.matchFormat)
      } catch (error) {
        console.error("Failed to parse match format:", error)
        return {
          sets: 3,
          noAd: false,
          finalSetTiebreak: "standard"
        }
      }
    })()
    setFormat(parsed)
  }, [match.matchFormat, isOpen])

  const handleSave = async () => {
    setLoading(true)
    const result = await updateMatchFormat(match.$id, format)
    setLoading(false)

    if (result.error) {
      toast.error(t('failedToUpdateSettings'))
    } else {
      toast.success(t('settingsUpdatedSuccessfully'))
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('matchSettings')}</DialogTitle>
          <DialogDescription>{t('adjustMatchSettingsDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Number of Sets */}
          <div className="space-y-3">
            <Label>{t('numberOfSets')}</Label>
            <RadioGroup
              value={String(format.sets)}
              onValueChange={(value) => setFormat({ ...format, sets: Number(value) as 1 | 3 | 5 })}
              className="grid grid-cols-3 gap-2"
            >
              {[1, 3, 5].map(num => (
                <Label key={num} className={`relative flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all ${format.sets === num ? 'border-primary bg-primary/10' : ''}`}>
                  <RadioGroupItem value={String(num)} className="sr-only" />
                  <span>{num === 1 ? t('bestOf1') : num === 3 ? t('bestOf3') : t('bestOf5')}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Scoring System */}
          <div className="space-y-3">
            <Label>{t('scoringSystem')}</Label>
            <RadioGroup
              value={format.noAd ? "no-ad" : "ad"}
              onValueChange={(value) => setFormat({ ...format, noAd: value === 'no-ad' })}
              className="grid grid-cols-2 gap-2"
            >
              <Label className={`relative flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all ${!format.noAd ? 'border-primary bg-primary/10' : ''}`}>
                <RadioGroupItem value="ad" className="sr-only" />
                <span>{t('advantage')}</span>
              </Label>
              <Label className={`relative flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all ${format.noAd ? 'border-primary bg-primary/10' : ''}`}>
                <RadioGroupItem value="no-ad" className="sr-only" />
                <span>{t('noAdvantage')}</span>
              </Label>
            </RadioGroup>
          </div>

          {/* Final Set */}
          <div className="space-y-3">
            <Label>{t('finalSet')}</Label>
            <RadioGroup
              value={format.finalSetTiebreak}
              onValueChange={(value) => setFormat({ ...format, finalSetTiebreak: value as 'standard' | 'super' })}
              className="grid grid-cols-2 gap-2"
            >
              <Label className={`relative flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all ${format.finalSetTiebreak === 'standard' ? 'border-primary bg-primary/10' : ''}`}>
                <RadioGroupItem value="standard" className="sr-only" />
                <span>{t('fullSet')}</span>
              </Label>
              <Label className={`relative flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all ${format.finalSetTiebreak === 'super' ? 'border-primary bg-primary/10' : ''}`}>
                <RadioGroupItem value="super" className="sr-only" />
                <span>{t('superTiebreak')}</span>
              </Label>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? t('saving') : t('saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 