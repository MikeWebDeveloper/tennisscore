"use client"

import { useEffect } from "react"

/**
 * Last-resort boundary that replaces the root layout when it throws. It runs
 * OUTSIDE the next-intl provider, so translation hooks are unavailable here —
 * the copy is intentionally bilingual (en + cs, the app's active locales) and
 * self-contained.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[GlobalError]", error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
            Something went wrong · Něco se pokazilo
          </h1>
          <p style={{ opacity: 0.7, fontSize: 14, lineHeight: 1.5, margin: "0 0 20px" }}>
            Please try again. · Zkuste to prosím znovu.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#39FF14",
              color: "#000",
              border: "none",
              borderRadius: 8,
              padding: "12px 24px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again · Zkusit znovu
          </button>
        </div>
      </body>
    </html>
  )
}
