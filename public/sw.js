// TennisScore Service Worker - Development Optimized
// Version: 1.2.2
const CACHE_NAME = 'tennisscore-v1.2.2'
const DYNAMIC_CACHE = 'tennisscore-dynamic-v1.2.2'

// Detect development mode
const isDevelopment = self.location.hostname === 'localhost' || 
                     self.location.hostname === '127.0.0.1' ||
                     self.location.port === '3000'

// Minimal static assets for production only
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Very conservative caching strategies
const CACHE_STRATEGIES = {
  // Only cache manifest and icons in development
  PRODUCTION_ASSETS: /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
  MANIFEST: /\/manifest\.json$/
}

// Aggressive bypass patterns for development
const BYPASS_PATTERNS = [
  // All Next.js development requests
  /_next\//,
  
  // All webpack and development assets
  /webpack/,
  /\.hot-update\./,
  /hmr/,
  /_dev/,
  
  // All API routes
  /\/api\//,
  
  // Service Worker itself
  /sw\.js/,
  
  // Chrome DevTools
  /\.well-known/,
  
  // All page routes in development (let Next.js handle routing)
  isDevelopment ? /^\// : /^$/
]

// Install event - minimal caching
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker (dev-optimized)...')
  
  if (isDevelopment) {
    console.log('[SW] Development mode detected - minimal caching')
    return self.skipWaiting()
  }
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('[SW] Caching essential assets only')
        
        for (const url of STATIC_ASSETS) {
          try {
            const response = await fetch(url)
            if (response.ok) {
              await cache.put(url, response)
              console.log('[SW] Cached:', url)
            }
          } catch (error) {
            console.log('[SW] Skipped:', url, error.message)
          }
        }
      })
      .then(() => self.skipWaiting())
      .catch(error => console.log('[SW] Install failed:', error.message))
  )
})

// Activate event - clean up
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      ).then(() => self.clients.claim())
    })
  )
})

// Helper function to check if request should be bypassed
function shouldBypassRequest(request) {
  // In development, bypass almost everything
  if (isDevelopment) {
    const url = new URL(request.url)
    
    // Only handle manifest and icons
    if (CACHE_STRATEGIES.MANIFEST.test(request.url) || 
        (CACHE_STRATEGIES.PRODUCTION_ASSETS.test(request.url) && url.pathname.includes('/icons/'))) {
      return false
    }
    
    return true // Bypass everything else in development
  }
  
  // In production, use normal bypass patterns
  if (request.method !== 'GET') {
    return true
  }
  
  const url = new URL(request.url)
  
  for (const pattern of BYPASS_PATTERNS) {
    if (pattern.test(request.url) || pattern.test(url.pathname)) {
      return true
    }
  }
  
  if (url.origin !== self.location.origin) {
    return true
  }
  
  return false
}

// Fetch event - minimal handling
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  // Check if we should bypass this request
  if (shouldBypassRequest(request)) {
    return // Let the request pass through naturally
  }
  
  // Only handle essential requests
  event.respondWith(handleRequest(request))
})

async function handleRequest(request) {
  try {
    // In development, only handle manifest and icons
    if (isDevelopment) {
      if (CACHE_STRATEGIES.MANIFEST.test(request.url)) {
        return await cacheFirst(request, CACHE_NAME)
      }
      
      if (CACHE_STRATEGIES.PRODUCTION_ASSETS.test(request.url)) {
        return await cacheFirst(request, DYNAMIC_CACHE)
      }
      
      // Everything else goes to network
      return await fetch(request)
    }
    
    // Production handling (when not in development)
    if (CACHE_STRATEGIES.PRODUCTION_ASSETS.test(request.url)) {
      return await cacheFirst(request, DYNAMIC_CACHE)
    }
    
    if (CACHE_STRATEGIES.MANIFEST.test(request.url)) {
      return await cacheFirst(request, CACHE_NAME)
    }
    
    // Navigation requests - network only to avoid stale content
    if (request.mode === 'navigate') {
      try {
        return await fetch(request)
      } catch (error) {
        // Only provide offline fallback in production
        return await getOfflineFallback()
      }
    }
    
    // Default: network only
    return await fetch(request)
    
  } catch (error) {
    console.log('[SW] Request failed:', error.message)
    throw error
  }
}

// Simple cache first strategy
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone()).catch(() => {
        // Ignore cache errors
      })
    }
    
    return networkResponse
  } catch (error) {
    throw error
  }
}

// Minimal offline fallback (production only)
async function getOfflineFallback() {
  if (isDevelopment) {
    throw new Error('Network error in development')
  }
  
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>TennisScore - Offline</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: system-ui, sans-serif; 
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
          button { 
            padding: 12px 24px; 
            background: #007bff; 
            color: white; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎾 TennisScore</h1>
          <p>You're offline. Please check your connection.</p>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      </body>
    </html>
  `, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  })
}

// Message handling
self.addEventListener('message', (event) => {
  const { type } = event.data || {}
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CLEAR_CACHE':
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name))
      })
      break
  }
})

// Minimal error handling
self.addEventListener('error', (event) => {
  console.log('[SW] Error:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.log('[SW] Unhandled promise rejection:', event.reason)
}) 