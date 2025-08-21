"use client"

import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { usePWAInstall } from "@/hooks/use-pwa-install"

export function PWAInstallPrompt() {
  const { canInstall, isInstalling, install, dismiss } = usePWAInstall()

  if (!canInstall) return null

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Install TennisScore</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Get the full app experience with offline support and quick access from your home screen.
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={install}
                disabled={isInstalling}
                className="flex-1"
              >
                {isInstalling ? "Installing..." : "Install"}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={dismiss}
                disabled={isInstalling}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}