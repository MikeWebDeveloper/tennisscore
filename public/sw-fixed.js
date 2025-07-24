/**
 * Service Worker v2.0.0 - Fixed Authentication Flow
 * 
 * This service worker properly handles authentication routes and prevents
 * redirect loops while maintaining PWA functionality.
 */

const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `tennisscore-${CACHE_VERSION}`;

// Critical routes that should NEVER be cached or intercepted
const AUTH_BYPASS_PATTERNS = [
  /^\/$/,                    // Root route
  /^\/login/,               
  /^\/signup/,              
  /^\/auth/,                
  /^\/(auth)/,              
  /^\/api\/auth/,           
  /^\/api\/session/,        
  /^\/\_next\/data/,        // Next.js data routes
  /^\/\_next\/static/,      // Next.js static assets (handled separately)
];

// Static assets that can be cached
const STATIC_CACHE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  /\.(?:woff|woff2|ttf|otf)$/,
  /\.(?:css|js)$/,
  /^\/icons\//,
  /^\/manifest\.json$/,
];

// Routes that should always fetch fresh data
const NETWORK_ONLY_PATTERNS = [
  /^\/api\//,               // All API routes
  /^\/live\//,              // Live match updates
  /^\/matches\/.*\/live/,   // Live scoring
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', CACHE_VERSION);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('tennisscore-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Skip non-HTTP(S) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Check if this route should bypass service worker completely
  if (shouldBypass(pathname)) {
    return; // Let browser handle directly
  }

  // Handle navigation requests (page loads)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (isStaticAsset(pathname)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Handle API and dynamic routes with network-first strategy
  if (shouldUseNetworkOnly(pathname)) {
    event.respondWith(handleNetworkOnly(request));
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(handleNetworkFirst(request));
});

function shouldBypass(pathname) {
  return AUTH_BYPASS_PATTERNS.some(pattern => pattern.test(pathname));
}

function isStaticAsset(pathname) {
  return STATIC_CACHE_PATTERNS.some(pattern => pattern.test(pathname));
}

function shouldUseNetworkOnly(pathname) {
  return NETWORK_ONLY_PATTERNS.some(pattern => pattern.test(pathname));
}

async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    
    // Never cache redirect responses
    if (response.redirected || response.status >= 300 && response.status < 400) {
      return response;
    }
    
    // Only cache successful HTML responses for non-auth pages
    if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Try cache for offline support
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page if available
    const offlinePage = await caches.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }
    
    throw error;
  }
}

async function handleStaticAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response);
      }
    }).catch(() => {});
    
    return cachedResponse;
  }
  
  // Fetch from network
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    throw error;
  }
}

async function handleNetworkOnly(request) {
  return fetch(request);
}

async function handleNetworkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Try cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Handle skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});