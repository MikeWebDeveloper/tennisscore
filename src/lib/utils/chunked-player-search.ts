import {
  PlayerIndex,
  PlayerChunk,
  SearchResult,
  ChunkLoadingState,
  PlayerIndexEntry,
  CzechTennisPlayer,
} from '@/lib/types'

/**
 * Chunked Player Search System
 * 
 * Architecture:
 * 1. Index Search: Instant search on lightweight player index
 * 2. Progressive Enhancement: Load full data chunks as needed
 * 3. Caching: Cache loaded chunks for performance
 * 4. Offline Support: Works with cached data
 */
export class ChunkedPlayerSearch {
  private index: PlayerIndex | null = null
  private chunkCache: Map<string, CzechTennisPlayer[]> = new Map()
  private loadingState: ChunkLoadingState = {}
  private indexPromise: Promise<PlayerIndex> | null = null

  constructor() {
    this.initializeIndex()
  }

  /**
   * Initialize the player index (lightweight data for instant search)
   */
  private async initializeIndex(): Promise<void> {
    if (this.indexPromise) {
      await this.indexPromise
      return
    }

    this.indexPromise = this.loadIndex()
    this.index = await this.indexPromise
  }

  /**
   * Load the player index file
   */
  private async loadIndex(): Promise<PlayerIndex> {
    try {
      const response = await fetch('/data/tennis-players/index.json')
      if (!response.ok) {
        throw new Error(`Failed to load player index: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error loading player index:', error)
      throw new Error('Failed to load Czech tennis player data')
    }
  }

  /**
   * Load a specific chunk of player data
   */
  private async loadChunk(chunkId: string): Promise<CzechTennisPlayer[]> {
    // Return cached data if available
    if (this.chunkCache.has(chunkId)) {
      return this.chunkCache.get(chunkId)!
    }

    // Return if already loading
    if (this.loadingState[chunkId]?.loading) {
      // Wait for existing load to complete
      while (this.loadingState[chunkId]?.loading) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      return this.chunkCache.get(chunkId) || []
    }

    // Start loading
    this.loadingState[chunkId] = {
      loading: true,
      loaded: false,
    }

    try {
      const response = await fetch(`/data/tennis-players/chunk-${chunkId}.json`)
      if (!response.ok) {
        throw new Error(`Failed to load chunk ${chunkId}: ${response.status}`)
      }

      const chunkData: PlayerChunk = await response.json()
      const players = chunkData.players

      // Cache the data
      this.chunkCache.set(chunkId, players)
      
      // Update loading state
      this.loadingState[chunkId] = {
        loading: false,
        loaded: true,
        data: players,
      }

      return players
    } catch (error) {
      console.error(`Error loading chunk ${chunkId}:`, error)
      
      // Update loading state with error
      this.loadingState[chunkId] = {
        loading: false,
        loaded: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }

      return []
    }
  }

  /**
   * Normalize text for search (handle Czech diacritics)
   */
  private normalizeForSearch(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .trim()
  }

  /**
   * Search player index for immediate results
   */
  private searchIndex(query: string): PlayerIndexEntry[] {
    if (!this.index || !query.trim()) return []

    const normalizedQuery = this.normalizeForSearch(query)
    
    return this.index.players.filter(player => {
      const fullName = `${player.firstName} ${player.lastName}`
      const normalizedName = this.normalizeForSearch(fullName)
      const normalizedLastName = this.normalizeForSearch(player.lastName)
      const normalizedFirstName = this.normalizeForSearch(player.firstName)
      const normalizedClub = this.normalizeForSearch(player.club)
      
      return (
        normalizedName.includes(normalizedQuery) ||
        normalizedLastName.includes(normalizedQuery) ||
        normalizedFirstName.includes(normalizedQuery) ||
        normalizedClub.includes(normalizedQuery) ||
        player.bhRating.toLowerCase().includes(normalizedQuery.toLowerCase()) ||
        player.czRanking.toString().includes(normalizedQuery)
      )
    })
  }

  /**
   * Convert index entry to search result
   */
  private indexEntryToSearchResult(entry: PlayerIndexEntry): SearchResult {
    return {
      czRanking: entry.czRanking,
      lastName: entry.lastName,
      firstName: entry.firstName,
      club: entry.club,
      bhRating: entry.bhRating,
      uniqueId: entry.uniqueId,
      chunk: entry.chunk,
      isLoading: false,
      isEnhanced: false,
    }
  }

  /**
   * Enhance search result with chunk data
   */
  private enhanceSearchResult(
    result: SearchResult,
    chunkData: CzechTennisPlayer[]
  ): SearchResult {
    const fullPlayer = chunkData.find(p => p.uniqueId === result.uniqueId)
    
    if (fullPlayer) {
      return {
        ...result,
        yearOfBirth: fullPlayer.yearOfBirth,
        cztennisUrl: fullPlayer.cztennisUrl,
        isLoading: false,
        isEnhanced: true,
      }
    }

    return result
  }

  /**
   * Main search method with progressive enhancement
   */
  async search(query: string): Promise<SearchResult[]> {
    // Ensure index is loaded
    await this.initializeIndex()

    // Phase 1: Immediate index search
    const indexResults = this.searchIndex(query)
    
    if (indexResults.length === 0) {
      return []
    }

    // Convert to search results
    const searchResults = indexResults.map(entry => 
      this.indexEntryToSearchResult(entry)
    )

    // Phase 2: Identify required chunks
    const requiredChunks = new Set(
      indexResults.map(result => result.chunk)
    )

    // Phase 3: Load chunks and enhance results
    const enhancementPromises = Array.from(requiredChunks).map(async chunkId => {
      try {
        const chunkData = await this.loadChunk(chunkId)
        
        // Enhance results for this chunk
        searchResults.forEach(result => {
          if (result.chunk === chunkId) {
            const enhanced = this.enhanceSearchResult(result, chunkData)
            Object.assign(result, enhanced)
          }
        })
      } catch (error) {
        console.error(`Failed to enhance results for chunk ${chunkId}:`, error)
        
        // Mark results as failed to enhance
        searchResults.forEach(result => {
          if (result.chunk === chunkId) {
            result.isLoading = false
            result.isEnhanced = false
          }
        })
      }
    })

    // Wait for all enhancements to complete
    await Promise.all(enhancementPromises)

    // Sort by ranking
    return searchResults.sort((a, b) => a.czRanking - b.czRanking)
  }

  /**
   * Get a specific player by Czech Tennis ID
   */
  async getPlayerByUniqueId(uniqueId: string): Promise<CzechTennisPlayer | null> {
    await this.initializeIndex()
    
    if (!this.index) return null

    // Find player in index
    const indexEntry = this.index.players.find(p => p.uniqueId === uniqueId)
    if (!indexEntry) return null

    // Load the required chunk
    try {
      const chunkData = await this.loadChunk(indexEntry.chunk)
      return chunkData.find(p => p.uniqueId === uniqueId) || null
    } catch (error) {
      console.error(`Failed to load player ${uniqueId}:`, error)
      return null
    }
  }

  /**
   * Preload commonly accessed chunks for better performance
   */
  async preloadPopularChunks(): Promise<void> {
    // Preload A-D chunk (contains top players)
    try {
      await this.loadChunk('a-d')
    } catch (error) {
      console.error('Failed to preload popular chunks:', error)
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return {
      indexLoaded: this.index !== null,
      chunksLoaded: this.chunkCache.size,
      totalChunks: this.index?.metadata.chunks ? Object.keys(this.index.metadata.chunks).length : 0,
      cacheSize: Array.from(this.chunkCache.values()).reduce((total, chunk) => total + chunk.length, 0),
    }
  }

  /**
   * Clear cache and reset state
   */
  clearCache(): void {
    this.chunkCache.clear()
    this.loadingState = {}
    this.index = null
    this.indexPromise = null
  }
}

// Global instance for use across the application
export const czechPlayerSearch = new ChunkedPlayerSearch()