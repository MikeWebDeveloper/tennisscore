// Tenis.click Service Worker - Performance Optimized
// Version: 2.1.0 - Navigation & API Response Caching
const CACHE_NAME = 'tenisclick-v2.1.0'
const STATIC_CACHE = 'tenisclick-static-v2.1.0'
const DYNAMIC_CACHE = 'tenisclick-dynamic-v2.1.0'
const API_CACHE = 'tenisclick-api-v2.1.0'

// Development detection
const isDevelopment = (() => {
  try {
    return self.location.hostname === 'localhost' || 
           self.location.hostname === '127.0.0.1' ||
           self.location.port === '3000' ||
           self.location.port === '3001'
  } catch {
    return false
  }
})()

// Essential static assets to pre-cache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Common navigation routes to prefetch
const PREFETCH_ROUTES = [
  '/dashboard',
  '/matches',
  '/players',
  '/statistics'
]

// Cache strategies by content type
const CACHE_STRATEGIES = {
  // Immutable assets - cache forever
  STATIC_IMMUTABLE: /\/_next\/static\/.+\.(js|css|woff|woff2|ttf|otf)$/,
  
  // Build chunks - stale while revalidate
  BUILD_CHUNKS: /\/_next\/(chunks|media)\/.+\.(js|css)$/,
  
  // Images and icons - cache first
  IMAGES: /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
  
  // App routes - stale while revalidate for speed
  APP_ROUTES: /^\/[^.]*$/,
  
  // API routes - cache with short TTL
  API_ROUTES: /\/api\//,
  
  // Real-time routes - always fresh
  REALTIME_ROUTES: /\/(live|matches\/live)\//,
  
  // Cacheable API patterns
  CACHEABLE_API: /\/(players|matches|statistics)$/
}

// Install event - pre-cache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v2.1.0...')
  
  event.waitUntil(
    (async () => {
      try {
        // Open static cache
        const cache = await caches.open(STATIC_CACHE)
        
        // Pre-cache essential assets
        for (const url of STATIC_ASSETS) {
          try {
            const response = await fetch(url, { cache: 'no-cache' })
            if (response.ok) {
              await cache.put(url, response)
              console.log('[SW] Pre-cached:', url)
            }
          } catch (error) {
            console.log('[SW] Failed to pre-cache:', url)
          }
        }
        
        // Skip waiting to activate immediately
        await self.skipWaiting()
        console.log('[SW] Installation complete')
      } catch (error) {
        console.error('[SW] Install failed:', error)
        await self.skipWaiting()
      }
    })()
  )
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v2.1.0...')
  
  event.waitUntil(
    (async () => {
      try {
        // Delete old caches
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
        
        // Take control of all clients
        await self.clients.claim()
        
        // Prefetch common routes in background
        if (!isDevelopment) {
          setTimeout(() => {
            prefetchRoutes()
          }, 5000) // Wait 5s after activation
        }
        
        console.log('[SW] Activation complete - ready for fast navigation!')
      } catch (error) {
        console.error('[SW] Activation failed:', error)
      }
    })()
  )
})

// Fetch event - intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') return
  
  // Skip external requests
  if (url.origin !== self.location.origin) return
  
  // Skip development hot reload
  if (isDevelopment && (
    url.pathname.includes('webpack') ||
    url.pathname.includes('hot-update') ||
    url.pathname.includes('_next/development')
  )) return
  
  // API routes - never cache
  if (CACHE_STRATEGIES.API_ROUTES.test(url.pathname)) return
  
  // Real-time routes - always fresh
  if (CACHE_STRATEGIES.REALTIME_ROUTES.test(url.pathname)) {
    event.respondWith(networkFirst(request))
    return
  }
  
  // Static immutable assets - cache forever
  if (CACHE_STRATEGIES.STATIC_IMMUTABLE.test(request.url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }
  
  // Build chunks - stale while revalidate for fast navigation
  if (CACHE_STRATEGIES.BUILD_CHUNKS.test(request.url)) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE))
    return
  }
  
  // Images - cache first
  if (CACHE_STRATEGIES.IMAGES.test(request.url)) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE))
    return
  }
  
  // App routes (navigation) - stale while revalidate for instant navigation
  if (request.mode === 'navigate' || CACHE_STRATEGIES.APP_ROUTES.test(url.pathname)) {
    event.respondWith(navigationStaleWhileRevalidate(request))
    return
  }
  
  // Default - stale while revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE))
})

