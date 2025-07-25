import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/session"
// import createIntlMiddleware from 'next-intl/middleware' // Temporarily disabled
import { locales, defaultLocale } from '@/i18n/config'

// Admin user emails
const ADMIN_EMAILS = [
  "michal.latal@yahoo.co.uk",
  "mareklatal@seznam.cz"
]

// Temporarily disabled next-intl middleware
// const intlMiddleware = createIntlMiddleware({
//   locales,
//   defaultLocale,
//   localePrefix: 'as-needed'
// })

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get("session")?.value

  // Extract locale from pathname if present
  const pathnameHasLocale = locales.some(
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
  const isPublicRoute = actualPathname.startsWith("/live/") || 
                       actualPathname.startsWith("/api/") ||
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

  // Temporarily skip intl middleware until app structure is migrated
  // const response = intlMiddleware(request)
  
  // // Add locale information to headers for server components
  // if (response) {
  //   const locale = response.headers.get('x-middleware-request-x-matched-locale') || defaultLocale
  //   response.headers.set('x-locale', locale)
  // }

  // return response
  
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
     * - sw.js (service worker)
     * - manifest.json (PWA manifest)
     * - icons (PWA icons)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|live|clear-session|auth-error|sw.js|manifest.json|icons).*)",
  ],
} 