"use client"

import { useState } from "react"
import { ImageDown } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/i18n"
import { buildScoreCardModel, renderScoreCardBlob, type ScoreCardInput } from "@/lib/utils/score-card"

/** Shares the score card via the native share sheet, or downloads it where that isn't available. */
/** `compact` renders an icon button that keeps the label as its accessible name, for tight headers. */
export function ShareScoreCardButton({ input, fileName = "score.png", compact = false }: { input: ScoreCardInput; fileName?: string; compact?: boolean }) {
  const t = useTranslations("match")
  const [busy, setBusy] = useState(false)

  if (input.sets.length === 0) return null

  const handleClick = async () => {
    setBusy(true)
    try {
      const blob = await renderScoreCardBlob(buildScoreCardModel(input))
      if (!blob) throw new Error("canvas unavailable")
      const file = new File([blob], fileName, { type: "image/png" })

      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file] })
        } catch (error) {
          // The user closing the share sheet is not an error
          if ((error as DOMException)?.name !== "AbortError") throw error
        }
        return
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      toast.error(t("scoreCardFailed"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      variant="outline"
      size={compact ? "icon" : "sm"}
      onClick={handleClick}
      disabled={busy}
      aria-label={compact ? t("shareScoreCard") : undefined}
      title={compact ? t("shareScoreCard") : undefined}
      className={compact ? "h-11 w-11" : "flex items-center gap-1 text-xs px-2 py-1 h-8"}
    >
      <ImageDown className={compact ? "h-4 w-4" : "h-3 w-3"} aria-hidden="true" />
      {!compact && <span>{t("shareScoreCard")}</span>}
    </Button>
  )
}
