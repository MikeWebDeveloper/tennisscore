"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, ExternalLink, Trophy, Calendar, MapPin } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { searchCzechPlayers, getCzechTennisMetadata } from "@/lib/utils/czech-tennis"
import { createPlayerFromCzechImport } from "@/lib/actions/players"
import { CzechTennisPlayer } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "@/i18n"

interface CzechTennisImportProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onPlayerImported?: () => void
}

export function CzechTennisImport({ isOpen, onOpenChange, onPlayerImported }: CzechTennisImportProps) {
  const t = useTranslations('common')
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<CzechTennisPlayer[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<CzechTennisPlayer | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const metadata = getCzechTennisMetadata()

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim().length > 0) {
      const results = searchCzechPlayers(query)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }

  const handlePlayerSelect = (player: CzechTennisPlayer) => {
    setSelectedPlayer(player)
    setShowConfirmation(true)
  }

  const handleImportConfirm = () => {
    if (!selectedPlayer) return

    startTransition(async () => {
      const result = await createPlayerFromCzechImport(selectedPlayer)
      
      if (result.success) {
        toast({
          title: t('playerImported'),
          description: `${selectedPlayer.firstName} ${selectedPlayer.lastName} was imported from Czech Tennis Rankings.`,
        })
        onOpenChange(false)
        setSearchQuery("")
        setSearchResults([])
        setSelectedPlayer(null)
        setShowConfirmation(false)
        onPlayerImported?.()
      } else {
        toast({
          title: t('errorOccurred'),
          description: result.error || 'Failed to import player',
          variant: "destructive",
        })
      }
    })
  }

  const handleBackToSearch = () => {
    setShowConfirmation(false)
    setSelectedPlayer(null)
  }

  if (showConfirmation && selectedPlayer) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Import Player Confirmation</DialogTitle>
            <DialogDescription>
              Would you like to import this player from Czech Tennis Rankings?
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                {selectedPlayer.firstName} {selectedPlayer.lastName}
              </h3>
              <Badge variant="secondary" className="font-mono">
                #{selectedPlayer.uniqueId}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span>CŽ Ranking: <strong>#{selectedPlayer.czRanking}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">BH:</span>
                <strong>{selectedPlayer.bhRating}</strong>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Born: <strong>{selectedPlayer.yearOfBirth}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate" title={selectedPlayer.club}>
                  <strong>{selectedPlayer.club}</strong>
                </span>
              </div>
            </div>
            
            <div className="pt-2">
              <Button
                variant="outline" 
                size="sm"
                className="w-full"
                onClick={() => window.open(selectedPlayer.cztennisUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on cztenis.cz
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBackToSearch}
              disabled={isPending}
              className="flex-1"
            >
              Back to Search
            </Button>
            <Button
              onClick={handleImportConfirm}
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? 'Importing...' : t('importPlayer')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl mx-auto max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Import from Czech Tennis Rankings</DialogTitle>
          <DialogDescription>
            Search and import players from {metadata.category} ({metadata.totalPlayers} players available)
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-shrink-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, club, or ranking..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((player) => (
                <div
                  key={player.uniqueId}
                  className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handlePlayerSelect(player)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {player.firstName} {player.lastName}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          #{player.czRanking}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{player.club}</span>
                        <span>•</span>
                        <span>Born {player.yearOfBirth}</span>
                        <span>•</span>
                        <span>{player.bhRating}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs">
                      #{player.uniqueId}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery.trim().length > 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No players found matching "{searchQuery}"</p>
              <p className="text-sm">Try searching by first name, last name, or club</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Start typing to search Czech tennis players</p>
              <p className="text-sm">Search by name, club, ranking, or BH rating</p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            {t('cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}