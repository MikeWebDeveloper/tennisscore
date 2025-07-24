// TennisScore Service Worker - Enhanced Caching & PWA with IndexedDB
// Version: 2.3.0 - Fixed Vercel Production Offline Mode Issue
const CACHE_NAME = 'tennisscore-v2.3.0'
const DYNAMIC_CACHE = 'tennisscore-dynamic-v2.3.0'
const API_CACHE = 'tennisscore-api-v2.3.0'
const OFFLINE_CACHE = 'tennisscore-offline-v2.3.0'

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

// Essential static assets with versioning
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-apple-touch.png'
]

// Critical pages for offline access - temporarily disabled due to auth requirements
const OFFLINE_PAGES = [
  // '/dashboard', // Requires authentication - can't cache during install
  // '/matches',   // Requires authentication - can't cache during install
  // '/statistics', // Requires authentication - can't cache during install
  // '/players'    // Requires authentication - can't cache during install
]

// Cache strategies with enhanced patterns
const CACHE_STRATEGIES = {
  PRODUCTION_ASSETS: /\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|css|js)$/,
  MANIFEST: /\/manifest\.json$/,
  ICONS: /\/icons\//,
  API_ROUTES: /\/api\/(matches|players|stats|dashboard|tournaments)/,
  API_DATA: /\/api\/.+/,
  STATIC_PAGES: /\/(dashboard|matches|players|statistics)$/,
  NEXT_STATIC: /\/_next\/static\//,
  NEXT_CHUNKS: /\/_next\/chunks\//,
  FONTS: /\.(woff|woff2|ttf|eot)$/,
  IMAGES: /\.(png|jpg|jpeg|gif|webp|svg)$/
}

// Requests to bypass (never intercept) - Enhanced for Vercel production
const BYPASS_PATTERNS = [
  // Development assets
  /webpack/,
  /\.hot-update\./,
  /hmr/,
  /_dev/,
  
  // Critical API routes (auth, real-time)
  /\/api\/auth/,
  /\/api\/realtime/,
  /\/api\/live/,
  
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
  /appwrite\.io/,
  
  // Live match pages should always be fresh
  /\/live\//,
  /\/matches\/live\//,
  
  // Vercel-specific patterns
  /_next\/image/,
  /_next\/webpack-hmr/,
  /_next\/static\/chunks\/.*\.js/,
  /_next\/static\/css\/.*\.css/,
  
  // Navigation requests (pages) - Let them pass through naturally
  /\/dashboard/,
  /\/matches/,
  /\/players/,
  /\/statistics/,
  /\/admin/,
  /\/settings/,
  /\/player-statistics/
]

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v2.3.0...')
  
  if (isDevelopment) {
    console.log('[SW] Development mode - skipping cache setup')
    return self.skipWaiting()
  }
  
  event.waitUntil(
    (async () => {
      try {
        const [staticCache, offlineCache] = await Promise.all([
          caches.open(CACHE_NAME),
          caches.open(OFFLINE_CACHE)
        ])
        
        console.log('[SW] Caching essential assets...')
        
        // Cache static assets
        const staticPromises = STATIC_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, { 
              method: 'GET',
              cache: 'no-cache',
              redirect: 'follow'
            })
            if (response.ok) {
              await staticCache.put(url, response)
              console.log('[SW] Cached static:', url)
            }
          } catch (error) {
            console.log('[SW] Skipped static:', url, '-', error.message)
          }
        })
        
        // Cache critical pages for offline access
        const pagePromises = OFFLINE_PAGES.map(async (url) => {
          try {
            const response = await fetch(url, {
              method: 'GET',
              redirect: 'follow',
              credentials: 'include'
            })
            if (response.ok) {
              await offlineCache.put(url, response)
              console.log('[SW] Cached page:', url)
            }
          } catch (error) {
            console.log('[SW] Skipped page:', url, '-', error.message)
          }
        })
        
        await Promise.all([...staticPromises, ...pagePromises])
        await self.skipWaiting()
        console.log('[SW] Installation complete with offline support')
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
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE && cacheName !== OFFLINE_CACHE) {
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
    // Also bypass Next.js dev assets
    if (/_next\//.test(request.url)) {
      return true
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
  
  // Navigation requests should be bypassed in production to prevent offline mode issues
  if (request.mode === 'navigate') {
    return true
  }
  
  return false
}

// Helper: Check if this is a live match route
function isLiveMatchRoute(request) {
  const url = new URL(request.url)
  return url.pathname.includes('/live/') || url.pathname.includes('/matches/live/')
}

// Helper: Check if this is Safari browser
function isSafari() {
  try {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  } catch {
    return false
  }
}

// Helper: Check if this is a Vercel preview URL
function isVercelPreview(request) {
  const url = new URL(request.url)
  return url.hostname.includes('vercel.app') || url.hostname.includes('-git-')
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
    // For live match routes, always go network-first with no-cache
    if (isLiveMatchRoute(request)) {
      return await networkFirstNoCache(request)
    }
    
    // Next.js static assets handling
    if (CACHE_STRATEGIES.NEXT_STATIC.test(request.url) || CACHE_STRATEGIES.NEXT_CHUNKS.test(request.url)) {
      return await cacheFirst(request, DYNAMIC_CACHE)
    }
    
    // Production asset handling
    if (CACHE_STRATEGIES.PRODUCTION_ASSETS.test(request.url)) {
      return await cacheFirst(request, DYNAMIC_CACHE)
    }
    
    // API routes handling with enhanced stale-while-revalidate
    if (CACHE_STRATEGIES.API_ROUTES.test(request.url) || CACHE_STRATEGIES.API_DATA.test(request.url)) {
      return await staleWhileRevalidate(request, API_CACHE)
    }
    
    // Fonts handling with long-term caching
    if (CACHE_STRATEGIES.FONTS.test(request.url)) {
      return await cacheFirst(request, DYNAMIC_CACHE)
    }
    
    // Images handling
    if (CACHE_STRATEGIES.IMAGES.test(request.url)) {
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
    
    // Static pages handling
    if (CACHE_STRATEGIES.STATIC_PAGES.test(request.url)) {
      return await networkFirstWithOfflineFallback(request)
    }
    
    // Navigation requests (pages) - Already bypassed in shouldBypassRequest
    // This code should never be reached for navigation requests
    
    // Default: Network with fallback
    return await networkWithFallback(request)
    
  } catch (error) {
    console.error('[SW] Request handler failed:', error)
    return await networkWithFallback(request)
  }
}

// Network-first with no-cache strategy for live matches
async function networkFirstNoCache(request) {
  try {
    const isPreview = isVercelPreview(request)
    const safariUser = isSafari()
    
    // Enhanced cache control headers for Safari mobile and Vercel previews
    const headers = {
      ...request.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    }
    
    // Add additional headers for Safari mobile on Vercel previews
    if (safariUser && isPreview) {
      headers['X-Safari-Mobile-Fix'] = 'true'
      headers['Expires'] = '0'
      headers['Last-Modified'] = new Date().toUTCString()
    }
    
    const response = await fetch(request, {
      method: 'GET',
      headers,
      mode: 'cors',
      credentials: request.credentials,
      redirect: 'follow',
      cache: 'no-store'
    })
    
    // Enhanced cache-control headers for response based on context
    const modifiedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers)
    })
    
    modifiedResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    modifiedResponse.headers.set('Pragma', 'no-cache')
    modifiedResponse.headers.set('Expires', '0')
    
    // Additional Safari mobile headers
    if (safariUser) {
      modifiedResponse.headers.set('X-Safari-Cache-Fix', 'applied')
      modifiedResponse.headers.set('Last-Modified', new Date().toUTCString())
    }
    
    // Mark Vercel preview responses for debugging
    if (isPreview) {
      modifiedResponse.headers.set('X-Vercel-Preview', 'true')
    }
    
    return modifiedResponse
  } catch (error) {
    console.error('[SW] Network-first failed for live match:', error)
    // Don't fall back to cache for live matches
    throw error
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

// Stale-while-revalidate strategy for API routes
async function staleWhileRevalidate(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    // Always try to fetch fresh data in background
    const fetchPromise = fetchAndCache(request, cache).catch(() => {
      // Ignore fetch failures - we'll use cached version
      console.log('[SW] Background fetch failed for API route:', request.url)
    })
    
    if (cachedResponse) {
      // Return cached version immediately, fresh data updates in background
      // fetchPromise runs in background (not awaited)
      return cachedResponse
    }
    
    // No cached version, wait for network
    return await fetchPromise
    
  } catch (error) {
    console.error('[SW] Stale-while-revalidate failed:', error)
    return await networkWithFallback(request)
  }
}

