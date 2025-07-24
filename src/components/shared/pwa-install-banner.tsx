'use client'

import { useState, useEffect } from 'react'
import { X, Smartphone, Monitor, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown')

  useEffect(() => {
    // Check if already installed
    const checkInstallStatus = () => {
      // Check if running as PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           (window.navigator as any).standalone ||
                           document.referrer.includes('android-app://')
      
      if (isStandalone) {
        setIsInstalled(true)
        return
      }

      // Check if previously dismissed
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      
      if (dismissedTime > oneWeekAgo) {
        return // Still dismissed
      }

      setShowBanner(true)
    }

    // Platform detection
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setPlatform('ios')
      } else if (/android/.test(userAgent)) {
        setPlatform('android')
      } else if (/windows|mac|linux/.test(userAgent) && !/mobile/.test(userAgent)) {
        setPlatform('desktop')
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowBanner(false)
      setDeferredPrompt(null)
    }

    detectPlatform()
    checkInstallStatus()

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        
        if (choice.outcome === 'accepted') {
          setShowBanner(false)
          setDeferredPrompt(null)
        }
      } catch (error) {
        console.error('Install prompt failed:', error)
      }
    } else {
      // Show manual install instructions
      showManualInstallInstructions()
    }
  }

  const showManualInstallInstructions = () => {
    let instructions = ''
    let steps = []
    
    switch (platform) {
      case 'ios':
        instructions = 'Install TennisScore on iOS:'
        steps = [
          '1. Tap the Share button (📤) at the bottom of Safari',
          '2. Scroll down and tap "Add to Home Screen"',
          '3. Tap "Add" to confirm installation'
        ]
        break
      case 'android':
        instructions = 'Install TennisScore on Android:'
        steps = [
          '1. Tap the menu (⋮) in the top-right corner',
          '2. Select "Add to Home screen" or "Install app"',
          '3. Tap "Install" to confirm'
        ]
        break
      case 'desktop':
        instructions = 'Install TennisScore on Desktop:'
        steps = [
          '1. Look for the install icon (⬇️) in your browser\'s address bar',
          '2. Click the icon and select "Install"',
          '3. The app will open in its own window'
        ]
        break
      default:
        instructions = 'Install TennisScore:'
        steps = [
          '1. Look for "Add to Home Screen" in your browser menu',
          '2. Follow the prompts to install',
          '3. Enjoy the native app experience!'
        ]
    }
    
    const message = `${instructions}\n\n${steps.join('\n')}\n\nBenefits:\n✅ Faster loading\n✅ Works offline\n✅ Native app experience`
    alert(message)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  const getPlatformIcon = () => {
    switch (platform) {
      case 'ios':
      case 'android':
        return <Smartphone className="h-5 w-5" />
      case 'desktop':
        return <Monitor className="h-5 w-5" />
      default:
        return <Download className="h-5 w-5" />
    }
  }

  const getPlatformText = () => {
    switch (platform) {
      case 'ios':
        return 'Install on iPhone'
      case 'android':
        return 'Install on Android'
      case 'desktop':
        return 'Install on Desktop'
      default:
        return 'Install App'
    }
  }

  if (isInstalled || !showBanner) {
    return null
  }

  return (
    <Card className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {getPlatformIcon()}
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">
              Get the TennisScore App
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Install TennisScore for faster access, offline support, and a native app experience.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
              <span className="bg-primary/10 px-2 py-1 rounded-md">⚡ Faster loading</span>
              <span className="bg-primary/10 px-2 py-1 rounded-md">📱 Works offline</span>
              <span className="bg-primary/10 px-2 py-1 rounded-md">🔔 Push notifications</span>
            </div>
            <Button 
              onClick={handleInstallClick}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              {getPlatformIcon()}
              <span className="ml-2">{getPlatformText()}</span>
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-8 w-8 p-0 hover:bg-destructive/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}

export default PWAInstallBanner