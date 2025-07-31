"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from '@/lib/framer-motion-config'
import { X, Download, Smartphone, Monitor, Apple, Share2, Chrome } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTranslations } from "@/i18n"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallationBanner() {
  const t = useTranslations('dashboard')
  const commonT = useTranslations('common')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown')
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)
    const isDesktop = !isIOS && !isAndroid

    if (isIOS) {
      setDeviceType('ios')
    } else if (isAndroid) {
      setDeviceType('android')
    } else if (isDesktop) {
      setDeviceType('desktop')
    }

    // Check if user has dismissed banner before
    const dismissed = localStorage.getItem('pwa-banner-dismissed')
    if (dismissed) {
      const dismissedTime = new Date(dismissed).getTime()
      const now = new Date().getTime()
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      
      if (now - dismissedTime < sevenDays) {
        return
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    // Show banner for iOS/Android even without prompt event
    if ((isIOS || isAndroid) && !dismissed) {
      setTimeout(() => setShowBanner(true), 2000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowBanner(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setShowBanner(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-banner-dismissed', new Date().toISOString())
  }

  const getInstallInstructions = () => {
    switch (deviceType) {
      case 'ios':
        return {
          icon: Apple,
          title: "Add to iPhone",
          instructions: "Tap the share button, then 'Add to Home Screen'"
        }
      case 'android':
        return {
          icon: Smartphone,
          title: "Install on Android",
          instructions: deferredPrompt ? "Tap Install to add to home screen" : "Open in Chrome and tap 'Add to Home Screen' in menu"
        }
      case 'desktop':
        return {
          icon: Monitor,
          title: "Install Desktop App",
          instructions: deferredPrompt ? "Click Install for quick access" : "Look for install icon in address bar"
        }
      default:
        return {
          icon: Download,
          title: "Install App",
          instructions: "Add Tenis.click to your device for quick access"
        }
    }
  }

  if (isInstalled || !showBanner) {
    return null
  }

  const { icon: Icon, title, instructions } = getInstallInstructions()

  return (
    <>
      <AnimatePresence>
        <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground mb-1">
                  {title}
                </h3>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  {instructions}
                </p>
                
                <div className="flex items-center gap-2">
                  {deferredPrompt ? (
                    <Button 
                      size="sm" 
                      onClick={handleInstallClick}
                      className="text-xs px-3 py-1 h-auto"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {commonT('install')}
                    </Button>
                  ) : (deviceType === 'ios' || deviceType === 'android') ? (
                    <Button 
                      size="sm" 
                      onClick={() => setShowInstructions(true)}
                      className="text-xs px-3 py-1 h-auto"
                    >
                      {deviceType === 'ios' ? (
                        <Apple className="h-3 w-3 mr-1" />
                      ) : (
                        <Smartphone className="h-3 w-3 mr-1" />
                      )}
                      {commonT('showMeHow')}
                    </Button>
                  ) : null}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleDismiss}
                    className="text-xs px-2 py-1 h-auto text-muted-foreground hover:text-foreground"
                  >
                    {commonT('later')}
                  </Button>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="p-1 h-auto text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>

    <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {deviceType === 'ios' ? (
              <>
                <Apple className="h-5 w-5" />
                Install on iOS
              </>
            ) : (
              <>
                <Chrome className="h-5 w-5" />
                Install on Android
              </>
            )}
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            {deviceType === 'ios' ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                    <span className="text-sm font-semibold">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Open in Safari</p>
                    <p className="text-sm text-muted-foreground">Make sure you're using Safari browser</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                    <span className="text-sm font-semibold">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Tap the Share button</p>
                    <p className="text-sm text-muted-foreground">Look for <Share2 className="inline h-3 w-3" /> at the bottom of the screen</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                    <span className="text-sm font-semibold">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Add to Home Screen</p>
                    <p className="text-sm text-muted-foreground">Scroll down and tap "Add to Home Screen"</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                    <span className="text-sm font-semibold">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Open in Chrome</p>
                    <p className="text-sm text-muted-foreground">Make sure you're using Chrome browser</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                    <span className="text-sm font-semibold">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Tap the menu button</p>
                    <p className="text-sm text-muted-foreground">Look for ⋮ at the top right</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                    <span className="text-sm font-semibold">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Add to Home screen</p>
                    <p className="text-sm text-muted-foreground">Tap "Add to Home screen" or "Install app"</p>
                  </div>
                </div>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button onClick={() => setShowInstructions(false)} variant="outline">
            {commonT('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}