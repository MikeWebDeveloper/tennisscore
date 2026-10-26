"use client"

import { useEffect, useState } from "react"
import { Download, Share } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePWAInstall } from "@/hooks/use-pwa-install"
import { detectInstallMode, type InstallMode } from "@/lib/utils/pwa-env"
import { useTranslations } from "@/i18n"

/**
 * Install affordance for the menu: a real install button where the browser supports it,
 * and an Add-to-Home-Screen hint on iPhone/iPad. Renders nothing when already installed.
 */
export function InstallAppItem() {
  const t = useTranslations("navigation")
  const { canInstall, install } = usePWAInstall()
  // Start hidden so server and first client render match; detect after mount
  const [mode, setMode] = useState<InstallMode>("installed")

  useEffect(() => {
    setMode(
      detectInstallMode({
        userAgent: navigator.userAgent,
        standaloneDisplay: window.matchMedia("(display-mode: standalone)").matches,
        navigatorStandalone: Boolean((navigator as { standalone?: boolean }).standalone),
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints,
      })
    )
  }, [])

  if (mode === "installed") return null

  if (canInstall) {
    return (
      <Button variant="outline" size="sm" onClick={() => void install()} className="min-h-11 w-full">
        <Download className="h-4 w-4" aria-hidden="true" />
        {t("installApp")}
      </Button>
    )
  }

  if (mode === "ios") {
    return (
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Share className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{t("installAppIos")}</span>
      </p>
    )
  }

  return null
}
