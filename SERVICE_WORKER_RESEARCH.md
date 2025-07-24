# Service Worker and PWA Authentication Issues Research

## Overview

This document compiles research on common PWA and service worker issues, particularly focusing on redirect loops, authentication interference, and navigation throttling problems.

## 1. Service Worker Redirect Loop Problems

### Root Causes

1. **Cookie Race Conditions**
   - Can't set a cookie and read it in the same request
   - Authentication cookies aren't immediately available after setting
   - Results in users being incorrectly redirected back to login pages

2. **Middleware Configuration Issues**
   - Next.js middleware can cause infinite loops when redirecting authenticated users
   - Fix: Use `NextResponse.next()` instead of redirecting when user is already authenticated

3. **Caching Authentication Redirects**
   - Service workers cache authentication redirects
   - Users get cached redirect responses instead of actual app content after login
   - Solution: Compare `request.url` to `response.url` and avoid caching if they don't match

## 2. Service Worker Authentication Interference

### Common Problems

1. **Navigation Request Interception**
   - Service workers act as proxy servers between app and network
   - Can prevent reverse-proxy redirections during login/logout
   - Basic authorization headers not added to service worker fetch() requests

2. **Aggressive Caching**
   - HTTP Basic Auth breaks as users never get prompted for credentials again
   - Authentication pages get cached with stale states
   - iOS PWAs particularly problematic with third-party authentication

3. **Scope Control Issues**
   - Service worker scope determined by its location
   - Can control all network requests within scope
   - First page load: `navigator.serviceWorker.controller === null`

## 3. Best Practices for Excluding Authentication Routes

### Modern Approach: Service Worker Static Routing API (Chrome 123+)

```javascript
addEventListener('install', (event) => {
  event.addRoutes({
    condition: {
      urlPattern: "/auth/*",
      requestMethod: "post"
    },
    source: "network"
  });
});
```

### Traditional Approach: Fetch Event Handler Exclusion

```javascript
const EXCLUDED_PATHS = ['/api/auth', '/login', '/logout', '/api/token'];

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip service worker for excluded paths
  if (EXCLUDED_PATHS.some(path => url.pathname.startsWith(path))) {
    return;
  }
  
  // Handle other requests...
});
```

### Framework-Specific Solutions

**Angular PWA:**
```json
{
  "navigationUrls": [
    "/**",
    "!**/api/auth/**",
    "!**/login",
    "!**/logout"
  ]
}
```

**Next.js with next-pwa:**
```javascript
// Use NetworkFirst strategy for authenticated routes
const runtimeCaching = require("next-pwa/cache");
const nextDataIndex = runtimeCaching.findIndex(
  (entry) => entry.options.cacheName === "next-data"
);
if (nextDataIndex !== -1) {
  runtimeCaching[nextDataIndex].handler = "NetworkFirst";
}
```

## 4. Navigation Throttling and Timeout Issues

### Chrome DevTools Behavior

1. **Service Worker Termination Prevention**
   - "Service Worker termination by a timeout timer was canceled because DevTools is attached"
   - DevTools keeps service workers active for debugging
   - Close DevTools to test actual behavior

2. **Chrome's Lifecycle Management**
   - Service workers terminated after 30 seconds to 5 minutes of inactivity
   - Chrome 85+ introduced request throttling (max 3 concurrent requests)
   - Can cause installation to get stuck in "trying to install" state

### Solutions

1. **Avoid `cache.addAll()` for Large Resources**
   ```javascript
   // Instead of cache.addAll() which can hit throttling limits
   // Use individual cache.add() calls with error handling
   for (const url of urlsToCache) {
     try {
       await cache.add(url);
     } catch (error) {
       console.error(`Failed to cache ${url}:`, error);
     }
   }
   ```

2. **Keep Service Workers Active (Extensions)**
   ```javascript
   // Ping content script periodically
   const pingInterval = setInterval(() => {
     port.postMessage({ status: "ping" });
   }, 10000); // Every 10 seconds
   ```

## 5. Next.js Specific Considerations

### Caching Strategy for Authenticated Routes

1. **Set Cache-Control Headers**
   ```javascript
   headers: async () => [
     {
       source: "/app/:path*",
       headers: [
         {
           key: "Cache-Control",
           value: "no-store",
         },
       ],
     },
   ],
   ```

2. **Disable Default Caching**
   - Next.js caches routes by default
   - Use `cache: 'no-cache'` or `cache: 'no-store'` in fetch requests
   - Consider using `revalidate: 0` for dynamic routes

3. **Handle Stale Data Issues**
   - Next.js can serve stale data from cached next-data
   - Particularly problematic with getServerSideProps
   - Solution: Use NetworkFirst strategy for SSR pages

## 6. Comprehensive Solution Strategy

### For Your Tennis Score App

1. **Exclude All Authentication Routes**
   ```javascript
   // In your service worker
   const AUTH_ROUTES = [
     '/login',
     '/signup',
     '/api/auth',
     '/api/sessions',
     '/(auth)'
   ];
   
   self.addEventListener('fetch', (event) => {
     const url = new URL(event.request.url);
     
     // Completely bypass service worker for auth routes
     if (AUTH_ROUTES.some(route => url.pathname.includes(route))) {
       return;
     }
     
     // Also skip navigation requests during development
     if (event.request.mode === 'navigate' && 
         url.hostname === 'localhost') {
       return;
     }
     
     // Handle other requests...
   });
   ```

2. **Implement Smart Caching Strategy**
   - Use NetworkFirst for authenticated pages
   - Use CacheFirst for static assets only
   - Never cache POST requests or form submissions
   - Clear caches on logout

3. **Handle iOS Safari Specifics**
   - Be extra careful with third-party auth redirects
   - Consider disabling service worker on iOS if issues persist
   - Test thoroughly in standalone PWA mode

4. **Development vs Production**
   - Consider disabling service worker in development
   - Use different caching strategies per environment
   - Implement version-based cache busting

## 7. Debugging Tips

1. **Chrome DevTools**
   - Application tab → Service Workers
   - Check "Update on reload" during development
   - Monitor Network tab for cached vs network requests
   - Use "Clear storage" to reset state

2. **Common Error Messages**
   - "Navigation throttled" - Too many concurrent requests
   - "Redirect loop detected" - Check middleware and auth flow
   - "Failed to fetch" - Service worker interference

3. **Testing Checklist**
   - Test with DevTools closed
   - Test in incognito mode
   - Test on actual mobile devices
   - Test with slow network conditions
   - Test login/logout flows thoroughly

## Conclusion

Service workers can significantly interfere with authentication flows if not properly configured. The key is to:
1. Completely exclude authentication routes from service worker handling
2. Use appropriate caching strategies (NetworkFirst for dynamic content)
3. Handle cookie timing issues properly
4. Test thoroughly across different scenarios and devices

For Next.js applications with authentication, consider whether the offline benefits of a service worker outweigh the complexity, especially if your app requires frequent authentication checks.