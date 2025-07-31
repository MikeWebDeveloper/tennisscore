"use client"

import { CacheManager } from "@/components/features/cache-manager"
import { SoundSettings } from "@/components/ui/sound-settings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"
import { Database } from "lucide-react"
import { Volume2 } from "lucide-react"
import { useTranslations } from "@/i18n"

export default function SettingsPage() {
  const t = useTranslations('settings')
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold text-slate-100">
            {t('settings')}
          </h1>
        </div>
        <p className="text-lg text-slate-400">
          {t('managePreferences')}
        </p>
      </div>

      {/* Cache Management Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-slate-200">
            {t('cacheAndUpdates')}
          </h2>
        </div>
        
        <div className="max-w-4xl">
          <CacheManager />
        </div>
      </div>

      {/* Sound Settings Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Volume2 className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-slate-200">
            {t('soundSettings')}
          </h2>
        </div>
        
        <div className="max-w-4xl">
          <SoundSettings />
        </div>
      </div>

      {/* Information Card */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>{t('aboutCacheManagement')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>{t('whyUseCacheManagement')}</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>{t('fixesOutdated')}</li>
              <li>{t('resolvesStaleData')}</li>
              <li>{t('improvesPerformance')}</li>
              <li>{t('forcesFreshData')}</li>
            </ul>
            
            <p className="mt-4">
              <strong>{t('whenToUseFeatures')}</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>{t('clearCacheDescription')}</li>
              <li>{t('forceReloadDescription')}</li>
              <li>{t('checkUpdatesDescription')}</li>
              <li>{t('installAppDescription')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 