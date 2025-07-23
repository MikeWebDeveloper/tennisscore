import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/session"

// Admin user emails
const ADMIN_EMAILS = [
  "michal.latal@yahoo.co.uk",
  "mareklatal@seznam.cz"
]

export async function middleware(request: NextRequest) {
  // EMERGENCY BYPASS: Completely disable middleware to eliminate navigation loops
  // This allows direct access to all pages without any redirects
  console.log('Middleware bypassed for:', request.nextUrl.pathname)
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