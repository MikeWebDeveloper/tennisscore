"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Sparkles } from "lucide-react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLocale, useTranslations } from "@/i18n"
import type { AnalysisJob, SavedAnalysis } from "@/lib/ai/match-analysis"

/** How often the card asks whether an analysis being written is done */
const POLL_MS = 8_000

const startErrorKey: Record<number, string> = { 503: "aiNotConfigured", 429: "aiQuota", 403: "aiNotAllowed" }
const failedKey: Record<string, string> = { quota: "aiQuota", "not-configured": "aiNotConfigured", timeout: "aiTimedOut" }

export interface AnalysisStatus {
  saved: SavedAnalysis | null
  job: AnalysisJob
}

/**
 * Gemini's coach-style analysis of the match, for the two admin accounts. Creating one starts it
 * on the server and returns at once: the card says to come back in a few minutes, keeps checking
 * while it stays open, and the saved analysis is there on the next visit (and in the PDF).
 */
export function AiAnalysisCard({ matchId, onChange }: { matchId: string; onChange?: (status: AnalysisStatus) => void }) {
  const t = useTranslations("insights")
  const locale = useLocale()
  const [loaded, setLoaded] = useState(false)
  const [status, setStatus] = useState<AnalysisStatus>({ saved: null, job: { status: "idle" } })
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const notify = useRef(onChange)
  useEffect(() => {
    notify.current = onChange
  }, [onChange])
  const wasPending = useRef(false)

  const apply = useCallback((next: AnalysisStatus) => {
    // Finished while the page was open: say so, wherever the person has scrolled to
    if (wasPending.current && next.job.status !== "pending" && next.saved) toast.success(t("aiReadyToast"))
    wasPending.current = next.job.status === "pending"
    setStatus(next)
    notify.current?.(next)
  }, [t])

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/match-analysis?matchId=${encodeURIComponent(matchId)}`, { cache: "no-store" })
      if (response.ok) apply(await response.json())
    } catch {
      // Offline for a moment: the next check tries again
    }
  }, [apply, matchId])

  useEffect(() => {
    refresh().finally(() => setLoaded(true))
  }, [refresh])

  // Keep checking while an analysis is being written
  useEffect(() => {
    if (status.job.status !== "pending") return
    const timer = setInterval(refresh, POLL_MS)
    return () => clearInterval(timer)
  }, [status.job.status, refresh])

  const start = async () => {
    setStarting(true)
    setStartError(null)
    try {
      const response = await fetch("/api/match-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, locale }),
      })
      if (!response.ok) {
        setStartError(t(startErrorKey[response.status] ?? "aiError"))
        return
      }
      apply(await response.json())
    } catch {
      setStartError(t("aiError"))
    } finally {
      setStarting(false)
    }
  }

  const { saved, job } = status
  const pending = job.status === "pending"
  const failure = startError ?? (job.status === "failed" ? t(failedKey[job.reason] ?? "aiError") : null)
  const sections: [string, string[]][] = saved
    ? [[t("aiStrengths"), saved.analysis.strengths], [t("aiImprovements"), saved.analysis.improvements], [t("aiTraining"), saved.analysis.trainingTips]]
    : []

  return (
    <Card className="rounded-2xl border-violet-500/40 bg-violet-500/5" data-ai-analysis={job.status}>
      <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-[15px] font-bold">
            <Sparkles className="h-[18px] w-[18px] text-violet-500" />
            {t("aiTitle")}
          </h3>
          <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[10.5px] font-bold text-violet-700 dark:text-violet-200">{t("aiBadge")}</span>
        </div>

        {!loaded ? (
          <div className="h-10 animate-pulse rounded-xl bg-muted" />
        ) : (
          <>
            {pending && (
              <div className="flex items-start gap-3 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3" role="status" data-ai-pending>
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-violet-500" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13.5px] font-bold">{t("aiPending")}</span>
                  <span className="text-xs leading-relaxed text-muted-foreground">{t("aiPendingHint")}</span>
                </div>
              </div>
            )}

            {saved ? (
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
            ) : !pending && (
              <p className="text-[13px] leading-relaxed text-muted-foreground">{t("aiIntro")}</p>
            )}

            {failure && !pending && <p className="text-[13px] font-medium text-red-600 dark:text-red-400" role="alert">{failure}</p>}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">
                {saved ? t("aiSaved", { date: new Date(saved.createdAt).toLocaleDateString(locale, { day: "numeric", month: "numeric", year: "numeric" }), model: saved.model }) : ""}
              </span>
              {!pending && (
                <Button type="button" variant={saved ? "outline" : "default"} onClick={start} disabled={starting} className="min-h-11" data-ai-start>
                  {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {saved ? t("aiRegenerate") : t("aiGenerate")}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
