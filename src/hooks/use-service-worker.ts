"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { createControllerChangeHandler } from "./service-worker-controller"
import { useTranslations } from "@/i18n"

/**
 * useServiceWorker – registers /sw.js and surfaces lifecycle events
 *
 * 1. First install ➜ success toast (offline ready)
 * 2. Update found ➜ info toast with "Refresh" action; clicking skips waiting & reloads
 * 3. Controller change ➜ auto-reload (so the new SW takes control)
 */
export function useServiceWorker() {
  const t = useTranslations('common')
  // Register once, but word the toasts in the current page language
  const tRef = useRef(t)
  tRef.current = t

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    // Listen before registration so the first activation cannot race the listener.
    const onControllerChange = createControllerChangeHandler(
      Boolean(navigator.serviceWorker.controller),
      () => window.location.reload(),
    )
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" })

        // ➜ Fresh install
        if (!navigator.serviceWorker.controller) {
          toast.success(tRef.current('offlineReady'))
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
              toast.info(tRef.current('newVersionAvailable'), {
                action: {
                  label: tRef.current('refresh'),
                  onClick: () => {
                    newWorker.postMessage({ type: "SKIP_WAITING" })
                  }
                }
              })
            }
          })
        })

      } catch (err) {
        console.error("Service-worker registration failed", err)
      }
    }

    register()
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange)
  }, [])
}
