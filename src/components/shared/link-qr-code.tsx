"use client"

import { useEffect, useState } from "react"

/**
 * A QR code for a link, so people at the court can scan the watch link from the scorer's phone.
 * Always dark on white (scanners need the contrast); the encoder loads only when the code is shown.
 */
export function LinkQrCode({ url, label }: { url: string; label: string }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    if (!url) return
    let cancelled = false
    import("qrcode")
      .then(({ toDataURL }) => toDataURL(url, { margin: 1, width: 352, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } }))
      .then((data) => { if (!cancelled) setSrc(data) })
      .catch(() => { /* without a code the link is still there to copy */ })
    return () => { cancelled = true }
  }, [url])

  return (
    <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-xl bg-white p-2">
      {src
        // eslint-disable-next-line @next/next/no-img-element -- a generated data URL, nothing for next/image to optimise
        ? <img src={src} alt={label} width={176} height={176} className="h-44 w-44" />
        : <span className="h-full w-full animate-pulse rounded-lg bg-neutral-200" aria-hidden="true" />}
    </div>
  )
}
