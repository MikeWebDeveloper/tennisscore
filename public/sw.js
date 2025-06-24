// TennisScore Service Worker
// Version: 1.2.1
const CACHE_NAME = 'tennisscore-v1.2.1'
const DYNAMIC_CACHE = 'tennisscore-dynamic-v1.2.1'
const APP_VERSION = '1.2.1'

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
  
  // Images - Cache first with network fallback
  IMAGES: /^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|svg)$/,
  
  // Appwrite API - Network first with cache fallback
  APPWRITE: /^https:\/\/cloud\.appwrite\.io\//
}

// Requests to NEVER intercept
const BYPASS_PATTERNS = [
  // Development requests
  /_next\/static\/webpack\//,
  /_next\/static\/development\//,
  /\.hot-update\./,
  /webpack\.hot-update/,
  /_devMiddlewareManifest/,
  
  // Service Worker itself
  /\/sw\.js$/,
  
  // API routes (let Next.js handle these)
  /\/api\//,
  
  // Chrome extensions
  /^chrome-extension:/,
  
  // External domains
  /^https?:\/\/(?!([^\/]+\.)?localhost|127\.0\.0\.1|[^\/]*\.local)/
]

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

// Helper function to check if request should be bypassed
function shouldBypassRequest(request) {
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return true
  }
  
  // Check bypass patterns
  for (const pattern of BYPASS_PATTERNS) {
    if (pattern.test(request.url) || pattern.test(url.pathname)) {
      return true
    }
  }
  
  // Skip if this is not our domain (avoid handling external requests)
  if (url.origin !== self.location.origin) {
    return true
  }
  
  // Bypass service worker if requested (for debugging)
  if (url.searchParams.has('sw-bypass')) {
    console.log('[SW] Bypassing service worker for:', url.pathname)
    return true
  }
  
  return false
}

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  // Check if we should bypass this request
  if (shouldBypassRequest(request)) {
    return // Let the request pass through naturally
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
    
    // Strategy 3: Appwrite API - Network First
    if (CACHE_STRATEGIES.APPWRITE.test(request.url)) {
      return await networkFirst(request, DYNAMIC_CACHE)
    }
    
    // Strategy 4: Navigation requests - Special handling
    if (request.mode === 'navigate') {
      return await navigationHandler(request)
    }
    
    // Default: Network only for everything else
    console.log('[SW] Network-only request:', url.pathname)
    return await fetch(request)
    
  } catch (error) {
    console.log('[SW] Request handler error for', url.pathname, ':', error.message)
    
    // For navigation requests, provide offline fallback
    if (request.mode === 'navigate') {
      return await getOfflineFallback()
    }
    
    // For other requests, just let them fail naturally
    throw error
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
  try {
    const networkResponse = await fetch(request)
    
    // Only cache successful responses
    if (networkResponse.ok && networkResponse.status < 300) {
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
  try {
    const networkResponse = await fetch(request)
    
    // Only cache successful responses
    if (networkResponse.ok && networkResponse.status < 300) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone()).catch(e => 
        console.log('[SW] Cache put failed:', e.message)
      )
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network first fetch failed, trying cache:', error.message)
    // Network failed, try cache
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

// Navigation handler - Conservative approach
async function navigationHandler(request) {
  try {
    // For navigation requests, always try network first
    // Use the original request object to preserve redirect handling
    const networkResponse = await fetch(request)
    
    // Don't cache navigation responses to avoid stale content issues
    // Let Next.js handle routing and caching
    return networkResponse
    
  } catch (error) {
    console.log('[SW] Navigation network request failed:', error.message)
    
    // Only provide offline fallback if truly offline
    return await getOfflineFallback()
  }
}

// Get offline fallback page
async function getOfflineFallback() {
  // Try to return a cached static page
  const cache = await caches.open(CACHE_NAME)
  
  // Try to match common pages that might be cached
  let cachedResponse = await cache.match('/') || 
                      await cache.match('/dashboard') ||
                      await cache.match('/login')
  
  if (cachedResponse) {
    console.log('[SW] Returning cached fallback for offline navigation')
    return cachedResponse
  }
  
  // Last resort: return basic offline page
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>TennisScore - Offline</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            text-align: center; 
            padding: 50px 20px; 
            color: #333;
            background: #f8f9fa;
          }
          .container {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .icon { font-size: 48px; margin-bottom: 20px; }
          .offline { color: #666; margin: 20px 0; }
          button { 
            padding: 12px 24px; 
            background: #007bff; 
            color: white; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer; 
            font-size: 16px;
            margin-top: 20px;
          }
          button:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🎾</div>
          <h1>TennisScore</h1>
          <p class="offline">You're currently offline. Please check your internet connection and try again.</p>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      </body>
    </html>
  `, {
    status: 200,
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    }
  })
}

// Background cache update
async function updateCache(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const networkResponse = await fetch(request)
    
    // Only cache successful responses
    if (networkResponse.ok && networkResponse.status < 300) {
      await cache.put(request, networkResponse)
    }
  } catch (error) {
    console.log('[SW] Background cache update failed:', error.message)
  }
}

// Message handling for communication with the app
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {}
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CHECK_UPDATE':
      // Force check for updates
      self.registration.update().then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({
            type: 'UPDATE_CHECKED',
            hasUpdate: false
          })
        }
      }).catch(error => {
        console.log('[SW] Update check failed:', error.message)
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
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({
            type: 'CACHE_INFO',
            data: info
          })
        }
      }).catch(error => {
        console.log('[SW] Get cache info failed:', error.message)
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
    try {
      const cache = await caches.open(name)
      const keys = await cache.keys()
      
      info.caches.push({
        name,
        entries: keys.length,
        urls: keys.map(req => req.url)
      })
    } catch (error) {
      console.log('[SW] Error getting cache info for', name, ':', error.message)
    }
  }
  
  return info
}

// Background sync for offline actions (optional future feature)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync-matches') {
    event.waitUntil(syncOfflineMatches())
  }
})

// Sync offline match data when connection is restored
async function syncOfflineMatches() {
  try {
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
    
    // Notify clients that sync failed
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