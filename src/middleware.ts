import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/session"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get("session")?.value

  // Protected app routes
  const isAppRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/matches") || pathname.startsWith("/players")
  
  // Auth routes  
  const isAuthRoute = ["/login", "/signup"].includes(pathname)

  // Check if user has valid session
  let hasValidSession = false
  if (sessionCookie) {
    try {
      const sessionData = await decrypt(sessionCookie)
      hasValidSession = !!sessionData?.userId
    } catch {
      hasValidSession = false
    }
  }

  // Redirect logic
  if (isAppRoute && !hasValidSession) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isAuthRoute && hasValidSession) {
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