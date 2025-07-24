"use client"

import { ReactNode } from "react"
import { useServiceWorker } from "@/hooks/use-service-worker"
import { useNetworkStatus } from "@/hooks/use-network-status"

/**
 * ServiceWorkerProvider – mounts global side-effect hooks exactly once.
 * No UI rendered, just {children} passthrough.
 */
export function ServiceWorkerProvider({ children }: { children: ReactNode }) {
  useServiceWorker()
  useNetworkStatus()
  return <>{children}</>
} 