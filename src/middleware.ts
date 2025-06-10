import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")
  const { pathname } = request.nextUrl

  // If trying to access protected routes without a session, redirect to login
  if (pathname.startsWith("/dashboard") && !session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If user is logged in, and tries to access login page, let them.
  // This prevents the redirect loop if the session cookie is invalid.
  // The login/signup pages themselves will handle redirecting if the user is *validly* logged in.

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
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
} 