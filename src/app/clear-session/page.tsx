"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Trash2, CheckCircle2, Loader2 } from "lucide-react"

export default function ClearSessionPage() {
  const router = useRouter()
  const [clearing, setClearing] = useState(false)
  const [cleared, setCleared] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const clearSession = async () => {
    setClearing(true)
    setError(null)
    
    try {
      // 1. Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
      
      // 2. Clear localStorage and sessionStorage
      if (typeof window !== "undefined") {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // 3. Unregister service workers
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) {
          await registration.unregister()
        }
      }
      
      // 4. Clear all caches
      if ("caches" in window) {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        )
      }
      
      // 5. Call API to clear server-side session
      await fetch("/api/logout", { method: "POST" })
      
      setCleared(true)
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push("/")
      }, 2000)
      
    } catch (err) {
      console.error("Error clearing session:", err)
      setError(err instanceof Error ? err.message : "Failed to clear session")
    } finally {
      setClearing(false)
    }
  }
  
  useEffect(() => {
    // Auto-clear if coming from a redirect loop
    const params = new URLSearchParams(window.location.search)
    if (params.get("auto") === "true") {
      clearSession()
    }
  }, [])
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {!cleared ? (
          <>
            <div className="flex justify-center">
              <div className="p-4 bg-primary/10 rounded-full">
                <Trash2 className="h-12 w-12 text-primary" />
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Clear Session</h1>
              <p className="text-muted-foreground">
                This will clear all authentication data and cached information.
              </p>
            </div>
            
            <div className="text-left space-y-2 text-sm text-muted-foreground">
              <p>This action will:</p>
              <ul className="ml-4 space-y-1">
                <li>• Sign you out of your account</li>
                <li>• Clear all cookies and local storage</li>
                <li>• Remove service worker registrations</li>
                <li>• Delete all cached data</li>
              </ul>
            </div>
            
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <div className="space-y-4 pt-4">
              <button
                onClick={clearSession}
                disabled={clearing}
                className="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {clearing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  "Clear Session Data"
                )}
              </button>
              
              <Link
                href="/"
                className="block w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <div className="p-4 bg-green-500/10 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Session Cleared</h1>
              <p className="text-muted-foreground">
                All session data has been successfully cleared.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Redirecting to home page...
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}