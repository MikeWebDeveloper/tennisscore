// EMERGENCY SERVICE WORKER BYPASS
// This service worker immediately unregisters itself to fix redirect loops

console.log('[SW] EMERGENCY BYPASS - Unregistering service worker to fix redirect loop')

// Unregister this service worker immediately
self.addEventListener('install', () => {
  console.log('[SW] Emergency bypass - skipping waiting')
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  console.log('[SW] Emergency bypass - claiming clients and clearing caches')
  
  // Clear all caches
  caches.keys().then(cacheNames => {
    return Promise.all(
      cacheNames.map(cacheName => {
        if (cacheName.includes('tennisscore')) {
          console.log('[SW] Clearing cache:', cacheName)
          return caches.delete(cacheName)
        }
      })
    )
  })
  
  // Take control of all clients
  return self.clients.claim()
})

// Don't intercept any requests - let them all pass through normally
self.addEventListener('fetch', (event) => {
  // Do nothing - let all requests pass through to the network
  return
})

// Message handler for version checks
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ 
      version: 'EMERGENCY_BYPASS',
      message: 'Service worker bypassed to fix redirect loop'
    })
  }
})