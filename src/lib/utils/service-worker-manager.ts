"use client"

import { logger } from "./logger"

/**
 * Service Worker Manager for TennisScore PWA
 * Handles registration, updates, and communication with service worker
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface ServiceWorkerMessage {
  type: 'SKIP_WAITING' | 'CLEAR_CACHE' | 'GET_VERSION' | 'PREFETCH_RESOURCES' | 'SYNC_MATCHES'
  payload?: Record<string, unknown>
}

export interface ServiceWorkerUpdateEvent {
  type: 'update-available' | 'update-ready' | 'offline' | 'online'
  serviceWorker?: ServiceWorker
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null
  private updateAvailable = false
  private listeners: Map<string, ((data?: unknown) => void)[]> = new Map()

  constructor() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.emit('online'))
      window.addEventListener('offline', () => this.emit('offline'))
    }
  }

  /**
   * Register service worker with enhanced error handling
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      logger.debug('[SW Manager] Service Workers not supported')
      return null
    }

    try {
      logger.debug('[SW Manager] Registering service worker...')
      
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      })

      logger.debug('[SW Manager] Service worker registered:', this.registration.scope)

      // Set up event listeners
      this.setupEventListeners()

      // Check for immediate updates
      await this.checkForUpdates()

      return this.registration
    } catch (error) {
      logger.error('[SW Manager] Registration failed:', error)
      return null
    }
  }

  /**
   * Set up service worker event listeners
   */
  private setupEventListeners() {
    if (!this.registration) return

    // Handle updates
    this.registration.addEventListener('updatefound', () => {
      logger.debug('[SW Manager] Update found')
      const newWorker = this.registration!.installing

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Update available
              this.updateAvailable = true
              this.emit('update-available', { serviceWorker: newWorker })
            } else {
              // First install
              this.emit('update-ready', { serviceWorker: newWorker })
            }
          }
        })
      }
    })

    // Handle controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      logger.debug('[SW Manager] Controller changed - reloading page')
      window.location.reload()
    })

    // Handle messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      logger.debug('[SW Manager] Message from SW:', event.data)
      this.handleServiceWorkerMessage(event.data)
    })
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates(): Promise<void> {
    if (!this.registration) return

    try {
      await this.registration.update()
      logger.debug('[SW Manager] Update check completed')
    } catch (error) {
      logger.error('[SW Manager] Update check failed:', error)
    }
  }

  /**
   * Apply pending update
   */
  async applyUpdate(): Promise<void> {
    if (!this.registration || !this.updateAvailable) return

    const waitingWorker = this.registration.waiting
    if (waitingWorker) {
      logger.debug('[SW Manager] Applying update...')
      this.sendMessage({ type: 'SKIP_WAITING' })
    }
  }

  /**
   * Send message to service worker
   */
  sendMessage(message: ServiceWorkerMessage): void {
    if (!this.registration || !this.registration.active) {
      console.warn('[SW Manager] No active service worker to send message to')
      return
    }

    this.registration.active.postMessage(message)
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<void> {
    console.log('[SW Manager] Clearing caches...')
    this.sendMessage({ type: 'CLEAR_CACHE' })
    
    // Also clear browser caches
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
    }
  }

  /**
   * Prefetch important resources
   */
  async prefetchResources(urls: string[]): Promise<void> {
    console.log('[SW Manager] Prefetching resources:', urls)
    this.sendMessage({ 
      type: 'PREFETCH_RESOURCES', 
      payload: { urls } 
    })
  }

  /**
   * Request background sync for matches data
   */
  async syncMatches(): Promise<void> {
    console.log('[SW Manager] Requesting background sync for matches')
    this.sendMessage({ type: 'SYNC_MATCHES' })
  }

  /**
   * Get cache sizes for debugging
   */
  async getCacheInfo(): Promise<{ name: string; size: number }[]> {
    if (!('caches' in window)) return []
    
    try {
      const cacheNames = await caches.keys()
      const cacheInfo = await Promise.all(
        cacheNames.map(async (name) => {
          const cache = await caches.open(name)
          const keys = await cache.keys()
          return { name, size: keys.length }
        })
      )
      return cacheInfo
    } catch (error) {
      console.error('[SW Manager] Failed to get cache info:', error)
      return []
    }
  }

  /**
   * Get service worker version
   */
  async getVersion(): Promise<string> {
    return new Promise((resolve) => {
      if (!this.registration || !this.registration.active) {
        resolve('unknown')
        return
      }

      const messageChannel = new MessageChannel()
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version || 'unknown')
      }

      this.registration.active.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      )

      // Timeout after 2 seconds
      setTimeout(() => resolve('timeout'), 2000)
    })
  }

  /**
   * Check if app is running offline
   */
  isOffline(): boolean {
    return !navigator.onLine
  }

  /**
   * Get network status
   */
  getNetworkStatus(): { online: boolean; effectiveType?: string } {
    const connection = (navigator as unknown as Record<string, unknown>).connection || 
                      (navigator as unknown as Record<string, unknown>).mozConnection || 
                      (navigator as unknown as Record<string, unknown>).webkitConnection
    
    return {
      online: navigator.onLine,
      effectiveType: (connection as Record<string, unknown>)?.effectiveType as string
    }
  }

  /**
   * Event listener management
   */
  on(event: string, callback: (data?: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: (data?: unknown) => void): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: unknown): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  private handleServiceWorkerMessage(data: Record<string, unknown>): void {
    // Handle specific message types from service worker
    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('[SW Manager] Cache updated:', data.payload)
        break
      case 'SYNC_COMPLETE':
        console.log('[SW Manager] Background sync completed')
        break
      default:
        console.log('[SW Manager] Unknown message from SW:', data)
    }
  }
}

export const serviceWorkerManager = new ServiceWorkerManager()

// Auto-register in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  serviceWorkerManager.register()
}

// Utility functions
export const installPrompt = {
  deferredPrompt: null as BeforeInstallPromptEvent | null,
  
  setup() {
    if (typeof window === 'undefined') return
    
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] Install prompt available')
      e.preventDefault()
      this.deferredPrompt = e as BeforeInstallPromptEvent
    })
  },

  async show(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('[PWA] No install prompt available')
      return false
    }

    try {
      await this.deferredPrompt.prompt()
      const result = await this.deferredPrompt.userChoice
      console.log('[PWA] Install prompt result:', result.outcome)
      
      this.deferredPrompt = null
      return result.outcome === 'accepted'
    } catch (error) {
      console.error('[PWA] Install prompt error:', error)
      return false
    }
  },

  isAvailable(): boolean {
    return !!this.deferredPrompt
  }
}

// Initialize install prompt
if (typeof window !== 'undefined') {
  installPrompt.setup()
}