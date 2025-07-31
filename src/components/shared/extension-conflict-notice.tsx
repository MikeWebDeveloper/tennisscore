"use client"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { X } from "lucide-react"
import { Shield } from "lucide-react"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { detectInterferingExtensions, cleanupExtensionAttributes, type ExtensionDetection } from "@/lib/utils/browser-extension-detector"
import { useTranslations } from "@/i18n"

export function ExtensionConflictNotice() {
  const [detection, setDetection] = useState<ExtensionDetection | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const t = useTranslations('common')

  useEffect(() => {
    setMounted(true)
    
    // Initial detection
    const initialDetection = detectInterferingExtensions()
    setDetection(initialDetection)

    // Set up periodic cleanup if extensions are detected
    if (initialDetection.hasInterferingExtensions) {
      const cleanup = setInterval(() => {
        cleanupExtensionAttributes()
      }, 1000) // Clean up every second

      return () => clearInterval(cleanup)
    }
  }, [])

  // Don't render on server or if dismissed or no issues
  if (!mounted || dismissed || !detection?.hasInterferingExtensions) {
    return null
  }

  const handleDismiss = () => {
    setDismissed(true)
    // Store dismissal in localStorage
    localStorage.setItem('extension-conflict-dismissed', Date.now().toString())
  }

  const handleCleanup = () => {
    cleanupExtensionAttributes()
    // Re-detect after cleanup
    const newDetection = detectInterferingExtensions()
    setDetection(newDetection)
  }

  return (
    <Card className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <CardTitle className="text-sm text-amber-800 dark:text-amber-200">
              {t("browserExtensionDetected")}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          {t("browserExtensionMayInterfere")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              {t("detectedExtensions")}
            </p>
            <div className="flex flex-wrap gap-1">
              {detection.detectedExtensions.map((ext, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                >
                  {ext.includes('bis_skin_checked') && <Shield className="h-3 w-3 mr-1" />}
                  {ext.includes('adblock') && <Eye className="h-3 w-3 mr-1" />}
                  {ext.replace('_', ' ').replace('-', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              {t("recommendedActions")}
            </p>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
              {detection.recommendedActions.map((action, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-1 h-1 bg-amber-600 rounded-full mt-2 mr-2 flex-shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCleanup}
              className="text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900"
            >
              {t("tryCleanup")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
            >
              {t("dismiss")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 