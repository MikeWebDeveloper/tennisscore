// TennisScore Service Worker
// Version: 1.0.0
const CACHE_NAME = 'tennisscore-v1'
const DYNAMIC_CACHE = 'tennisscore-dynamic-v1'
const APP_VERSION = '1.0.0'

// Define what to cache
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/matches',
  '/players',
  '/login',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Define runtime caching strategies
const CACHE_STRATEGIES = {
  // App shell - Cache first with network fallback
  APP_SHELL: /^https?:\/\/.*\.(css|js|woff|woff2|ttf|eot)$/,
  
  // API calls - Network first with cache fallback
  API_CALLS: /^https?:\/\/.*\/api\//,
  
  // Images - Cache first with network fallback
  IMAGES: /^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|svg)$/,
  
  // Appwrite API - Network first with cache fallback
  APPWRITE: /^https:\/\/cloud\.appwrite\.io\//
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully')
        return self.skipWaiting() // Force activation
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      
      // Take control of all pages
      self.clients.claim()
    ])
  )
  
  // Notify clients about the update
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'SW_ACTIVATED',
        version: APP_VERSION
      })
    })
  })
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return
  }
  
  event.respondWith(handleRequest(request))
})

async function handleRequest(request) {
  
  try {
    // Strategy 1: App Shell (CSS, JS, fonts) - Cache First
    if (CACHE_STRATEGIES.APP_SHELL.test(request.url)) {
      return await cacheFirst(request, CACHE_NAME)
    }
    
    // Strategy 2: Images - Cache First
    if (CACHE_STRATEGIES.IMAGES.test(request.url)) {
      return await cacheFirst(request, DYNAMIC_CACHE)
    }
    
    // Strategy 3: API calls and Appwrite - Network First
    if (CACHE_STRATEGIES.API_CALLS.test(request.url) || CACHE_STRATEGIES.APPWRITE.test(request.url)) {
      return await networkFirst(request, DYNAMIC_CACHE)
    }
    
    // Strategy 4: Navigation requests - Network First with App Shell fallback
    if (request.mode === 'navigate') {
      return await navigationHandler(request)
    }
    
    // Default: Network First
    return await networkFirst(request, DYNAMIC_CACHE)
    
  } catch (error) {
    console.error('[SW] Request failed:', error)
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAME)
      return await cache.match('/') || new Response('Offline')
    }
    
    // Return empty response for other requests
    return new Response('Network error', { status: 503 })
  }
}

// Cache First strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    // Return cached version immediately
    updateCache(request, cacheName) // Update in background
    return cachedResponse
  }
  
  // Not in cache, fetch from network
  const networkResponse = await fetch(request)
  
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone())
  }
  
  return networkResponse
}

// Network First strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

// Navigation handler for SPA routing
async function navigationHandler(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
    
    throw new Error('Network response not ok')
  } catch (error) {
    // Network failed, return cached page or app shell
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request) || 
                          await cache.match('/dashboard') || 
                          await cache.match('/')
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

// Background cache update
async function updateCache(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse)
    }
  } catch (error) {
    console.log('[SW] Background cache update failed:', error.message)
  }
}

// Message handling for communication with the app
self.addEventListener('message', (event) => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CHECK_UPDATE':
      // Force check for updates
      self.registration.update().then(() => {
        event.ports[0].postMessage({
          type: 'UPDATE_CHECKED',
          hasUpdate: false
        })
      })
      break
      
    case 'CLEAR_CACHE':
      // Clear specific cache or all caches
      const cacheName = payload?.cacheName
      if (cacheName) {
        caches.delete(cacheName)
      } else {
        // Clear all caches
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name))
        })
      }
      break
      
    case 'GET_CACHE_INFO':
      // Return cache information
      getCacheInfo().then((info) => {
        event.ports[0].postMessage({
          type: 'CACHE_INFO',
          data: info
        })
      })
      break
  }
})

// Get cache information
async function getCacheInfo() {
  const cacheNames = await caches.keys()
  const info = {
    version: APP_VERSION,
    caches: [],
    totalSize: 0
  }
  
  for (const name of cacheNames) {
    const cache = await caches.open(name)
    const keys = await cache.keys()
    
    info.caches.push({
      name,
      entries: keys.length,
      urls: keys.map(req => req.url)
    })
  }
  
  return info
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync-matches') {
    event.waitUntil(syncOfflineMatches())
  }
})

// Sync offline match data when connection is restored
async function syncOfflineMatches() {
  try {
    // This would integrate with your offline storage strategy
    console.log('[SW] Syncing offline match data...')
    
    // Notify clients that sync is happening
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_STARTED',
        data: { type: 'matches' }
      })
    })
    
    // Your sync logic would go here
    // For now, just simulate success
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Notify clients that sync completed
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        data: { type: 'matches', success: true }
      })
    })
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
    
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_FAILED',
        data: { type: 'matches', error: error.message }
      })
    })
  }
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: data.tag || 'general',
      data: data.data || {},
      actions: data.actions || []
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action) {
    // Handle specific action clicks
    console.log('[SW] Notification action clicked:', event.action)
  } else {
    // Handle general notification click
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  }
}) 