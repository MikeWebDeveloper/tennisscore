// TennisScore Service Worker - Production Ready
// Version: 1.3.1
const CACHE_NAME = 'tennisscore-v1.3.1'
const DYNAMIC_CACHE = 'tennisscore-dynamic-v1.3.1'

// Robust development detection
const isDevelopment = (() => {
  try {
    return self.location.hostname === 'localhost' || 
           self.location.hostname === '127.0.0.1' ||
           self.location.hostname.includes('localhost') ||
           self.location.port === '3000' ||
           self.location.port === '3001' ||
           self.location.href.includes('localhost')
  } catch {
    return false
  }
})()

// Essential static assets (production only)
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Cache strategies
const CACHE_STRATEGIES = {
  PRODUCTION_ASSETS: /\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)$/,
  MANIFEST: /\/manifest\.json$/,
  ICONS: /\/icons\//
}

// Requests to bypass (never intercept)
const BYPASS_PATTERNS = [
  // Development assets
  /_next\//,
  /webpack/,
  /\.hot-update\./,
  /hmr/,
  /_dev/,
  
  // API routes
  /\/api\//,
  
  // Service Worker itself
  /sw\.js$/,
  
  // DevTools and development
  /\.well-known/,
  /chrome-extension/,
  /moz-extension/,
  
  // Authentication routes (critical for login)
  /\/login/,
  /\/signup/,
  /\/auth/,
  
  // Don't intercept same-origin API calls
  /appwrite\.io/
]

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v1.3.1...')
  
  if (isDevelopment) {
    console.log('[SW] Development mode - skipping cache setup')
    return self.skipWaiting()
  }
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME)
        console.log('[SW] Caching essential assets...')
        
        // Cache assets one by one with error handling
        for (const url of STATIC_ASSETS) {
          try {
            const response = await fetch(url, { 
              method: 'GET',
              cache: 'no-cache',
              redirect: 'follow'
            })
            if (response.ok) {
              await cache.put(url, response)
              console.log('[SW] Cached:', url)
            }
          } catch (error) {
            console.log('[SW] Skipped:', url, '-', error.message)
          }
        }
        
        await self.skipWaiting()
        console.log('[SW] Installation complete')
      } catch (error) {
        console.error('[SW] Install failed:', error)
        await self.skipWaiting() // Still activate even if caching fails
      }
    })()
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
        
        // Take control of all pages
        await self.clients.claim()
        console.log('[SW] Activation complete')
      } catch (error) {
        console.error('[SW] Activation failed:', error)
      }
    })()
  )
})

// Helper: Should we bypass this request?
function shouldBypassRequest(request) {
  // Always bypass non-GET requests
  if (request.method !== 'GET') {
    return true
  }
  
  const url = new URL(request.url)
  
  // Bypass external origins
  if (url.origin !== self.location.origin) {
    return true
  }
  
  // In development, bypass almost everything except manifest/icons
  if (isDevelopment) {
    if (CACHE_STRATEGIES.MANIFEST.test(request.url) || 
        CACHE_STRATEGIES.ICONS.test(request.url)) {
      return false // Don't bypass - we want to handle these
    }
    return true // Bypass everything else in development
  }
  
  // Check against bypass patterns
  const urlString = request.url
  const pathname = url.pathname
  
  for (const pattern of BYPASS_PATTERNS) {
    if (pattern.test(urlString) || pattern.test(pathname)) {
      return true
    }
  }
  
  return false
}

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  // Bypass check
  if (shouldBypassRequest(request)) {
    return // Let browser handle naturally
  }
  
  // Handle the request
  event.respondWith(handleRequest(request))
})

