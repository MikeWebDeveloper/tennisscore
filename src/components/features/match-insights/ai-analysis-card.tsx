"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLocale, useTranslations } from "@/i18n"
import type { SavedAnalysis } from "@/lib/ai/match-analysis"

type Status = "loading" | "idle" | "generating"

const errorKey: Record<number, string> = { 503: "aiNotConfigured", 429: "aiQuota", 403: "aiNotAllowed" }

/**
 * Gemini's coach-style analysis of the match, for the two admin accounts. The latest saved
 * analysis loads with the page; creating one saves it, so the PDF and later visits show it too.
 */
export function AiAnalysisCard({ matchId, onChange }: { matchId: string; onChange?: (saved: SavedAnalysis | null) => void }) {
  const t = useTranslations("insights")
  const locale = useLocale()
  const [status, setStatus] = useState<Status>("loading")
  const [saved, setSaved] = useState<SavedAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/match-analysis?matchId=${encodeURIComponent(matchId)}`)
      .then((r) => (r.ok ? r.json() : { saved: null }))
      .then((data: { saved: SavedAnalysis | null }) => {
        if (cancelled) return
        setSaved(data.saved)
        onChange?.(data.saved)
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setStatus("idle"))
    return () => { cancelled = true }
    // onChange is a setter from the parent; reloading on its identity would refetch for nothing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId])

  const generate = async () => {
    setStatus("generating")
    setError(null)
    try {
      const response = await fetch("/api/match-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, locale }),
      })
      if (!response.ok) {
        setError(t(errorKey[response.status] ?? "aiError"))
        return
      }
      const data = (await response.json()) as { saved: SavedAnalysis }
      setSaved(data.saved)
      onChange?.(data.saved)
    } catch {
      setError(t("aiError"))
    } finally {
      setStatus("idle")
    }
  }

  const sections: [string, string[]][] = saved
    ? [[t("aiStrengths"), saved.analysis.strengths], [t("aiImprovements"), saved.analysis.improvements], [t("aiTraining"), saved.analysis.trainingTips]]
    : []

  return (
    <Card className="rounded-2xl border-violet-500/40 bg-violet-500/5" data-ai-analysis>
      <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-[15px] font-bold">
            <Sparkles className="h-[18px] w-[18px] text-violet-500" />
            {t("aiTitle")}
          </h3>
          <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[10.5px] font-bold text-violet-700 dark:text-violet-200">{t("aiBadge")}</span>
        </div>

        {status === "loading" ? (
          <div className="h-10 animate-pulse rounded-xl bg-muted" />
        ) : saved ? (
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">{t("aiSummary")}</span>
              <p className="text-[13.5px] leading-relaxed">{saved.analysis.summary}</p>
            </div>
            {sections.filter(([, items]) => items.length).map(([title, items]) => (
              <div key={title} className="flex flex-col gap-1">
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">{title}</span>
                <ul className="flex list-disc flex-col gap-1 pl-4 text-[13.5px] leading-relaxed marker:text-violet-500">
                  {items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground">{t("aiDisclaimer")}</p>
          </div>
        ) : (
          <p className="text-[13px] leading-relaxed text-muted-foreground">{t("aiIntro")}</p>
        )}

        {error && <p className="text-[13px] font-medium text-red-600 dark:text-red-400" role="alert">{error}</p>}

        {status !== "loading" && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">
              {saved ? t("aiSaved", { date: new Date(saved.createdAt).toLocaleDateString(locale, { day: "numeric", month: "numeric", year: "numeric" }), model: saved.model }) : ""}
            </span>
            <Button type="button" variant={saved ? "outline" : "default"} onClick={generate} disabled={status === "generating"} className="min-h-11">
              {status === "generating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {status === "generating" ? t("aiGenerating") : saved ? t("aiRegenerate") : t("aiGenerate")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
