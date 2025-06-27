"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

/**
 * useNetworkStatus – listens to browser online/offline events and
 * shows toast notifications. Returns current online boolean so
 * components can reactively use it if desired.
 */
export function useNetworkStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  )

  useEffect(() => {
    const handler = () => {
      const isOnline = navigator.onLine
      setOnline(isOnline)
      toast[isOnline ? "success" : "error"](isOnline ? "Back online" : "You're offline")
    }

    window.addEventListener("online", handler)
    window.addEventListener("offline", handler)
    return () => {
      window.removeEventListener("online", handler)
      window.removeEventListener("offline", handler)
    }
  }, [])

  return online
} 