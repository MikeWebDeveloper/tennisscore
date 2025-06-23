"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Edit, Trash2, Star } from "lucide-react"
import { Player } from "@/lib/types"
import { PlayerAvatar } from "@/components/shared/player-avatar"
import { useTranslations } from "@/hooks/use-translations"

interface PlayerCardProps {
  player: Player
  onEdit: () => void
  onDelete: () => void
}

export function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  const t = useTranslations()
  
  return (
    <Card className="relative group hover:shadow-md transition-all duration-200">
      {/* Action buttons in corner */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <Button 
          size="sm" 
          variant="ghost"
          onClick={onEdit}
          className="h-7 w-7 p-0 hover:bg-background/80 backdrop-blur-sm border border-border/50"
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={onDelete}
          className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive backdrop-blur-sm border border-border/50"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <PlayerAvatar player={player} size="lg" />
          </div>
          
          {/* Player Info */}
          <div className="min-w-0 flex-1 pr-12">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-base sm:text-lg font-semibold text-foreground leading-tight">
                {player.firstName} {player.lastName}
              </h3>
              {player.isMainPlayer && (
                <Star className="h-4 w-4 text-amber-500 flex-shrink-0" fill="currentColor" />
              )}
            </div>
            
            <div className="space-y-1">
              {player.isMainPlayer && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-medium text-primary">{t("mainPlayer")}</span>
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                {player.yearOfBirth && (
                  <span>{t("born")}: {player.yearOfBirth}</span>
                )}
                {player.rating && (
                  <span>{t("rating")}: <span className="font-medium text-foreground">{player.rating}</span></span>
                )}
                {player.club && (
                  <span>{t("club")}: <span className="font-medium text-foreground">{player.club}</span></span>
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
