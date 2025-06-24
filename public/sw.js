// TennisScore Service Worker
// Version: 1.2.0
const CACHE_NAME = 'tennisscore-v1.2'
const DYNAMIC_CACHE = 'tennisscore-dynamic-v1.2'
const APP_VERSION = '1.2.0'

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
      .then(async (cache) => {
        console.log('[SW] Caching static assets')
        
        // Cache static assets individually to handle any that might redirect
        const cachePromises = STATIC_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, {
              redirect: 'follow'
            })
            
            // Only cache successful responses
            if (response.ok) {
              await cache.put(url, response)
              console.log('[SW] Cached:', url)
            } else {
              console.log('[SW] Skipped caching (not ok):', url, response.status)
            }
          } catch (error) {
            console.log('[SW] Failed to cache:', url, error.message)
            // Don't let individual failures break the entire installation
          }
        })
        
        await Promise.allSettled(cachePromises)
        console.log('[SW] Static assets caching completed')
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
  
  // Skip if this is not our domain (avoid handling external requests)
  if (url.origin !== self.location.origin) {
    return
  }
  
  // Skip service worker script itself
  if (url.pathname === '/sw.js') {
    return
  }
  
  // Bypass service worker if requested (for debugging)
  if (url.searchParams.has('sw-bypass')) {
    console.log('[SW] Bypassing service worker for:', url.pathname)
    return
  }
  
  event.respondWith(handleRequest(request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
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
    
    // Default: Let non-matching requests pass through to network
    console.log('[SW] Passing through unmatched request:', url.pathname)
    return await fetch(request, { redirect: 'follow' })
    
  } catch (error) {
    console.log('[SW] Request handler error for', url.pathname, ':', error.message)
    
    // For navigation requests, try to return a cached page
    if (request.mode === 'navigate') {
      try {
        const cache = await caches.open(CACHE_NAME)
        const fallbackResponse = await cache.match('/') || 
                                 await cache.match('/dashboard')
        
        if (fallbackResponse) {
          console.log('[SW] Returning cached fallback for navigation')
          return fallbackResponse
        }
      } catch (cacheError) {
        console.log('[SW] Cache fallback failed:', cacheError.message)
      }
      
      // Return a basic offline page as last resort
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>TennisScore - Offline</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; color: #333; }
              .offline { color: #666; margin: 20px 0; }
              button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
              button:hover { background: #0056b3; }
            </style>
          </head>
          <body>
            <h1>🎾 TennisScore</h1>
            <p class="offline">You're offline. Please check your connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </body>
        </html>
      `, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      })
    }
    
    // For non-navigation requests, try to pass through to network as fallback
    try {
      console.log('[SW] Falling back to network for:', url.pathname)
      return await fetch(request, { redirect: 'follow' })
    } catch (networkError) {
      console.log('[SW] Network fallback also failed:', networkError.message)
      // Return a simple error response as last resort
      return new Response('Service temporarily unavailable', { 
        status: 503,
        statusText: 'Service Worker Error'
      })
    }
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
  
  // Not in cache, fetch from network with simplified config
  try {
    const networkResponse = await fetch(request, {
      redirect: 'follow'
    })
    
    // Only cache successful, non-redirect responses
    if (networkResponse.ok && !networkResponse.redirected) {
      cache.put(request, networkResponse.clone()).catch(e => 
        console.log('[SW] Cache put failed:', e.message)
      )
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Cache first fetch failed:', error.message)
    throw error
  }
}

// Network First strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  
  try {
    const networkResponse = await fetch(request, {
      redirect: 'follow'
    })
    
    // Only cache successful, non-redirect responses
    if (networkResponse.ok && !networkResponse.redirected) {
      cache.put(request, networkResponse.clone()).catch(e => 
        console.log('[SW] Cache put failed:', e.message)
      )
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network first fetch failed, trying cache:', error.message)
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
  const url = new URL(request.url)
  
  // For root path requests that might redirect, try cache first
  if (url.pathname === '/') {
    try {
      const cache = await caches.open(CACHE_NAME)
      const cachedResponse = await cache.match('/')
      
      if (cachedResponse) {
        console.log('[SW] Returning cached root page')
        return cachedResponse
      }
    } catch (cacheError) {
      console.log('[SW] Cache check failed for root:', cacheError.message)
    }
  }
  
  try {
    // For navigation requests, make a simple fetch without intercepting redirects
    const networkResponse = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      redirect: 'follow',
      credentials: 'same-origin'
    })
    
    // Let redirects pass through naturally - don't try to cache redirected responses
    if (networkResponse.ok && !networkResponse.redirected) {
      const cache = await caches.open(DYNAMIC_CACHE)
      // Only cache if it's a final, non-redirected response
      cache.put(request, networkResponse.clone()).catch(e => 
        console.log('[SW] Failed to cache navigation response:', e.message)
      )
    }
    
    return networkResponse
    
  } catch (error) {
    console.log('[SW] Navigation network request failed:', error.message)
    
    // Network failed, try to return appropriate cached page
    const cache = await caches.open(CACHE_NAME)
    
    // Try to match the exact request first
    let cachedResponse = await cache.match(request)
    
    // If not found, try common fallbacks
    if (!cachedResponse) {
      cachedResponse = await cache.match('/dashboard') || 
                      await cache.match('/') ||
                      await cache.match('/login')
    }
    
    if (cachedResponse) {
      console.log('[SW] Returning cached fallback for navigation')
      return cachedResponse
    }
    
    // Last resort: return basic offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>TennisScore - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; color: #333; }
            .offline { color: #666; margin: 20px 0; }
            button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
            button:hover { background: #0056b3; }
          </style>
        </head>
        <body>
          <h1>🎾 TennisScore</h1>
          <p class="offline">You're offline. Please check your connection and try again.</p>
          <button onclick="window.location.reload()">Retry</button>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

// Background cache update
async function updateCache(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const networkResponse = await fetch(request, {
      redirect: 'follow'
    })
    
    // Only cache successful, non-redirect responses
    if (networkResponse.ok && !networkResponse.redirected) {
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