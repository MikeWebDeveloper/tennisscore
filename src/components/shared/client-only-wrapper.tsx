"use client"

import { useEffect, useState } from "react"

interface ClientOnlyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Wrapper component to prevent hydration mismatches for components that use client-side state
 * like translations from localStorage. Shows a fallback during SSR and initial render.
 */
export function ClientOnlyWrapper({ children, fallback }: ClientOnlyWrapperProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{fallback || null}</>
  }

  return <>{children}</>
}