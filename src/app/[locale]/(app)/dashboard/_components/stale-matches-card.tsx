"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Link } from "@/i18n/navigation"
import { useLocale, useTranslations } from "@/i18n"
import { Button } from "@/components/ui/button"
import type { Match, Player } from "@/lib/types"
import { closeUnfinishedMatch } from "@/lib/actions/match-close"
import { formatPlayerFromObject } from "@/lib/utils"
import { parseDbScore } from "@/lib/utils/db-score"
import { matchPerspective } from "@/lib/utils/match-perspective"
import { lastActivity } from "@/lib/utils/resume-match"
import { DeleteMatchButton } from "../../matches/[id]/_components/delete-match-button"

const SHOWN = 3

interface StaleMatchesCardProps {
  matches: Match[]
  mainPlayerId: string
  playersMap: Map<string, Player>
}

/** Matches left "In Progress" for over a week: finish them, save them as unfinished, or delete them */
export function StaleMatchesCard({ matches, mainPlayerId, playersMap }: StaleMatchesCardProps) {
  const t = useTranslations("dashboard")
  const locale = useLocale()
  const router = useRouter()
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const left = matches.filter((match) => !hidden.has(match.$id))
  if (left.length === 0) return null
  const shown = showAll ? left : left.slice(0, SHOWN)
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "numeric", year: "numeric" })
  const name = (id?: string) => formatPlayerFromObject(id ? playersMap.get(id) : undefined)
  const hide = (id: string) => setHidden((previous) => new Set(previous).add(id))

  const close = async (matchId: string) => {
    setPending(matchId)
    const result = await closeUnfinishedMatch(matchId)
    setPending(null)
    if (!result.success) {
      toast.error(t("staleCloseFailed"))
      return
    }
    hide(matchId)
    toast.success(t("staleMarkedUnfinished"))
    router.refresh()
  }

  return (
    <section className="surface rounded-2xl px-4 py-3" aria-labelledby="stale-matches-title">
      <h2 id="stale-matches-title" className="text-sm font-semibold text-foreground">{t("staleMatchesTitle")}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{t("staleMatchesDescription", { count: left.length })}</p>
      <ul className="mt-3 divide-y divide-border/60">
        {shown.map((match) => {
          const { opponents } = matchPerspective(match, mainPlayerId)
          // The main player's side first, as on the resume card
          const flip = [match.playerTwoId, match.playerFourId].includes(mainPlayerId)
          const score = parseDbScore(match.score)
          const pairs: [number, number][] = [...score.sets, ...(score.games[0] || score.games[1] || !score.sets.length ? [score.games] : [])]
          const scoreText = pairs.map(([a, b]) => (flip ? `${b}:${a}` : `${a}:${b}`)).join(" ")
          return (
            <li key={match.$id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{opponents.map(name).filter(Boolean).join(" / ")}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono tabular-nums">{scoreText}</span>
                  {" · "}{t("staleLastScored", { date: date.format(lastActivity(match)) })}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button asChild size="sm" variant="outline" className="h-9">
                  <Link href={`/matches/live/${match.$id}`}>{t("staleContinue")}</Link>
                </Button>
                <Button size="sm" variant="secondary" className="h-9" disabled={pending === match.$id} onClick={() => void close(match.$id)}>
                  {t("staleMarkUnfinished")}
                </Button>
                <DeleteMatchButton
                  matchId={match.$id}
                  playerNames={{ p1: name(match.playerOneId), p2: name(match.playerTwoId) }}
                  onDeleteSuccess={() => hide(match.$id)}
                />
              </div>
            </li>
          )
        })}
      </ul>
      {!showAll && left.length > SHOWN && (
        <button type="button" onClick={() => setShowAll(true)} className="mt-1 min-h-11 text-sm font-medium text-foreground underline underline-offset-4">
          {t("staleShowAll", { count: left.length })}
        </button>
      )}
    </section>
  )
}
