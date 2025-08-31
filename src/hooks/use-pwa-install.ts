import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setInstallPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installApp = async () => {
    if (!installPrompt) return false

    try {
      setIsInstalling(true)
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      
      setInstallPrompt(null)
      setIsInstallable(false)
      setIsInstalling(false)
      
      return outcome === 'accepted'
    } catch (error) {
      console.error('Error installing PWA:', error)
      setIsInstalling(false)
      return false
    }
  }

  const install = installApp // Alias for backward compatibility
  const dismiss = () => {
    setInstallPrompt(null)
    setIsInstallable(false)
  }

  return {
    isInstallable,
    isInstalled,
    isInstalling,
    canInstall: isInstallable && !isInstalled && !isInstalling,
    installApp,
    install,
    dismiss
  }
}