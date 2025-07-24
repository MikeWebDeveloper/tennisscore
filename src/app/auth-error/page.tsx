import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Authentication Error</h1>
          <p className="text-muted-foreground">
            We encountered an issue with your authentication session. This might be due to:
          </p>
        </div>
        
        <ul className="text-left space-y-2 text-sm text-muted-foreground">
          <li>• Your session has expired</li>
          <li>• Cookies are disabled in your browser</li>
          <li>• A temporary server issue</li>
          <li>• Invalid or corrupted session data</li>
        </ul>
        
        <div className="space-y-4 pt-4">
          <Link
            href="/clear-session"
            className="block w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            Clear Session & Try Again
          </Link>
          
          <Link
            href="/login"
            className="block w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
          >
            Go to Login
          </Link>
          
          <Link
            href="/"
            className="block w-full px-4 py-2 text-muted-foreground hover:text-white transition-colors"
          >
            Back to Home
          </Link>
        </div>
        
        <div className="pt-6 text-xs text-muted-foreground">
          <p>If this issue persists, please try:</p>
          <ul className="mt-2 space-y-1">
            <li>• Clearing your browser cache and cookies</li>
            <li>• Using a different browser or incognito mode</li>
            <li>• Checking your internet connection</li>
          </ul>
        </div>
      </div>
    </div>
  )
}