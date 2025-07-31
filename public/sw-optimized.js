/**
 * Optimized Service Worker for Tennis Scoring App
 * Implements advanced caching strategies and performance optimizations
 */

const CACHE_VERSION = 'v2.1.0'
const STATIC_CACHE = `tennis-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `tennis-dynamic-${CACHE_VERSION}`
const API_CACHE = `tennis-api-${CACHE_VERSION}`
const IMAGE_CACHE = `tennis-images-${CACHE_VERSION}`

// Cache configuration
const CACHE_CONFIG = {
  static: {
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    maxEntries: 100,
  },
  dynamic: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    maxEntries: 50,
  },
  api: {
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 100,
  },
  images: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 200,
  },
}

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/manifest.json',
  '/_next/static/css/app.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/pages/_app.js',
  '/fonts/satoshi-variable.woff2',
  '/fonts/inter-variable.woff2',
  '/fonts/jetbrains-mono-variable.woff2',
]

// Resources that should always be fetched from network
const NETWORK_FIRST = [
  '/api/matches',
  '/api/players',
  '/api/statistics',
  '/api/performance',
]

// Resources that can be served stale while revalidating
const STALE_WHILE_REVALIDATE = [
  '/_next/static/',
  '/icons/',
  '/images/',
]

// Install event - cache critical resources
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...')
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Caching critical resources...')
        return cache.addAll(CRITICAL_RESOURCES)
      }),
      self.skipWaiting()
    ])
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('✅ Service Worker activating...')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName.startsWith('tennis-') && 
              !cacheName.includes(CACHE_VERSION)
            )
            .map(cacheName => {
              console.log('🗑️ Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return
  }

  // Handle different resource types with appropriate strategies
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  } else if (isAPIRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE))
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
  } else if (shouldStaleWhileRevalidate(url)) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE))
  } else {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
  }
})

// Cache strategies implementation
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const cached = await cache.match(request)
    
    if (cached) {
      // Check if cache is still valid
      const cacheTime = await getCacheTime(cache, request)
      const maxAge = CACHE_CONFIG[getCacheType(cacheName)]?.maxAge || 0
      
      if (Date.now() - cacheTime < maxAge) {
        return cached
      }
    }

    // Fetch from network
    const response = await fetch(request)
    
    if (response.ok) {
      // Clone and cache the response
      const responseClone = response.clone()
      await cache.put(request, responseClone)
      await setCacheTime(cache, request)
      
      // Cleanup old entries
      await cleanupCache(cache, cacheName)
    }
    
    return response
  } catch (error) {
    console.error('Cache first failed:', error)
    
    // Fallback to cache if network fails
    const cache = await caches.open(cacheName)
    return await cache.match(request) || new Response('Offline', { status: 503 })
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(cacheName)
      const responseClone = response.clone()
      await cache.put(request, responseClone)
      await setCacheTime(cache, request)
      await cleanupCache(cache, cacheName)
    }
    
    return response
  } catch (error) {
    console.error('Network first failed:', error)
    
    // Fallback to cache
    const cache = await caches.open(cacheName)
    const cached = await cache.match(request)
    
    if (cached) {
      return cached
    }
    
    // Return offline response for API requests
    if (isAPIRequest(new URL(request.url))) {
      return new Response(JSON.stringify({ 
        error: 'Offline', 
        cached: false 
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response('Offline', { status: 503 })
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  // Always try to fetch from network (but don't await)
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const responseClone = response.clone()
      cache.put(request, responseClone)
      setCacheTime(cache, request)
      cleanupCache(cache, cacheName)
    }
    return response
  }).catch(() => {
    // Network failed, but we might have cached version
    return null
  })
  
  // Return cached version immediately if available
  if (cached) {
    return cached
  }
  
  // Wait for network if no cache
  return await fetchPromise || new Response('Offline', { status: 503 })
}

// Utility functions
function isStaticAsset(url) {
  return url.pathname.includes('/_next/static/') ||
         url.pathname.includes('/fonts/') ||
         url.pathname.includes('/icons/') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.woff2')
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') ||
         NETWORK_FIRST.some(path => url.pathname.startsWith(path))
}

function isImageRequest(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname)
}

function shouldStaleWhileRevalidate(url) {
  return STALE_WHILE_REVALIDATE.some(path => url.pathname.includes(path))
}

function getCacheType(cacheName) {
  if (cacheName.includes('static')) return 'static'
  if (cacheName.includes('api')) return 'api'
  if (cacheName.includes('images')) return 'images'
  return 'dynamic'
}

async function getCacheTime(cache, request) {
  const timeKey = `${request.url}:timestamp`
  const timeResponse = await cache.match(timeKey)
  
  if (timeResponse) {
    const text = await timeResponse.text()
    return parseInt(text) || 0
  }
  
  return 0
}

async function setCacheTime(cache, request) {
  const timeKey = `${request.url}:timestamp`
  const timeResponse = new Response(Date.now().toString())
  await cache.put(timeKey, timeResponse)
}

async function cleanupCache(cache, cacheName) {
  const cacheType = getCacheType(cacheName)
  const maxEntries = CACHE_CONFIG[cacheType]?.maxEntries || 100
  
  const keys = await cache.keys()
  
  // Filter out timestamp entries
  const resourceKeys = keys.filter(key => !key.url.includes(':timestamp'))
  
  if (resourceKeys.length > maxEntries) {
    // Sort by timestamp and remove oldest entries
    const entries = await Promise.all(
      resourceKeys.map(async key => ({
        key,
        timestamp: await getCacheTime(cache, key)
      }))
    )
    
    entries.sort((a, b) => a.timestamp - b.timestamp)
    
    // Remove oldest entries
    const toDelete = entries.slice(0, entries.length - maxEntries)
    
    await Promise.all(
      toDelete.map(entry => cache.delete(entry.key))
    )
    
    console.log(`🧹 Cleaned up ${toDelete.length} old entries from ${cacheName}`)
  }
}

// Message handling for cache management
self.addEventListener('message', event => {
  const { type, data } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CLEAR_CACHE':
      clearSpecificCache(data.cacheName)
      break
      
    case 'PRELOAD_RESOURCES':
      preloadResources(data.resources)
      break
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status)
      })
      break
  }
})

async function clearSpecificCache(cacheName) {
  try {
    await caches.delete(cacheName)
    console.log(`🗑️ Cleared cache: ${cacheName}`)
  } catch (error) {
    console.error('Failed to clear cache:', error)
  }
}

async function preloadResources(resources) {
  try {
    const cache = await caches.open(STATIC_CACHE)
    await cache.addAll(resources)
    console.log(`📦 Preloaded ${resources.length} resources`)
  } catch (error) {
    console.error('Failed to preload resources:', error)
  }
}

async function getCacheStatus() {
  const cacheNames = await caches.keys()
  const status = {}
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const keys = await cache.keys()
    status[cacheName] = keys.length
  }
  
  return status
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineActions())
  }
})

async function syncOfflineActions() {
  try {
    // Sync any offline tennis scoring actions
    const offlineActions = await getOfflineActions()
    
    for (const action of offlineActions) {
      try {
        await fetch(action.url, action.options)
        await removeOfflineAction(action.id)
      } catch (error) {
        console.error('Failed to sync offline action:', error)
      }
    }
    
    console.log(`✅ Synced ${offlineActions.length} offline actions`)
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

async function getOfflineActions() {
  // In a real implementation, this would read from IndexedDB
  return []
}

async function removeOfflineAction(id) {
  // Remove synced action from storage
  console.log('Removing synced action:', id)
}

console.log('🚀 Tennis Service Worker loaded successfully')