"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "@/i18n"

interface RouteErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  /** When false, hides the "Back to dashboard" link (e.g. on auth/public pages). */
  showHomeLink?: boolean
}

/**
 * Shared UI for App Router `error.tsx` boundaries. Keeps a thrown render
 * error from white-screening the installed PWA and offers a recovery action.
 */
export function RouteError({ error, reset, showHomeLink = true }: RouteErrorProps) {
  const t = useTranslations("common")

  useEffect(() => {
    // Surface the error for debugging/monitoring.
    console.error("[RouteError]", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-4xl" aria-hidden>
        🎾
      </span>
      <h2 className="text-xl font-semibold text-foreground">
        {t("somethingWentWrong")}
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t("errorBoundaryDescription")}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>{t("tryAgain")}</Button>
        {showHomeLink && (
          <Button variant="outline" asChild>
            <Link href="/dashboard">{t("backToDashboard")}</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