// Main request handler
async function handleRequest(request) {
  try {
    
    // Production asset handling
    if (CACHE_STRATEGIES.PRODUCTION_ASSETS.test(request.url)) {
      return await cacheFirst(request, DYNAMIC_CACHE)
    }
    
    // Manifest handling
    if (CACHE_STRATEGIES.MANIFEST.test(request.url)) {
      return await cacheFirst(request, CACHE_NAME)
    }
    
    // Icon handling
    if (CACHE_STRATEGIES.ICONS.test(request.url)) {
      return await cacheFirst(request, DYNAMIC_CACHE)
    }
    
    // Navigation requests (pages)
    if (request.mode === 'navigate') {
      return await handleNavigation(request)
    }
    
    // Default: Network with fallback
    return await networkWithFallback(request)
    
  } catch (error) {
    console.error('[SW] Request handler failed:', error)
    return await networkWithFallback(request)
  }
}

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      // Return cached version, update in background
      fetchAndCache(request, cache).catch(() => {
        // Ignore background update failures
      })
      return cachedResponse
    }
    
    // Not in cache, fetch and cache
    return await fetchAndCache(request, cache)
    
  } catch (error) {
    console.error('[SW] Cache-first failed:', error)
    return await networkWithFallback(request)
  }
}

// Helper: Fetch and cache
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request, { 
      redirect: 'follow',
      cache: 'default',
      mode: request.mode === 'navigate' ? 'cors' : request.mode
    })
    
    if (response.ok && response.status === 200) {
      // Clone before caching (response can only be consumed once)
      cache.put(request, response.clone()).catch(() => {
        // Ignore cache errors
      })
    }
    
    return response
  } catch (error) {
    console.error('[SW] Fetch and cache failed for:', request.url, error)
    throw error
  }
}

// Handle navigation requests
async function handleNavigation(request) {
  try {
    // Create a new request with explicit redirect handling for proxy scenarios
    const url = request.url
    const navigationRequest = new Request(url, {
      method: 'GET',
      headers: request.headers,
      mode: request.mode === 'navigate' ? 'cors' : request.mode,
      credentials: request.credentials,
      redirect: 'follow',
      cache: 'default'
    })
    
    const response = await fetch(navigationRequest)
    
    return response
    
  } catch (error) {
    console.error('[SW] Navigation failed for:', request.url, error)
    
    // Only provide offline fallback in production
    if (!isDevelopment) {
      return await getOfflineFallback()
    }
    
    // In development, let the error propagate
    throw error
  }
}

// Network with graceful fallback
async function networkWithFallback(request) {
  try {
    return await fetch(request, { 
      redirect: 'follow',
      cache: 'default'
    })
  } catch (error) {
    console.error('[SW] Network request failed:', error)
    
    // Try to serve from cache as last resort
    if (!isDevelopment) {
      const cache = await caches.open(DYNAMIC_CACHE)
      const cachedResponse = await cache.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
    }
    
    throw error
  }
}

// Offline fallback page
async function getOfflineFallback() {
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>TennisScore - Offline</title>
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
          <h1>TennisScore</h1>
          <p>You're currently offline. Please check your internet connection to continue using the app.</p>
          <button onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
    </html>
  `, {
    status: 200,
    headers: { 
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  })
}

// Message handling
self.addEventListener('message', (event) => {
  const { type } = event.data || {}
  
  switch (type) {
    case 'SKIP_WAITING':
      console.log('[SW] Skipping waiting...')
      self.skipWaiting()
      break
      
    case 'CLEAR_CACHE':
      console.log('[SW] Clearing all caches...')
      caches.keys().then(names => {
        return Promise.all(names.map(name => caches.delete(name)))
      }).then(() => {
        console.log('[SW] All caches cleared')
      }).catch(error => {
        console.error('[SW] Cache clear failed:', error)
      })
      break
      
    case 'GET_VERSION':
      event.ports[0]?.postMessage({ version: '1.3.1' })
      break
  }
})

// Error handling
self.addEventListener('error', (event) => {
  console.error('[SW] Global error:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason)
  event.preventDefault() // Prevent browser console error
}) 