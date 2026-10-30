"use client"

import { useState } from "react"
import { FileDown } from "lucide-react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useLocale, useTranslations } from "@/i18n"
import type { MatchReportProps } from "./match-report-pdf"
import type { Translate } from "./texts"

type ReportInput = Omit<MatchReportProps, "t" | "locale" | "generatedLabel">

const slug = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase()

/** Hands the file to the phone's share sheet when it can take files, else downloads it */
async function deliver(blob: Blob, filename: string, title: string) {
  const file = new File([blob], filename, { type: "application/pdf" })
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
  const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches
  if (coarse && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title })
      return
    } catch (error) {
      // Closing the share sheet is not a failure
      if (error instanceof DOMException && error.name === "AbortError") return
    }
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/**
 * Builds the PDF report in the browser. The PDF engine and fonts load only on the first tap,
 * so the match page itself stays light.
 */
export function PdfExportButton({ report, filenameParts, className, size = "lg", variant = "default", label }: {
  /** Called on tap, so the report always carries the latest data (an analysis just generated) */
  report: () => ReportInput
  filenameParts: string[]
  className?: string
  size?: "lg" | "sm" | "default" | "icon"
  variant?: "default" | "outline"
  label?: string
}) {
  const t = useTranslations("insights")
  const locale = useLocale()
  const [busy, setBusy] = useState(false)

  const handleExport = async () => {
    if (busy) return
    setBusy(true)
    try {
      const [{ pdf }, { MatchReportDocument, registerPdfFonts }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./match-report-pdf"),
      ])
      registerPdfFonts(window.location.origin)
      const generatedLabel = t("pdfGenerated", { date: new Date().toLocaleDateString(locale, { day: "numeric", month: "numeric", year: "numeric" }) })
      const input = report()
      const blob = await pdf(<MatchReportDocument {...input} t={t as unknown as Translate} locale={locale} generatedLabel={generatedLabel} />).toBlob()
      const filename = `${["tenis-click", ...filenameParts.map(slug)].filter(Boolean).join("-")}.pdf`
      await deliver(blob, filename, `${input.fullNames.p1} – ${input.fullNames.p2}`)
    } catch (error) {
      console.error("PDF export failed:", error)
      toast.error(t("exportFailed"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button type="button" size={size} variant={variant} onClick={handleExport} disabled={busy} className={className} aria-label={size === "icon" ? t("exportPdfAria") : undefined} data-pdf-export>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      {size !== "icon" && <span>{busy ? t("exportPreparing") : label ?? t("exportPdf")}</span>}
    </Button>
  )
}
