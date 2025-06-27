"use client"

import { useEffect } from "react"
import { toast } from "sonner"

/**
 * useServiceWorker – registers /sw.js and surfaces lifecycle events
 *
 * 1. First install ➜ success toast (offline ready)
 * 2. Update found ➜ info toast with "Refresh" action; clicking skips waiting & reloads
 * 3. Controller change ➜ auto-reload (so the new SW takes control)
 */
export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" })

        // ➜ Fresh install
        if (!navigator.serviceWorker.controller) {
          toast.success("Offline support enabled")
        }

        // ➜ Update detection
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing
          if (!newWorker) return

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller // existing page controlled – so this is an update
            ) {
              toast.info("New version available", {
                action: {
                  label: "Refresh",
                  onClick: () => {
                    newWorker.postMessage({ type: "SKIP_WAITING" })
                  }
                }
              })
            }
          })
        })

        // ➜ When the new SW activates after SKIP_WAITING
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          window.location.reload()
        })
      } catch (err) {
        console.error("Service-worker registration failed", err)
      }
    }

    register()
  }, [])
} 