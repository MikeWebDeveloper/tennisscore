"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Trash2, Star } from "lucide-react"
import { Player } from "@/lib/types"
import { PlayerAvatar } from "@/components/shared/player-avatar"

interface PlayerCardProps {
  player: Player
  onEdit: () => void
  onDelete: () => void
}

export function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  return (
    <Card className="h-full relative group">
      {/* Action buttons in corner */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <Button 
          size="sm" 
          variant="ghost"
          onClick={onEdit}
          className="h-6 w-6 p-0 hover:bg-background/80 backdrop-blur-sm border border-border/50"
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={onDelete}
          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive backdrop-blur-sm border border-border/50"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-base md:text-lg pr-16">
          <div className="flex items-center space-x-3">
            <PlayerAvatar player={player} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1">
                <span className="truncate font-semibold">
                  {player.firstName} {player.lastName}
                </span>
                {player.isMainPlayer && (
                  <Star className="h-4 w-4 text-amber-500 flex-shrink-0" fill="currentColor" />
                )}
              </div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {player.yearOfBirth && (
            <p className="text-xs md:text-sm text-muted-foreground">
              Born: {player.yearOfBirth}
            </p>
          )}
          {player.rating && (
            <p className="text-xs md:text-sm text-muted-foreground">
              Rating: <span className="font-medium">{player.rating}</span>
            </p>
          )}
          {player.isMainPlayer && (
            <p className="text-xs text-primary font-medium">
              ⭐ Main Player
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 