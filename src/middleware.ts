import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
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
  
  // TEMPORARY BYPASS: Let all requests through to isolate the redirect loop
  console.log(`[Middleware] Processing path: ${pathname}`)
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