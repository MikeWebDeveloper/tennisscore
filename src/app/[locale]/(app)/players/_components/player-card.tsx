"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit } from "lucide-react"
import { Trash2 } from "lucide-react"
import { Star } from "lucide-react"
import { ExternalLink } from "lucide-react"
import { Player } from "@/lib/types"
import { PlayerAvatar } from "@/components/shared/player-avatar"
import { PlayerRatingDisplay } from "@/components/shared/player-rating-display"
import { formatPlayerFromObject } from "@/lib/utils"
import { useTranslations } from "@/i18n"

interface PlayerCardProps {
  player: Player
  onEdit: () => void
  onDelete: () => void
}

export function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  const t = useTranslations('common')
  
  return (
    <Card className={`surface-hover relative group w-full ${player.isMainPlayer ? 'border-brand/50 bg-brand/[0.07]' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-center space-x-3 w-full">
          <div className="flex-shrink-0">
            <PlayerAvatar player={player} className="h-12 w-12" />
          </div>
          
          {/* Player Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5 mb-1">
              <h3 className="text-sm font-semibold text-foreground leading-tight truncate">
                {formatPlayerFromObject(player)}
              </h3>
              {player.isMainPlayer && (
                <Star className="h-3 w-3 text-amber-500 flex-shrink-0" fill="currentColor" />
              )}
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2 flex-wrap">
                {player.isMainPlayer && (
                  <span className="text-xs font-medium text-primary">{t("mainPlayer")}</span>
                )}
                {player.isImportedFromCzech && (
                  <Badge variant="outline" className="text-xs h-4 px-1">
                    {t("czechImport")}
                  </Badge>
                )}
                {/* On the detail line rather than overlaid on the avatar, where a 7-digit ID ran past the card edge */}
                {player.czechTennisId && (
                  <span className="font-mono text-xs text-muted-foreground">#{player.czechTennisId}</span>
                )}
                {player.cztennisUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 px-1 text-xs hover:bg-muted/50"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(player.cztennisUrl, '_blank')
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    cztenis.cz
                  </Button>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {player.yearOfBirth && (
                  <span>{t("born")}: {player.yearOfBirth}</span>
                )}
                <PlayerRatingDisplay player={player} size="sm" />
                {player.club && (
                  <span>{t("club").replace(/ \(volitelné\)/, "")}: <span className="font-medium text-foreground">{player.club}</span></span>
                )}
                {player.playingHand && (
                  <span>{t("plays")}: <span className="font-medium text-foreground">{player.playingHand === 'left' ? t("leftHanded") : t("rightHanded")}</span></span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button size="icon" variant="ghost" onClick={onEdit}
              aria-label={`${t("edit")} ${formatPlayerFromObject(player)}`}
              className="h-11 w-11">
              <Edit className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onDelete}
              aria-label={`${t("delete")} ${formatPlayerFromObject(player)}`}
              className="h-11 w-11 hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
