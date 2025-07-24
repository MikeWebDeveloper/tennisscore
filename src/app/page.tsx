import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"

export default async function RootPage() {
  let user = null
  let authError = false
  
  try {
    // Try to get current user but don't redirect on failure
    user = await getCurrentUser()
  } catch (error) {
    console.error("[Root Page] Auth check failed:", error)
    authError = true
  }
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Tennis Score</h1>
          <p className="text-muted-foreground">Track your tennis matches with ease</p>
        </div>
        
        {authError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg">
            <p className="text-sm">Authentication service is temporarily unavailable. Please try again later.</p>
          </div>
        )}
        
        <div className="space-y-4">
          {user ? (
            <>
              <p className="text-muted-foreground">Welcome back, {user.email}</p>
              <Link
                href="/dashboard"
                className="block w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/api/logout"
                className="block w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
              >
                Sign Out
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="block w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="block w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
              >
                Create Account
              </Link>
            </>
          )}
        </div>
        
        {/* Debug info for redirect loops */}
        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('_rc') && (
          <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-500">Redirect loop detected. Please clear your cookies and try again.</p>
            <Link
              href="/clear-session"
              className="mt-2 inline-block text-sm text-yellow-500 underline"
            >
              Clear Session
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}