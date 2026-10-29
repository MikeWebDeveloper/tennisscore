"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw } from "lucide-react"
import { Trash2 } from "lucide-react"
import { HardDrive } from "lucide-react"
import { Database } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "@/i18n"

/** Online state that matches the server render first and then follows the browser's network events. */
function useOnline() {
  const [online, setOnline] = useState<boolean | null>(null)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return online
}

export function CacheManager() {
  const t = useTranslations('settings')
  const [loading, setLoading] = useState<string | null>(null)
  const online = useOnline()

  // Clear browser cache and reload
  const handleClearCache = async () => {
    setLoading('clearing')
    toast.info(t('cache.clearing'))

    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
        toast.success(t('cache.cleared'))
      }

      // Reload after clearing
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      }, 1000)
    } catch (error) {
      console.error('Cache clear failed:', error)
      toast.error(t('cache.clearFailed'))
      setLoading(null)
    }
  }

  // Force hard refresh
  const handleHardRefresh = () => {
    setLoading('refreshing')
    toast.info(t('cache.refreshing'))

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    }, 500)
  }

  // Check cache info
  const handleCheckCacheInfo = async () => {
    setLoading('checking')

    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheNames = await caches.keys()
        let totalEntries = 0

        for (const name of cacheNames) {
          const cache = await caches.open(name)
          const keys = await cache.keys()
          totalEntries += keys.length
        }

        toast.success(t('cache.infoResult', { caches: cacheNames.length, entries: totalEntries }))
      } else {
        toast.info(t('cache.infoUnavailable'))
      }
    } catch (error) {
      console.error('Cache info check failed:', error)
      toast.error(t('cache.infoFailed'))
    } finally {
      setLoading(null)
    }
  }

  const actions = [
    { id: 'clearing', label: t('cache.clear'), icon: Trash2, onClick: handleClearCache },
    { id: 'refreshing', label: t('cache.hardRefresh'), icon: HardDrive, onClick: handleHardRefresh },
    { id: 'checking', label: t('cache.info'), icon: Database, onClick: handleCheckCacheInfo },
  ]

  return (
    <div className="space-y-4 w-full max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-500" />
            {t('cache.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {actions.map(({ id, label, icon: Icon, onClick }) => (
              <Button key={id} onClick={onClick} disabled={!!loading} variant="outline" size="sm" className="justify-start">
                {loading === id ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Icon className="h-4 w-4 mr-2" />}
                {label}
              </Button>
            ))}
          </div>

          {/* One short note instead of a box repeating the button labels */}
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{t('cache.whenToUse')}</p>
            <ul className="mt-1 space-y-1">
              <li>• {t('cache.whenOldData')}</li>
              <li>• {t('cache.whenNotWorking')}</li>
              <li>• {t('cache.whenAfterUpdate')}</li>
              <li>• {t('cache.whenStuck')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <span className="text-sm font-medium">{t('cache.connection')}</span>
          {online !== null && (
            <Badge variant={online ? 'default' : 'destructive'}>
              {online ? t('cache.online') : t('cache.offline')}
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
