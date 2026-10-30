"use client"

import { FileDown } from "lucide-react"
import { Loader2 } from "lucide-react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTranslations } from "@/i18n"
import { usePdfExport, type ButtonLook, type ReportInput } from "./pdf-export-button"

/**
 * For the AI accounts: the statistics PDF, or the same with the saved AI analysis. The second
 * stays disabled, with the reason, until an analysis is ready.
 */
export function PdfExportMenu({ report, filenameParts, aiState, className, size = "lg", variant = "default", label }: ButtonLook & {
  report: (withAnalysis: boolean) => ReportInput
  filenameParts: string[]
  aiState: "ready" | "pending" | "missing"
}) {
  const t = useTranslations("insights")
  const { busy, run } = usePdfExport(filenameParts)
  const aiHint = aiState === "ready" ? t("exportWithAiHint") : aiState === "pending" ? t("exportAiPending") : t("exportAiMissing")
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size={size} variant={variant} disabled={busy} className={className} aria-label={size === "icon" ? t("exportPdfAria") : undefined} data-pdf-export>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          {size !== "icon" && <span>{busy ? t("exportPreparing") : label ?? t("exportPdf")}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 max-w-[calc(100vw-2rem)]">
        <DropdownMenuItem className="min-h-11 items-start py-2" onSelect={() => run(report(false))} data-pdf-option="stats">
          <FileDown className="mt-0.5 h-4 w-4" />
          <span className="flex flex-col gap-0.5">
            <span className="font-medium">{t("exportStats")}</span>
            <span className="text-xs text-muted-foreground">{t("exportStatsHint")}</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem className="min-h-11 items-start py-2" disabled={aiState !== "ready"} onSelect={() => run(report(true), "ai")} data-pdf-option="ai">
          <Sparkles className="mt-0.5 h-4 w-4 text-violet-500" />
          <span className="flex flex-col gap-0.5">
            <span className="font-medium">{t("exportWithAi")}</span>
            <span className="text-xs text-muted-foreground">{aiHint}</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
