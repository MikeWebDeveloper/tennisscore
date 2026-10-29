import { Fragment } from "react"
import { Player } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatPlayerRating } from "./player-rating-display"

interface PlayerMetaProps {
  /** One player, or both doubles partners in order */
  players: (Player | undefined)[]
  className?: string
}

const separator = <span className="text-muted-foreground"> / </span>

/**
 * Year, rating and club in the live scoreboard's colours (blue, purple, green); doubles partners are joined with " / ".
 * Year and rating never split, and clubs wrap like text, so a narrow card shows everything instead of cutting it off.
 */
export function PlayerMeta({ players, className }: PlayerMetaProps) {
  const present = players.filter((player): player is Player => Boolean(player))
  const details = present
    .map(player => ({ year: player.yearOfBirth, rating: formatPlayerRating(player) }))
    .filter(detail => detail.year || detail.rating)
  const clubs = present.map(player => player.club?.trim()).filter(Boolean)

  if (details.length === 0 && clubs.length === 0) return null

  return (
    <div data-player-meta className={cn("min-w-0 text-[11px] font-medium leading-snug", className)}>
      {details.length > 0 && (
        <div>
          {details.map((detail, index) => (
            <Fragment key={index}>
              {index > 0 && separator}
              {detail.year && <span className="whitespace-nowrap text-blue-600 dark:text-blue-400">{detail.year}</span>}
              {detail.year && detail.rating && " "}
              {detail.rating && <span className="whitespace-nowrap text-purple-600 dark:text-purple-400">({detail.rating})</span>}
            </Fragment>
          ))}
        </div>
      )}
      {clubs.length > 0 && (
        <div className="break-words text-green-600 dark:text-green-400">
          {clubs.map((club, index) => (
            <Fragment key={index}>
              {index > 0 && separator}
              {club}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