// Network-first with offline fallback for pages
async function networkFirstWithOfflineFallback(request) {
  try {
    // Try network first
    const response = await fetch(request, { 
      redirect: 'follow',
      cache: 'default'
    })
    
    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(OFFLINE_CACHE)
      cache.put(request, response.clone()).catch(() => {
        // Ignore cache errors
      })
    }
    
    return response
    
  } catch (error) {
    console.log('[SW] Network failed for page, trying offline cache:', request.url)
    
    // Try offline cache
    const cache = await caches.open(OFFLINE_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // No cached version, return offline fallback
    return await getOfflineFallback()
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
      
      // Clean up cache if it gets too large
      cleanupCache(cache).catch(() => {
        // Ignore cleanup errors
      })
    }
    
    return response
  } catch (error) {
    console.error('[SW] Fetch and cache failed for:', request.url, error)
    throw error
  }
}

// Cache cleanup with size management
async function cleanupCache(cache) {
  try {
    const keys = await cache.keys()
    
    // If cache has more than 100 items, remove oldest ones
    if (keys.length > 100) {
      const keysToDelete = keys.slice(0, keys.length - 80) // Keep 80 newest
      await Promise.all(
        keysToDelete.map(key => cache.delete(key))
      )
      console.log('[SW] Cache cleaned up, removed', keysToDelete.length, 'old entries')
    }
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error)
  }
}

// Navigation requests are now bypassed in shouldBypassRequest() to prevent offline mode issues
// This prevents the service worker from interfering with normal page navigation on Vercel

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
        <title>TennisScore - Offline Mode</title>
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
            max-width: 500px;
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
            margin-bottom: 20px; 
            opacity: 0.9;
            line-height: 1.5;
          }
          .features {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
          }
          .features h3 {
            margin-bottom: 10px;
            color: #39FF14;
          }
          .features li {
            margin: 8px 0;
            opacity: 0.8;
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
            margin: 10px;
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
          <span class="icon">📶</span>
          <h1>Offline Mode</h1>
          <p>TennisScore is running offline! Your cached data is still available.</p>
          
          <div class="features">
            <h3>Available Offline:</h3>
            <ul>
              <li>✅ View recent matches and statistics</li>
              <li>✅ Browse player profiles</li>
              <li>✅ Access dashboard insights</li>
              <li>⏳ New matches will sync when online</li>
            </ul>
          </div>
          
          <button onclick="window.location.href='/login'">Go to Login</button>
          <button onclick="window.location.reload()">Retry Connection</button>
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
      event.ports[0]?.postMessage({ version: '2.3.0' })
      break
      
    default:
      console.log('[SW] Unknown message type:', type)
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