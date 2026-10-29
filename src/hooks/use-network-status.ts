"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useTranslations } from "@/i18n"

/**
 * useNetworkStatus – listens to browser online/offline events and
 * shows toast notifications. Returns current online boolean so
 * components can reactively use it if desired.
 */
export function useNetworkStatus() {
  const t = useTranslations('common')
  // Listen once, but word the toasts in the current page language
  const tRef = useRef(t)
  tRef.current = t
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  )

  useEffect(() => {
    const handler = () => {
      const isOnline = navigator.onLine
      setOnline(isOnline)
      toast[isOnline ? "success" : "error"](tRef.current(isOnline ? 'backOnline' : 'youAreOffline'))
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