"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Edit, Trash2, Star } from "lucide-react"
import { Player } from "@/lib/types"
import { PlayerAvatar } from "@/components/shared/player-avatar"
import { formatPlayerFromObject } from "@/lib/utils"
import { useTranslations } from "@/hooks/use-translations"

interface PlayerCardProps {
  player: Player
  onEdit: () => void
  onDelete: () => void
}

export function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  const t = useTranslations()
  
  return (
    <Card className={`relative group hover:shadow-md transition-all duration-200 w-full ${player.isMainPlayer ? 'bg-primary/10 border-2 border-primary' : ''}`}>
      {/* Action buttons in corner */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <Button 
          size="sm" 
          variant="ghost"
          onClick={onEdit}
          className="h-6 w-6 p-0 hover:bg-background/80 backdrop-blur-sm border border-border/50"
        >
          <Edit className="h-2.5 w-2.5" />
        </Button>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={onDelete}
          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive backdrop-blur-sm border border-border/50"
        >
          <Trash2 className="h-2.5 w-2.5" />
        </Button>
      </div>
      
      <CardContent className="p-3">
        <div className="flex items-center space-x-3 w-full">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <PlayerAvatar player={player} className="h-12 w-12" />
          </div>
          
          {/* Player Info */}
          <div className="min-w-0 flex-1 pr-10">
            <div className="flex items-center space-x-1.5 mb-1">
              <h3 className="text-sm font-semibold text-foreground leading-tight truncate">
                {formatPlayerFromObject(player)}
              </h3>
              {player.isMainPlayer && (
                <Star className="h-3 w-3 text-amber-500 flex-shrink-0" fill="currentColor" />
              )}
            </div>
            
            <div className="space-y-0.5">
              {player.isMainPlayer && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-medium text-primary">{t("mainPlayer")}</span>
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {player.yearOfBirth && (
                  <span>{t("born")}: {player.yearOfBirth}</span>
                )}
                {player.rating && (
                  <span>{t("rating")}: <span className="font-medium text-foreground">{player.rating}</span></span>
                )}
                {player.club && (
                  <span className="truncate max-w-[120px] sm:max-w-none">{t("club")}: <span className="font-medium text-foreground">{player.club}</span></span>
                )}
                {player.playingHand && (
                  <span>{t("plays")}: <span className="font-medium text-foreground">{player.playingHand === 'left' ? t("leftHanded") : t("rightHanded")}</span></span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
