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

  // Temporarily disabled redirect loop prevention for debugging
  // const referer = request.headers.get('referer')
  // const isRedirectLoop = referer && new URL(referer).pathname === pathname

  // if (isRedirectLoop) {
  //   console.warn('Potential redirect loop detected:', { pathname, referer })
  //   return NextResponse.next()
  // }

  // Protected app routes
  const isAppRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/matches") || pathname.startsWith("/players")
  
  // Admin routes
  const isAdminRoute = pathname.startsWith("/admin")
  
  // Auth routes  
  const isAuthRoute = ["/login", "/signup"].includes(pathname)

  // Check if user has valid session and get user email
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

  // Add debugging in production for loop detection
  if (process.env.NODE_ENV === 'production') {
    console.log('Middleware check:', { 
      pathname, 
      hasValidSession, 
      hasSessionCookie: !!sessionCookie,
      isAppRoute, 
      isAuthRoute,
      userAgent: request.headers.get('user-agent')?.slice(0, 50)
    })
  }

  // Redirect logic
  if (isAppRoute && !hasValidSession) {
    console.log('Redirecting to login from app route:', pathname)
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isAdminRoute && (!hasValidSession || !userEmail || !ADMIN_EMAILS.includes(userEmail))) {
    console.log('Redirecting to dashboard from admin route:', pathname)
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (isAuthRoute && hasValidSession) {
    console.log('Redirecting to dashboard from auth route:', pathname)
    return NextResponse.redirect(new URL("/dashboard", request.url))
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