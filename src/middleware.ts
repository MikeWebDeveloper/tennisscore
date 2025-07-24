import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/session"

// Admin user emails
const ADMIN_EMAILS = [
  "michal.latal@yahoo.co.uk",
  "mareklatal@seznam.cz"
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get("session")?.value
  
  console.log(`[Middleware] Processing path: ${pathname}`)
  
  // Skip middleware for static assets, API routes, and public paths
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/clear-cache.html') ||
    pathname.startsWith('/test-static.html')
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
  
  // Root route handling - minimal intervention, let page.tsx handle it
  const isRootRoute = pathname === "/"
  
  // Check if user has valid session with strict timeout protection
  let hasValidSession = false
  let userEmail: string | null = null
  
  if (sessionCookie) {
    try {
      // Strict timeout protection - fail fast to prevent hanging
      const decryptPromise = decrypt(sessionCookie)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Decrypt timeout')), 2000)
      )
      
      const sessionData = await Promise.race([decryptPromise, timeoutPromise]) as any
      
      // Validate session data more thoroughly
      if (sessionData && sessionData.userId && sessionData.email) {
        // Check if session is expired
        if (sessionData.expiresAt && new Date(sessionData.expiresAt) > new Date()) {
          hasValidSession = true
          userEmail = sessionData.email
        }
      }
    } catch (error) {
      hasValidSession = false
      console.warn(`[Middleware] Session decrypt failed for ${pathname}:`, error)
      
      // Clear invalid session cookie silently
      const response = NextResponse.next()
      response.cookies.delete('session')
      
      // For timeout errors, continue without authentication
      if ((error as Error).message === 'Decrypt timeout') {
        console.warn(`[Middleware] Timeout during session check for ${pathname}, continuing without auth`)
        return response
      }
    }
  }
  
  // Redirect logic with enhanced loop prevention
  const url = request.nextUrl.clone()
  
  // For root route, let page.tsx handle it completely
  if (isRootRoute) {
    console.log(`[Middleware] Root route detected, letting page.tsx handle authentication`)
    return NextResponse.next()
  }
  
  // Redirect unauthenticated users from protected routes
  if (isAppRoute && !hasValidSession) {
    console.log(`[Middleware] Redirecting unauthenticated user from ${pathname} to /login`)
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  
  // Redirect non-admin users from admin routes
  if (isAdminRoute && (!hasValidSession || !userEmail || !ADMIN_EMAILS.includes(userEmail))) {
    console.log(`[Middleware] Redirecting non-admin user from ${pathname} to /dashboard`)
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  
  // Redirect authenticated users from auth routes (with caution)
  if (isAuthRoute && hasValidSession) {
    console.log(`[Middleware] Redirecting authenticated user from ${pathname} to /dashboard`)
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  
  console.log(`[Middleware] Allowing request to ${pathname}`)
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
     * - Any file with an extension (static files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|live|clear-session|.*\\..*).*)',
  ],
} 