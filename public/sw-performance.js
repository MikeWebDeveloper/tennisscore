// High-Performance Service Worker for Tenis.click App
// Optimized for Core Web Vitals and tennis-specific data patterns

const CACHE_VERSION = 'v3.0.0-perf'
const STATIC_CACHE = `tenisclick-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `tenisclick-dynamic-${CACHE_VERSION}`
const API_CACHE = `tenisclick-api-${CACHE_VERSION}`
const IMAGE_CACHE = `tenisclick-images-${CACHE_VERSION}`

// Enhanced caching strategies for different content types
const CACHE_STRATEGIES = {
  static: {
    name: STATIC_CACHE,
    strategy: 'CacheFirst',
    maxAge: 31536000, // 1 year
    maxEntries: 100
  },
  api: {
    name: API_CACHE,
    strategy: 'NetworkFirst',
    maxAge: 300, // 5 minutes
    maxEntries: 200
  },
  images: {
    name: IMAGE_CACHE,
    strategy: 'CacheFirst', 
    maxAge: 2592000, // 30 days
    maxEntries: 150
  },
  dynamic: {
    name: DYNAMIC_CACHE,
    strategy: 'StaleWhileRevalidate',
    maxAge: 86400, // 1 day
    maxEntries: 100
  }
}

// Performance-critical resources to precache
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/_next/static/css/',
  '/_next/static/chunks/webpack-',
  '/_next/static/chunks/framework-',
  '/_next/static/chunks/main-',
  '/_next/static/chunks/pages/_app-'
]

// Tennis-specific URL patterns
const URL_PATTERNS = {
  api: /^https?:\/\/.*\/api\//,
  static: /\/_next\/static\//,
  images: /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i,
  appwrite: /cloud\.appwrite\.io/,
  fonts: /\.(woff2?|eot|ttf|otf)$/i,
  matches: /\/matches\//,
  players: /\/players\//,
  statistics: /\/statistics\//,
  dashboard: /\/dashboard/
}

// Performance optimization utilities
class PerformanceOptimizer {
  static compressData(data) {
    try {
      return JSON.stringify(data)
    } catch {
      return data
    }
  }

  static decompressData(data) {
    try {
      return JSON.parse(data)
    } catch {
      return data
    }
  }

  static shouldCompress(response) {
    const contentType = response.headers.get('content-type') || ''
    const contentLength = parseInt(response.headers.get('content-length') || '0')
    
    return (
      contentType.includes('application/json') ||
      contentType.includes('text/')
    ) && contentLength > 1024 // Only compress > 1KB
  }

  static async measureCachePerformance(cacheName, operation, fn) {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    
    // Log slow cache operations
    if (duration > 50) {
      console.warn(`Slow cache ${operation} in ${cacheName}: ${duration.toFixed(2)}ms`)
    }
    
    return result
  }
}

// Enhanced cache management with performance monitoring
class CacheManager {
  static async put(cacheName, request, response, options = {}) {
    try {
      const cache = await caches.open(cacheName)
      const { maxAge, maxEntries } = options
      
      // Clone response for caching
      const responseToCache = response.clone()
      
      // Add cache metadata
      const headers = new Headers(responseToCache.headers)
      headers.set('sw-cached-at', Date.now().toString())
      if (maxAge) {
        headers.set('sw-max-age', maxAge.toString())
      }
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers
      })
      
      await PerformanceOptimizer.measureCachePerformance(
        cacheName,
        'put',
        () => cache.put(request, modifiedResponse)
      )
      
      // Cleanup old entries if needed
      if (maxEntries) {
        await this.cleanupCache(cacheName, maxEntries)
      }
      
    } catch (error) {
      console.error('Cache put failed:', error)
    }
  }

  static async match(cacheName, request) {
    try {
      const cache = await caches.open(cacheName)
      
      return await PerformanceOptimizer.measureCachePerformance(
        cacheName,
        'match',
        () => cache.match(request)
      )
    } catch (error) {
      console.error('Cache match failed:', error)
      return null
    }
  }

  static async cleanupCache(cacheName, maxEntries) {
    try {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()
      
      if (keys.length > maxEntries) {
        const keysToDelete = keys.slice(0, keys.length - maxEntries)
        await Promise.all(keysToDelete.map(key => cache.delete(key)))
      }
    } catch (error) {
      console.error('Cache cleanup failed:', error)
    }
  }

  static async isExpired(response, maxAge) {
    if (!maxAge) return false
    
    const cachedAt = response.headers.get('sw-cached-at')
    if (!cachedAt) return true
    
    const age = Date.now() - parseInt(cachedAt)
    return age > maxAge * 1000
  }
}

// Install event - precache critical resources
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)
      
      // Precache critical resources
      try {
        await cache.addAll(PRECACHE_URLS.filter(url => url))
      } catch (error) {
        console.warn('Precache failed for some resources:', error)
      }
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    })()
  )
})

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      const validCaches = Object.values(CACHE_STRATEGIES).map(s => s.name)
      
      // Delete old caches
      await Promise.all(
        cacheNames
          .filter(name => !validCaches.includes(name))
          .map(name => caches.delete(name))
      )
      
      // Claim all clients
      clients.claim()
    })()
  )
})

// Fetch event - intelligent caching based on request type
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return
  
  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) return
  
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  try {
    // Route to appropriate strategy based on URL pattern
    if (URL_PATTERNS.static.test(url.pathname)) {
      return handleStaticAsset(request)
    }
    
    if (URL_PATTERNS.api.test(url.href)) {
      return handleApiRequest(request)
    }
    
    if (URL_PATTERNS.images.test(url.pathname)) {
      return handleImageRequest(request)
    }
    
    if (URL_PATTERNS.appwrite.test(url.href)) {
      return handleAppwriteRequest(request)
    }
    
    // Default: Stale While Revalidate for pages
    return handlePageRequest(request)
    
  } catch (error) {
    console.error('Request handling failed:', error)
    return fetch(request)
  }
}

// Cache First strategy for static assets
async function handleStaticAsset(request) {
  const cached = await CacheManager.match(STATIC_CACHE, request)
  
  if (cached) {
    // Update cache in background if needed
    setTimeout(() => updateStaticCache(request), 0)
    return cached
  }
  
  return updateStaticCache(request)
}

async function updateStaticCache(request) {
  try {
    const response = await fetch(request)
    if (response.status === 200) {
      await CacheManager.put(
        STATIC_CACHE, 
        request, 
        response, 
        CACHE_STRATEGIES.static
      )
    }
    return response
  } catch (error) {
    console.error('Static asset fetch failed:', error)
    throw error
  }
}

// Network First strategy for API requests
async function handleApiRequest(request) {
  try {
    const response = await fetch(request)
    
    if (response.status === 200) {
      await CacheManager.put(
        API_CACHE,
        request,
        response,
        CACHE_STRATEGIES.api
      )
    }
    
    return response
  } catch (error) {
    // Fallback to cache on network failure
    const cached = await CacheManager.match(API_CACHE, request)
    if (cached && !(await CacheManager.isExpired(cached, CACHE_STRATEGIES.api.maxAge))) {
      return cached
    }
    throw error
  }
}

// Cache First with compression for images
async function handleImageRequest(request) {
  const cached = await CacheManager.match(IMAGE_CACHE, request)
  
  if (cached) {
    return cached
  }
  
  try {
    const response = await fetch(request)
    
    if (response.status === 200) {
      await CacheManager.put(
        IMAGE_CACHE,
        request,
        response,
        CACHE_STRATEGIES.images
      )
    }
    
    return response
  } catch (error) {
    console.error('Image fetch failed:', error)
    throw error
  }
}

// Optimized handling for Appwrite requests
async function handleAppwriteRequest(request) {
  // Skip caching for authentication requests
  if (request.url.includes('/account/sessions')) {
    return fetch(request)
  }
  
  return handleApiRequest(request)
}

// Stale While Revalidate for page requests
async function handlePageRequest(request) {
  const cached = await CacheManager.match(DYNAMIC_CACHE, request)
  
  // Return cached immediately and update in background
  if (cached) {
    setTimeout(() => updatePageCache(request), 0)
    return cached
  }
  
  return updatePageCache(request)
}

async function updatePageCache(request) {
  try {
    const response = await fetch(request)
    
    if (response.status === 200) {
      await CacheManager.put(
        DYNAMIC_CACHE,
        request,
        response,
        CACHE_STRATEGIES.dynamic
      )
    }
    
    return response
  } catch (error) {
    const cached = await CacheManager.match(DYNAMIC_CACHE, request)
    if (cached) {
      return cached
    }
    throw error
  }
}

// Background sync for tennis match updates
self.addEventListener('sync', event => {
  if (event.tag === 'tennis-match-sync') {
    event.waitUntil(syncTennisMatches())
  }
})

async function syncTennisMatches() {
  try {
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_MATCHES',
        timestamp: Date.now()
      })
    })
  } catch (error) {
    console.error('Match sync failed:', error)
  }
}

// Performance monitoring
self.addEventListener('message', event => {
  if (event.data.type === 'PERFORMANCE_REPORT') {
    handlePerformanceReport(event.data.metrics)
  }
})

function handlePerformanceReport(metrics) {
  // Log performance issues
  if (metrics.lcp > 2500) {
    console.warn('LCP performance issue:', metrics.lcp + 'ms')
  }
  
  if (metrics.fid > 100) {
    console.warn('FID performance issue:', metrics.fid + 'ms')
  }
  
  if (metrics.cls > 0.1) {
    console.warn('CLS performance issue:', metrics.cls)
  }
}