"use client"

import { useState, useEffect } from "react"
import { installPrompt } from "@/lib/utils/service-worker-manager"
import { logger } from "@/lib/utils/logger"

/**
 * usePWAInstall – manages PWA installation prompt
 * 
 * Returns state and functions for handling PWA installation
 */
export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    const checkInstallPrompt = () => {
      setCanInstall(installPrompt.isAvailable())
    }

    // Check initial state
    checkInstallPrompt()

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = () => {
      checkInstallPrompt()
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Clean up listener
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const install = async (): Promise<boolean> => {
    if (!canInstall || isInstalling) return false

    setIsInstalling(true)
    
    try {
      const accepted = await installPrompt.show()
      
      if (accepted) {
        setCanInstall(false)
      }
      
      return accepted
    } catch (error) {
      logger.error('PWA install failed:', error)
      return false
    } finally {
      setIsInstalling(false)
    }
  }

  const dismiss = () => {
    setCanInstall(false)
  }

  return {
    canInstall,
    isInstalling,
    install,
    dismiss
  }
}