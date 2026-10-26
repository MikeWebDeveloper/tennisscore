"use client"

import { RouteError } from "@/components/shared/route-error"

// Critical boundary: keeps a live-scoring render error from crashing the PWA
// mid-match. The user can retry without losing the installed app.
export default function LiveScoringError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <RouteError error={error} reset={reset} />
}
