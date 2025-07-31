import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/session"
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

// Admin user emails
const ADMIN_EMAILS = [
  "michal.latal@yahoo.co.uk",
  "mareklatal@seznam.cz"
]

// Create next-intl middleware
const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get("session")?.value

  // Extract locale from pathname if present
  const pathnameHasLocale = routing.locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // Get the actual pathname without locale prefix
  const actualPathname = pathnameHasLocale 
    ? pathname.slice(3) // Remove /en or /cs
    : pathname

  // Protected app routes
  const isAppRoute = actualPathname.startsWith("/dashboard") || 
                    actualPathname.startsWith("/matches") || 
                    actualPathname.startsWith("/players") ||
                    actualPathname.startsWith("/statistics") ||
                    actualPathname.startsWith("/settings")
  
  // Admin routes
  const isAdminRoute = actualPathname.startsWith("/admin")
  
  // Auth routes  
  const isAuthRoute = ["/login", "/signup"].includes(actualPathname)

  // Public routes that don't need locale handling
  const isPublicRoute = actualPathname.startsWith("/api/") ||
                       actualPathname === "/clear-session" ||
                       actualPathname === "/auth-error"

  // Skip intl middleware for public routes
  if (isPublicRoute) {
    // Still apply auth logic for non-api routes
    if (!actualPathname.startsWith("/api/")) {
      let hasValidSession = false
      let userEmail: string | null = null
      if (sessionCookie) {
        try {
          const sessionData = await decrypt(sessionCookie)
          hasValidSession = !!sessionData?.userId
          userEmail = sessionData?.email || null
        } catch {
          hasValidSession = false
        }
      }

      if (isAppRoute && !hasValidSession) {
        return NextResponse.redirect(new URL("/login", request.url))
      }

      if (isAdminRoute && (!hasValidSession || !userEmail || !ADMIN_EMAILS.includes(userEmail))) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }

      if (isAuthRoute && hasValidSession) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }

    return NextResponse.next()
  }

  // Check if user has valid session and get user email
  let hasValidSession = false
  let userEmail: string | null = null
  if (sessionCookie) {
    try {
      const sessionData = await decrypt(sessionCookie)
      hasValidSession = !!sessionData?.userId
      userEmail = sessionData?.email || null
    } catch {
      hasValidSession = false
    }
  }

  // Auth redirect logic (before intl middleware)
  if (isAppRoute && !hasValidSession) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isAdminRoute && (!hasValidSession || !userEmail || !ADMIN_EMAILS.includes(userEmail))) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (isAuthRoute && hasValidSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Apply intl middleware
  const response = intlMiddleware(request)
  
  // Add locale information to headers for server components
  if (response) {
    const locale = response.headers.get('x-middleware-request-x-matched-locale') || routing.defaultLocale
    response.headers.set('x-locale', locale)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - clear-session (session clearing page)
     * - sw.js (service worker)
     * - manifest.json (PWA manifest)
     * - icons (PWA icons)
     * - fonts (custom fonts)
     * - test-i18n (test routes)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|clear-session|sw.js|manifest.json|icons|fonts|test-i18n|data|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.webp|.*\\.json).*)",
  ],
}