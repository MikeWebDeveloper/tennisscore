"use client"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, ExternalLink, Trophy, Calendar, MapPin, Loader2, Zap, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createPlayerFromCzechImport } from "@/lib/actions/players"
import { CzechTennisPlayer, SearchResult } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "@/i18n"
import { useChunkedPlayerSearch } from "@/hooks/use-chunked-player-search"
import { czechPlayerSearch } from "@/lib/utils/chunked-player-search"

interface CzechTennisImportProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onPlayerImported?: () => void
}

export function CzechTennisImport({ isOpen, onOpenChange, onPlayerImported }: CzechTennisImportProps) {
  const t = useTranslations('common')
  const [selectedPlayer, setSelectedPlayer] = useState<SearchResult | null>(null)
  const [fullPlayerData, setFullPlayerData] = useState<CzechTennisPlayer | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  // Use the chunked search hook
  const {
    query,
    setQuery,
    results,
    isSearching,
    isIndexLoading,
    error,
    hasSearched,
    searchStats,
    clearSearch,
    retrySearch,
  } = useChunkedPlayerSearch({
    debounceMs: 300,
    minQueryLength: 1,
    maxResults: 50,
    preloadOnMount: true,
  })

  // Clear search when dialog closes
  useEffect(() => {
    if (!isOpen) {
      clearSearch()
      setSelectedPlayer(null)
      setFullPlayerData(null)
      setShowConfirmation(false)
    }
  }, [isOpen, clearSearch])

  const handlePlayerSelect = async (player: SearchResult) => {
    setSelectedPlayer(player)
    
    // Load full player data if not already enhanced
    if (!player.isEnhanced) {
      try {
        const fullData = await czechPlayerSearch.getPlayerByUniqueId(player.uniqueId)
        setFullPlayerData(fullData)
      } catch (err) {
        console.error('Failed to load full player data:', err)
        toast({
          title: t('errorOccurred'),
          description: 'Failed to load complete player information',
          variant: "destructive",
        })
        return
      }
    } else {
      // Create full player data from enhanced search result
      setFullPlayerData({
        czRanking: player.czRanking,
        lastName: player.lastName,
        firstName: player.firstName,
        club: player.club,
        bhRating: player.bhRating,
        uniqueId: player.uniqueId,
        yearOfBirth: player.yearOfBirth!,
        cztennisUrl: player.cztennisUrl!,
      })
    }
    
    setShowConfirmation(true)
  }

  const handleImportConfirm = () => {
    if (!fullPlayerData) return

    startTransition(async () => {
      const result = await createPlayerFromCzechImport(fullPlayerData)
      
      if (result.success) {
        toast({
          title: t('playerImported'),
          description: `${fullPlayerData.firstName} ${fullPlayerData.lastName} was imported from Czech Tennis Rankings.`,
        })
        onOpenChange(false)
        clearSearch()
        setSelectedPlayer(null)
        setFullPlayerData(null)
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
    setFullPlayerData(null)
  }

  if (showConfirmation && fullPlayerData) {
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
                {fullPlayerData.firstName} {fullPlayerData.lastName}
              </h3>
              <Badge variant="secondary" className="font-mono">
                #{fullPlayerData.uniqueId}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span>CŽ Ranking: <strong>#{fullPlayerData.czRanking}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">BH:</span>
                <strong>{fullPlayerData.bhRating}</strong>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Born: <strong>{fullPlayerData.yearOfBirth}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate" title={fullPlayerData.club}>
                  <strong>{fullPlayerData.club}</strong>
                </span>
              </div>
            </div>
            
            <div className="pt-2">
              <Button
                variant="outline" 
                size="sm"
                className="w-full"
                onClick={() => window.open(fullPlayerData.cztennisUrl, '_blank')}
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
          <DialogTitle className="flex items-center gap-2">
            Import from Czech Tennis Rankings
            {isIndexLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <div>Search and import players from Czech U12 Girls Rankings (1,382 players available)</div>
            {searchStats.totalResults > 0 && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{searchStats.totalResults} results</span>
                <span>•</span>
                <span>{searchStats.enhancedResults} enhanced</span>
                <span>•</span>
                <span>{Math.round(searchStats.searchTime)}ms</span>
                {searchStats.enhancedResults > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Progressive loading
                    </span>
                  </>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-shrink-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, club, ranking, or BH rating..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              disabled={isIndexLoading}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={retrySearch}
                className="text-destructive hover:text-destructive"
              >
                Retry
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {isIndexLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
              <p>Loading Czech tennis player database...</p>
              <p className="text-sm">Preparing search index for optimal performance</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((player) => (
                <div
                  key={player.uniqueId}
                  className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors relative"
                  onClick={() => handlePlayerSelect(player)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {player.firstName} {player.lastName}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          #{player.czRanking}
                        </Badge>
                        {player.isEnhanced && (
                          <Badge variant="secondary" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Enhanced
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="truncate">{player.club}</span>
                        <span>•</span>
                        {player.isEnhanced && player.yearOfBirth ? (
                          <>
                            <span>Born {player.yearOfBirth}</span>
                            <span>•</span>
                          </>
                        ) : null}
                        <span>{player.bhRating}</span>
                        {!player.isEnhanced && (
                          <>
                            <span>•</span>
                            <span className="text-xs opacity-75">Chunk: {player.chunk.toUpperCase()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {player.isLoading && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      <Badge variant="secondary" className="font-mono text-xs">
                        #{player.uniqueId}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : hasSearched && query.trim().length > 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No players found matching "{query}"</p>
              <p className="text-sm">Try searching by first name, last name, club, or BH rating</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Start typing to search Czech tennis players</p>
              <p className="text-sm">Search by name, club, ranking, or BH rating</p>
              <p className="text-xs mt-2 opacity-75">Progressive loading • Instant results • Full dataset</p>
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