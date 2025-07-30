import { useState, useEffect, useCallback, useRef } from 'react'
import { SearchResult } from '@/lib/types'
import { czechPlayerSearch } from '@/lib/utils/chunked-player-search'

interface UseChunkedPlayerSearchOptions {
  debounceMs?: number
  minQueryLength?: number
  maxResults?: number
  preloadOnMount?: boolean
}

interface UseChunkedPlayerSearchReturn {
  query: string
  setQuery: (query: string) => void
  results: SearchResult[]
  isSearching: boolean
  isIndexLoading: boolean
  error: string | null
  hasSearched: boolean
  searchStats: {
    totalResults: number
    enhancedResults: number
    searchTime: number
  }
  clearSearch: () => void
  retrySearch: () => void
}

/**
 * Custom hook for debounced chunked player search
 * 
 * Features:
 * - 300ms debounce for optimal performance
 * - Progressive loading with instant index results
 * - Error handling and retry functionality
 * - Search statistics for monitoring
 * - Automatic preloading of popular chunks
 */
export function useChunkedPlayerSearch(
  options: UseChunkedPlayerSearchOptions = {}
): UseChunkedPlayerSearchReturn {
  const {
    debounceMs = 300,
    minQueryLength = 1,
    maxResults = 50,
    preloadOnMount = true,
  } = options

  // State
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isIndexLoading, setIsIndexLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchStats, setSearchStats] = useState({
    totalResults: 0,
    enhancedResults: 0,
    searchTime: 0,
  })

  // Refs for cleanup and debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const searchAbortRef = useRef<AbortController | undefined>(undefined)
  const mountedRef = useRef(true)

  /**
   * Perform the actual search
   */
  const performSearch = useCallback(async (searchQuery: string) => {
    // Clear previous search
    if (searchAbortRef.current) {
      searchAbortRef.current.abort()
    }

    // Create new abort controller
    const abortController = new AbortController()
    searchAbortRef.current = abortController

    // Clear error and start loading
    setError(null)
    setIsSearching(true)

    try {
      const searchStartTime = performance.now()

      // Perform the search
      const searchResults = await czechPlayerSearch.search(searchQuery)

      // Check if component is still mounted and search wasn't aborted
      if (!mountedRef.current || abortController.signal.aborted) {
        return
      }

      // Apply result limit
      const limitedResults = searchResults.slice(0, maxResults)

      // Calculate statistics
      const searchEndTime = performance.now()
      const enhancedCount = limitedResults.filter(r => r.isEnhanced).length

      setResults(limitedResults)
      setSearchStats({
        totalResults: searchResults.length,
        enhancedResults: enhancedCount,
        searchTime: searchEndTime - searchStartTime,
      })
      setHasSearched(true)
    } catch (err) {
      if (!mountedRef.current || abortController.signal.aborted) {
        return
      }

      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setError(errorMessage)
      setResults([])
      setSearchStats({
        totalResults: 0,
        enhancedResults: 0,
        searchTime: 0,
      })
    } finally {
      if (mountedRef.current && !abortController.signal.aborted) {
        setIsSearching(false)
      }
    }
  }, [maxResults])

  /**
   * Debounced search effect
   */
  useEffect(() => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // If query is too short, clear results
    if (query.length < minQueryLength) {
      setResults([])
      setHasSearched(false)
      setError(null)
      setSearchStats({
        totalResults: 0,
        enhancedResults: 0,
        searchTime: 0,
      })
      return
    }

    // Debounce the search
    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(query)
    }, debounceMs)

    // Cleanup
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [query, minQueryLength, debounceMs, performSearch])

  /**
   * Initialize index loading state
   */
  useEffect(() => {
    let mounted = true

    const initializeSearch = async () => {
      try {
        // Wait for index to be ready
        await czechPlayerSearch.search('')
        
        if (mounted) {
          setIsIndexLoading(false)
        }

        // Preload popular chunks if requested
        if (preloadOnMount) {
          czechPlayerSearch.preloadPopularChunks().catch(err => {
            console.warn('Failed to preload popular chunks:', err)
          })
        }
      } catch (err) {
        if (mounted) {
          setIsIndexLoading(false)
          setError('Failed to initialize search system')
        }
      }
    }

    initializeSearch()

    return () => {
      mounted = false
    }
  }, [preloadOnMount])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      
      if (searchAbortRef.current) {
        searchAbortRef.current.abort()
      }
    }
  }, [])

  /**
   * Clear search results and query
   */
  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setHasSearched(false)
    setError(null)
    setSearchStats({
      totalResults: 0,
      enhancedResults: 0,
      searchTime: 0,
    })

    // Cancel any pending search
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    if (searchAbortRef.current) {
      searchAbortRef.current.abort()
    }
  }, [])

  /**
   * Retry the current search
   */
  const retrySearch = useCallback(() => {
    if (query.length >= minQueryLength) {
      performSearch(query)
    }
  }, [query, minQueryLength, performSearch])

  return {
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
  }
}