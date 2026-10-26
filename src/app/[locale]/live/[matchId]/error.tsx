"use client"

import { RouteError } from "@/components/shared/route-error"

// Public live-match view: viewers may not be logged in, so hide the
// dashboard link.
export default function PublicLiveError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <RouteError error={error} reset={reset} showHomeLink={false} />
}
