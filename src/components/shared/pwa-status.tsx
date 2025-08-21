"use client"

import { useEffect, useState } from "react"
import { Download, Wifi, WifiOff, RefreshCw, Trash2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { serviceWorkerManager } from "@/lib/utils/service-worker-manager"
import { usePWAInstall } from "@/hooks/use-pwa-install"
import { useNetworkStatus } from "@/hooks/use-network-status"

export function PWAStatus() {
  const [swVersion, setSwVersion] = useState<string>('unknown')
  const [cacheInfo, setCacheInfo] = useState<{ name: string; size: number }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { canInstall, install, isInstalling } = usePWAInstall()
  const isOnline = useNetworkStatus()

  useEffect(() => {
    const loadData = async () => {
      const version = await serviceWorkerManager.getVersion()
      const caches = await serviceWorkerManager.getCacheInfo()
      setSwVersion(version)
      setCacheInfo(caches)
    }
    
    loadData()
  }, [])

  const handleClearCache = async () => {
    setIsLoading(true)
    try {
      await serviceWorkerManager.clearCaches()
      const caches = await serviceWorkerManager.getCacheInfo()
      setCacheInfo(caches)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckUpdate = async () => {
    setIsLoading(true)
    try {
      await serviceWorkerManager.checkForUpdates()
      const version = await serviceWorkerManager.getVersion()
      setSwVersion(version)
    } finally {
      setIsLoading(false)
    }
  }

  const totalCacheSize = cacheInfo.reduce((sum, cache) => sum + cache.size, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          PWA Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm font-medium">Network Status</span>
          </div>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>

        {/* Service Worker Version */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Service Worker</span>
          <Badge variant="outline">{swVersion}</Badge>
        </div>

        {/* Cache Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Cache Status</span>
            <Badge variant="outline">{totalCacheSize} items</Badge>
          </div>
          {cacheInfo.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {cacheInfo.map(cache => (
                <div key={cache.name} className="flex justify-between">
                  <span>{cache.name}</span>
                  <span>{cache.size} items</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCheckUpdate}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Check Update
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearCache}
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Cache
          </Button>
        </div>

        {/* Install Button */}
        {canInstall && (
          <Button
            size="sm"
            onClick={install}
            disabled={isInstalling}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            {isInstalling ? "Installing..." : "Install App"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}