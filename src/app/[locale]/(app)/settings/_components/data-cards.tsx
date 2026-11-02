"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Download, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLocale, useTranslations } from "@/i18n"
import { getExportPage, getTrash, type TrashItem } from "@/lib/actions/data-export"
import { restoreMatch } from "@/lib/actions/matches"
import type { Match } from "@/lib/types"
import { exportRows, toCsv, type ExportRow } from "@/lib/utils/match-export"

const PAGE = 50

function download(content: string, type: string, extension: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement("a")
  link.href = url
  link.download = `tenis-click-${new Date().toISOString().slice(0, 10)}.${extension}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const parse = (value: unknown) => {
  if (typeof value !== "string") return value
  try { return JSON.parse(value) } catch { return value }
}

/** Every match to a file: CSV for Excel, or JSON with everything recorded (points included) */
export function DataExportCard() {
  const t = useTranslations("settings")
  const locale = useLocale()
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  const run = async (format: "csv" | "json") => {
    setProgress({ done: 0, total: 0 })
    try {
      const matches: Match[] = []
      const names: Record<string, string> = {}
      for (let offset = 0; ; offset += PAGE) {
        const page = await getExportPage(offset)
        if (!page.matches) throw new Error(page.error)
        matches.push(...page.matches)
        Object.assign(names, page.names)
        setProgress({ done: matches.length, total: page.total ?? matches.length })
        if (page.matches.length < PAGE || matches.length >= (page.total ?? 0)) break
      }
      if (format === "csv") {
        const columns: [keyof ExportRow, string][] = ([
          ["id", "exportColId"], ["date", "exportColDate"], ["tournament", "exportColTournament"], ["type", "exportColType"],
          ["teamOne", "exportColTeamOne"], ["teamTwo", "exportColTeamTwo"], ["score", "exportColScore"], ["status", "exportColStatus"],
          ["winner", "exportColWinner"], ["endReason", "exportColEndReason"], ["detailLevel", "exportColDetail"], ["points", "exportColPoints"],
        ] as const).map(([key, label]) => [key, t(label)])
        download(toCsv(exportRows(matches, names), columns, locale === "cs" ? ";" : ","), "text/csv;charset=utf-8", "csv")
      } else {
        const full = matches.map((match) => ({
          ...match,
          score: parse(match.score),
          matchFormat: parse(match.matchFormat),
          pointLog: (match.pointLog ?? []).map(parse),
          events: ((match.events ?? []) as unknown[]).map(parse),
          players: Object.fromEntries((["playerOneId", "playerTwoId", "playerThreeId", "playerFourId"] as const)
            .map((key) => match[key]).filter((id): id is string => Boolean(id)).map((id) => [id, names[id] ?? null])),
        }))
        download(JSON.stringify({ exportedAt: new Date().toISOString(), matches: full }, null, 2), "application/json", "json")
      }
    } catch {
      toast.error(t("exportFailed"))
    } finally {
      setProgress(null)
    }
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader><CardTitle>{t("exportTitle")}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{t("exportHint")}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={progress !== null} onClick={() => void run("csv")}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />{t("exportCsv")}
          </Button>
          <Button type="button" variant="outline" disabled={progress !== null} onClick={() => void run("json")}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />{t("exportJson")}
          </Button>
        </div>
        {progress && progress.total > 0 && <p role="status" className="text-xs text-muted-foreground">{t("exportPreparing", progress)}</p>}
      </CardContent>
    </Card>
  )
}

/** Matches deleted in the last 7 days, each restorable until it is purged */
export function TrashCard() {
  const t = useTranslations("settings")
  const locale = useLocale()
  const [items, setItems] = useState<TrashItem[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [pending, setPending] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getTrash().then((result) => {
      if (cancelled) return
      if (result.items) setItems(result.items)
      else setFailed(true)
    })
    return () => { cancelled = true }
  }, [])

  const restore = async (id: string) => {
    setPending(id)
    try {
      await restoreMatch(id)
      setItems((previous) => previous?.filter((item) => item.id !== id) ?? null)
      toast.success(t("trashRestored"))
    } catch {
      toast.error(t("trashRestoreFailed"))
    } finally {
      setPending(null)
    }
  }

  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "numeric", year: "numeric" })
  return (
    <Card className="max-w-4xl">
      <CardHeader><CardTitle>{t("trashTitle")}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{t("trashHint")}</p>
        {failed && <p role="status" className="text-sm text-muted-foreground">{t("trashLoadFailed")}</p>}
        {items?.length === 0 && <p className="text-sm text-muted-foreground">{t("trashEmpty")}</p>}
        {items && items.length > 0 && (
          <ul className="divide-y divide-border/60">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.teamOne} – {item.teamTwo}</p>
                  <p className="text-xs text-muted-foreground">{date.format(new Date(item.matchDate))} · {t("trashDaysLeft", { count: item.daysLeft })}</p>
                </div>
                <Button type="button" size="sm" variant="outline" className="h-9" disabled={pending === item.id} onClick={() => void restore(item.id)}>
                  <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />{t("trashRestore")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
