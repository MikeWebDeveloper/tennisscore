"use client"

import { useState, useEffect } from 'react'

interface PWAState {
  isSupported: boolean
  isInstalled: boolean
  isOnline: boolean
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isSupported: false,
    isInstalled: false,
    isOnline: true
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check PWA support
    const isSupported = 'serviceWorker' in navigator
    
    // Check if app is installed (running in standalone mode)
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       Boolean((window.navigator as { standalone?: boolean }).standalone)

    // Check online status
    const isOnline = navigator.onLine

    setState({
      isSupported,
      isInstalled,
      isOnline
    })

    // Listen for online/offline changes
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Basic cache management functions
  const clearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
    }
  }

  const forceReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return {
    ...state,
    clearCache,
    forceReload
  }
} 