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
  
  // Skip middleware for static assets, API routes, and public paths
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/clear-cache.html')
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
  
  // Check if user has valid session
  let hasValidSession = false
  let userEmail: string | null = null
  
  if (sessionCookie) {
    try {
      const sessionData = await decrypt(sessionCookie)
      hasValidSession = !!sessionData?.userId
      userEmail = sessionData?.email || null
    } catch (error) {
      hasValidSession = false
      console.warn('Session decrypt failed:', error)
    }
  }
  
  // Redirect logic with loop prevention
  const url = request.nextUrl.clone()
  
  // Redirect unauthenticated users from protected routes
  if (isAppRoute && !hasValidSession) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  
  // Redirect non-admin users from admin routes
  if (isAdminRoute && (!hasValidSession || !userEmail || !ADMIN_EMAILS.includes(userEmail))) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  
  // Redirect authenticated users from auth routes
  if (isAuthRoute && hasValidSession) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  
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
     */
    "/((?!api|_next/static|_next/image|favicon.ico|live|clear-session).*)",
  ],
} 