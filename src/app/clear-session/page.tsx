"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function ClearSessionPage() {
  const router = useRouter()
  const [status, setStatus] = useState("Clearing session...")

  useEffect(() => {
    // Clear all cookies for localhost
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=")
      const name = eqPos > -1 ? c.slice(0, eqPos) : c
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost"
    })

    // Try to call the API to clear server-side session
    fetch("/api/clear-session", {
      method: "POST",
    })
    .then(() => {
      setStatus("Session cleared! Redirecting to login...")
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    })
    .catch(() => {
      setStatus("Session cleared! Redirecting to login...")
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">TennisScore</h1>
        <p className="text-muted-foreground">{status}</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    </div>
  )
} 