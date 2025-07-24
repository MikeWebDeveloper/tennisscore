"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Trash2, HardDrive, Database, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "@/hooks/use-translations"

export function CacheManager() {
  const t = useTranslations()
  const [loading, setLoading] = useState<string | null>(null)

  // Clear browser cache and reload
  const handleClearCache = async () => {
    setLoading('clearing')
    toast.info(t('clearingCache'))
    
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
        toast.success(t('cacheCleared'))
      }
      
      // Reload after clearing
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      }, 1000)
    } catch (error) {
      console.error('Cache clear failed:', error)
      toast.error(t('failedToClearCache'))
      setLoading(null)
    }
  }

  // Force hard refresh
  const handleHardRefresh = () => {
    setLoading('refreshing')
    toast.info(t('refreshing'))
    
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
        
        toast.success(`Found ${cacheNames.length} cache(s) with ${totalEntries} total entries`)
      } else {
        toast.info('Cache API not available')
      }
    } catch (error) {
      console.error('Cache info check failed:', error)
      toast.error(t('failedToGetCacheInfo'))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4 w-full max-w-2xl">
      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-500" />
            {t('cacheManagement')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              onClick={handleClearCache}
              disabled={!!loading}
              variant="outline"
              size="sm"
              className="justify-start"
            >
              {loading === 'clearing' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {t('clearCache')}
            </Button>

            <Button
              onClick={handleHardRefresh}
              disabled={!!loading}
              variant="outline"
              size="sm"
              className="justify-start"
            >
              {loading === 'refreshing' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <HardDrive className="h-4 w-4 mr-2" />
              )}
              {t('hardRefresh')}
            </Button>

            <Button
              onClick={handleCheckCacheInfo}
              disabled={!!loading}
              variant="outline"
              size="sm"
              className="justify-start"
            >
              {loading === 'checking' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              {t('cacheInfo')}
            </Button>
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">{t('cacheManagementTools')}</p>
              <div className="space-y-1">
                <p>• {t('clearCacheRemoves')}</p>
                <p>• {t('hardRefreshReloads')}</p>
                <p>• {t('cacheInfoShows')}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">{t('whenToUseTools')}</p>
                <ul className="text-blue-800 dark:text-blue-200 mt-1 space-y-1">
                  <li>• {t('appNotLoadingProperly')}</li>
                  <li>• {t('experiencingSlowPerformance')}</li>
                  <li>• {t('wantToCheckStorage')}</li>
                  <li>• {t('needToTroubleshoot')}</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('connectionStatus')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {typeof window !== 'undefined' ? 
                (navigator.onLine ? 'Online' : 'Offline') : 
                t('checking')
              }
            </span>
            <Badge variant={
              typeof window !== 'undefined' ? 
                (navigator.onLine ? 'default' : 'destructive') : 
                'secondary'
            }>
              {typeof window !== 'undefined' ? 
                (navigator.onLine ? 'Connected' : 'Disconnected') : 
                'Unknown'
              }
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 