// Strategy: Cache First (for immutable assets)
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      // Return from cache immediately for speed
      return cachedResponse
    }
    
    // Not in cache, fetch and cache for next time
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('[SW] Cache first failed:', error)
    throw error
  }
}

// Strategy: Stale While Revalidate (for build chunks)
async function staleWhileRevalidate(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    // Fetch fresh version in background
    const fetchPromise = fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    
    // Return cached version immediately if available
    return cachedResponse || fetchPromise
  } catch (error) {
    console.error('[SW] Stale while revalidate failed:', error)
    const cachedResponse = await caches.match(request)
    return cachedResponse || Promise.reject(error)
  }
}

// Strategy: Network First (for real-time data)
async function networkFirst(request) {
  try {
    const response = await fetch(request, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
    return response
  } catch (error) {
    console.error('[SW] Network first failed:', error)
    throw error
  }
}

// Strategy: Navigation with Stale While Revalidate (for fast page loads)
async function navigationStaleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  // Fetch fresh version in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(error => {
    console.log('[SW] Navigation fetch failed:', error)
    return cachedResponse || getOfflinePage()
  })
  
  // Return cached immediately if available, otherwise wait for network
  if (cachedResponse) {
    // Update in background but return cached immediately
    fetchPromise.then(() => {
      console.log('[SW] Updated navigation cache in background')
    })
    return cachedResponse
  }
  
  // No cache, must wait for network
  return fetchPromise
}

// Strategy: Network First with Offline Fallback (for navigation)
async function networkFirstWithOffline(request) {
  try {
    // Try network first
    const response = await fetch(request)
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // If it's a navigation request, return offline page
    if (request.mode === 'navigate') {
      return getOfflinePage()
    }
    
    throw error
  }
}

// Offline fallback page
async function getOfflinePage() {
  const cachedOffline = await caches.match('/')
  if (cachedOffline) {
    return cachedOffline
  }
  
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Tenis.click - Offline</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            text-align: center;
            padding: 20px;
          }
          .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 400px;
            width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          h1 { 
            font-size: 2.5rem; 
            margin-bottom: 20px;
            font-weight: 700;
          }
          p { 
            font-size: 1.1rem; 
            margin-bottom: 30px; 
            opacity: 0.9;
            line-height: 1.5;
          }
          button { 
            background: linear-gradient(45deg, #39FF14, #32CD32);
            color: black;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
            box-shadow: 0 4px 15px rgba(57, 255, 20, 0.3);
          }
          button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(57, 255, 20, 0.4);
          }
          .icon {
            font-size: 4rem;
            margin-bottom: 20px;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <span class="icon">🎾</span>
          <h1>Tenis.click</h1>
          <p>You're currently offline. Your cached data is still available.</p>
          <button onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
    </html>
  `, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}

// Performance monitoring
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {}
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'GET_CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0]?.postMessage({ type: 'CACHE_STATS', stats })
      })
      break
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0]?.postMessage({ type: 'CACHE_CLEARED' })
      })
      break
      
    default:
      break
  }
})

// Get cache statistics
async function getCacheStats() {
  const cacheNames = await caches.keys()
  const stats = {}
  
  for (const name of cacheNames) {
    const cache = await caches.open(name)
    const keys = await cache.keys()
    stats[name] = {
      count: keys.length,
      urls: keys.map(req => req.url)
    }
  }
  
  return stats
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.map(name => caches.delete(name)))
  console.log('[SW] All caches cleared')
}

// Prefetch common routes for faster navigation
async function prefetchRoutes() {
  const cache = await caches.open(DYNAMIC_CACHE)
  
  for (const route of PREFETCH_ROUTES) {
    try {
      const response = await fetch(route, {
        credentials: 'same-origin',
        headers: {
          'X-SW-Prefetch': 'true'
        }
      })
      
      if (response.ok) {
        await cache.put(route, response)
        console.log('[SW] Prefetched route:', route)
      }
    } catch (error) {
      console.log('[SW] Failed to prefetch route:', route)
    }
  }
}

// Log service worker ready
console.log('[SW] Service Worker v2.1.0 loaded - Navigation optimized!')