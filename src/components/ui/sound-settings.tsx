// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { soundManager, playSound, type SoundEvent } from "@/lib/sounds"
import { Volume2, VolumeX, TestTube2 } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"

interface SoundSettings {
  enabled: boolean
  volume: number
  pointSounds: boolean
  criticalPointSounds: boolean
  matchEventSounds: boolean
}

export function SoundSettings() {
  const t = useTranslations()
  const [settings, setSettings] = useState<SoundSettings>({
    enabled: true,
    volume: 0.7,
    pointSounds: true,
    criticalPointSounds: true,
    matchEventSounds: true,
  })

  // Load settings from sound manager on mount
  useEffect(() => {
    const currentSettings = soundManager.getSettings()
    setSettings(currentSettings)
  }, [])

  const updateSetting = (key: keyof SoundSettings, value: boolean | number) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    soundManager.updateSettings({ [key]: value })
  }

  const testSound = async (event: SoundEvent) => {
    try {
      await playSound(event)
    } catch (error) {
      console.warn('Failed to test sound:', error)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    updateSetting('volume', value[0])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          {t('soundEffects')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Enable/Disable */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">{t('enableSoundEffects')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('turnOnAudioFeedback')}
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSetting('enabled', checked)}
          />
        </div>

        {/* Volume Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">{t('volume')}</Label>
            <span className="text-sm text-muted-foreground">
              {Math.round(settings.volume * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <VolumeX className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[settings.volume]}
              onValueChange={handleVolumeChange}
              max={1}
              min={0}
              step={0.1}
              className="flex-1"
              disabled={!settings.enabled}
            />
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <Separator />

        {/* Sound Categories */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">{t('soundCategories')}</h4>
          
          {/* Point Sounds */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">{t('pointSounds')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('basicPointScoring')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => testSound('point-won')}
                disabled={!settings.enabled || !settings.pointSounds}
                className="h-8 w-8 p-0"
              >
                <TestTube2 className="h-3 w-3" />
              </Button>
              <Switch
                checked={settings.pointSounds}
                onCheckedChange={(checked) => updateSetting('pointSounds', checked)}
                disabled={!settings.enabled}
              />
            </div>
          </div>

          {/* Critical Point Sounds */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">{t('criticalPointSounds')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('breakPointsSetPoints')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => testSound('break-point')}
                disabled={!settings.enabled || !settings.criticalPointSounds}
                className="h-8 w-8 p-0"
              >
                <TestTube2 className="h-3 w-3" />
              </Button>
              <Switch
                checked={settings.criticalPointSounds}
                onCheckedChange={(checked) => updateSetting('criticalPointSounds', checked)}
                disabled={!settings.enabled}
              />
            </div>
          </div>

          {/* Match Event Sounds */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">{t('matchEventSounds')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('gameWonSetWon')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => testSound('game-won')}
                disabled={!settings.enabled || !settings.matchEventSounds}
                className="h-8 w-8 p-0"
              >
                <TestTube2 className="h-3 w-3" />
              </Button>
              <Switch
                checked={settings.matchEventSounds}
                onCheckedChange={(checked) => updateSetting('matchEventSounds', checked)}
                disabled={!settings.enabled}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Test Sounds Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">{t('testDifferentSounds')}</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testSound('ace')}
              disabled={!settings.enabled}
              className="justify-start"
            >
              <TestTube2 className="h-3 w-3 mr-2" />
              {t('ace')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testSound('double-fault')}
              disabled={!settings.enabled}
              className="justify-start"
            >
              <TestTube2 className="h-3 w-3 mr-2" />
              {t('doubleFault')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testSound('match-point')}
              disabled={!settings.enabled}
              className="justify-start"
            >
              <TestTube2 className="h-3 w-3 mr-2" />
              {t('matchPoint')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testSound('match-won')}
              disabled={!settings.enabled}
              className="justify-start"
            >
              <TestTube2 className="h-3 w-3 mr-2" />
              {t('matchWon')}
            </Button>
          </div>
        </div>

        {/* Info Note */}
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">
            💡 {t('soundEffectsNote')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 