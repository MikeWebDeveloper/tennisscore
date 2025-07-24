import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/session"

// Admin user emails
const ADMIN_EMAILS = [
  "michal.latal@yahoo.co.uk",
  "mareklatal@seznam.cz"
]

// Max redirect attempts before breaking the loop
const MAX_REDIRECT_ATTEMPTS = 3

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const sessionCookie = request.cookies.get("session")?.value
  
  // Check for redirect loop
  const redirectCount = parseInt(searchParams.get("_rc") || "0")
  if (redirectCount >= MAX_REDIRECT_ATTEMPTS) {
    // Break the redirect loop
    console.error(`[Middleware] Redirect loop detected at ${pathname}`)
    const response = NextResponse.next()
    response.headers.set("X-Redirect-Loop", "true")
    return response
  }
  
  // Skip middleware for static assets, API routes, and public paths
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/clear-cache.html') ||
    pathname.startsWith('/test-static.html') ||
    pathname.startsWith('/auth-error') ||
    pathname.startsWith('/clear-session')
  ) {
    return NextResponse.next()
  }
  
  // Protected app routes
  const isAppRoute = pathname.startsWith("/dashboard") || 
                    pathname.startsWith("/matches") || 
                    pathname.startsWith("/players") ||
                    pathname.startsWith("/statistics") ||
                    pathname.startsWith("/player-statistics")
  
  // Admin routes
  const isAdminRoute = pathname.startsWith("/admin")
  
  // Auth routes  
  const isAuthRoute = pathname === "/login" || pathname === "/signup"
  
  // Root route handling
  const isRootRoute = pathname === "/"
  
  // Public routes that don't require auth
  const isPublicRoute = pathname.startsWith("/live/")
  
  // Allow public routes without auth check
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // Check if user has valid session
  let hasValidSession = false
  let userEmail: string | null = null
  
  if (sessionCookie) {
    try {
      // Validate session with timeout protection
      const decryptPromise = decrypt(sessionCookie)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session validation timeout')), 2000)
      )
      
      const sessionData = await Promise.race([decryptPromise, timeoutPromise]) as any
      
      if (sessionData && sessionData.userId && sessionData.email) {
        // Check if session is expired
        if (!sessionData.expiresAt || new Date(sessionData.expiresAt) > new Date()) {
          hasValidSession = true
          userEmail = sessionData.email
        }
      }
    } catch (error) {
      // Session validation failed
      hasValidSession = false
      
      // For timeout errors, don't delete the cookie immediately
      if ((error as Error).message !== 'Session validation timeout') {
        // Clear invalid session cookie
        const response = NextResponse.next()
        response.cookies.delete('session')
        return response
      }
    }
  }
  
  // Helper function to create redirect with loop counter
  const createRedirect = (url: URL) => {
    url.searchParams.set("_rc", String(redirectCount + 1))
    const response = NextResponse.redirect(url)
    // Clean up the redirect counter from the URL after redirect
    response.headers.set("X-Clean-URL", "true")
    return response
  }
  
  // Handle root route
  if (isRootRoute) {
    // Don't auto-redirect from root anymore to prevent loops
    // Let the page.tsx handle what to show
    return NextResponse.next()
  }
  
  // Redirect unauthenticated users from protected routes
  if (isAppRoute && !hasValidSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set("from", pathname)
    return createRedirect(url)
  }
  
  // Redirect non-admin users from admin routes
  if (isAdminRoute && (!hasValidSession || !userEmail || !ADMIN_EMAILS.includes(userEmail))) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return createRedirect(url)
  }
  
  // Redirect authenticated users from auth routes
  if (isAuthRoute && hasValidSession) {
    const url = request.nextUrl.clone()
    const from = searchParams.get("from")
    url.pathname = from || '/dashboard'
    url.searchParams.delete("from")
    return createRedirect(url)
  }
  
  // Clean up redirect counter from successful requests
  if (searchParams.has("_rc")) {
    const url = request.nextUrl.clone()
    url.searchParams.delete("_rc")
    return NextResponse.redirect(url)
  }
  
  // Allow request
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - live (public live match page)
     * - clear-session (session clearing page)
     * - auth-error (auth error page)
     * - Any file with an extension (static files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|live|clear-session|auth-error|.*\\..*).*)',
  ],
}