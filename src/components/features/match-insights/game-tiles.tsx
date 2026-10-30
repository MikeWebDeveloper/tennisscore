"use client"

import { useTranslations } from "@/i18n"
import { cn } from "@/lib/utils"
import type { GameSummary, Side } from "@/lib/utils/match-insights"

const tileClass = (game: GameSummary) => {
  if (!game.winner) return "border-dashed border-muted-foreground text-muted-foreground"
  const blue = game.winner === "p1"
  if (game.isBreak || game.tiebreak) {
    return blue
      ? "border-2 border-blue-200 bg-blue-600 text-white dark:border-blue-300"
      : "border-2 border-red-200 bg-red-600 text-white dark:border-red-300"
  }
  return blue
    ? "border-blue-500/50 bg-blue-500/15 text-blue-800 dark:text-blue-100"
    : "border-red-500/50 bg-red-500/15 text-red-800 dark:text-red-100"
}

/**
 * One tile per game, coloured by who won it: light for a held serve, solid for a break (and for a
 * tiebreak). The tile shows the games score after that game; an unfinished game is dashed.
 */
export function GameTiles({ games, names, size = "md" }: { games: GameSummary[]; names: Record<Side, string>; size?: "md" | "sm" }) {
  const t = useTranslations("insights")
  return (
    <div className="flex flex-wrap gap-1" data-game-tiles>
      {games.map((game) => {
        const label = game.tiebreak ? t("tiebreakShort") : game.winner ? `${game.gamesAfter[0]}:${game.gamesAfter[1]}` : t("gameNow")
        const description = game.winner
          ? t("gameTileAria", { game: game.game, server: names[game.server], winner: names[game.winner], score: `${game.gamesAfter[0]}:${game.gamesAfter[1]}` })
          : t("gameTileOpenAria", { game: game.game, server: names[game.server] })
        return (
          <span
            key={`${game.set}-${game.game}`}
            role="img"
            aria-label={description}
            title={description}
            data-game-tile={game.isBreak ? "break" : game.winner ? "hold" : "open"}
            className={cn(
              "flex items-center justify-center rounded-[10px] border font-mono font-bold tabular-nums",
              size === "sm" ? "h-8 min-w-[34px] px-1 text-[11px]" : "h-9 min-w-[36px] px-1 text-xs",
              tileClass(game)
            )}
          >
            {label}
          </span>
        )
      })}
    </div>
  )
}
