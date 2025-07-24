// @ts-nocheck
/**
 * React 19 Concurrent Features Hooks
 * Implements useTransition and useDeferredValue for non-blocking UI updates
 */

'use client'

import { useTransition, useDeferredValue, useCallback, useMemo, useState, useEffect } from 'react'

/**
 * Enhanced useTransition hook with performance tracking
 */
export function useOptimizedTransition() {
  const [isPending, startTransition] = useTransition()

  const startTransitionWithMetrics = useCallback((callback: () => void, label?: string) => {
    const startTime = performance.now()
    
    startTransition(() => {
      try {
        callback()
        
        // Track performance in development
        if (process.env.NODE_ENV === 'development') {
          const endTime = performance.now()
          const duration = endTime - startTime
          
          if (duration > 50) {
            console.warn(`Slow transition "${label || 'unnamed'}": ${duration.toFixed(2)}ms`)
          }
        }
      } catch (error) {
        console.error(`Transition error in "${label || 'unnamed'}":`, error)
      }
    })
  }, [startTransition])

  return {
    isPending,
    startTransition: startTransitionWithMetrics
  }
}

/**
 * Enhanced useDeferredValue with loading states
 */
export function useOptimizedDeferredValue<T>(value: T) {
  
  const deferredValue = useDeferredValue(value)
  const isStale = value !== deferredValue
  
  // Memoize the result to prevent unnecessary re-renders
  const result = useMemo(() => ({
    value: deferredValue,
    isStale,
    isLoading: isStale
  }), [deferredValue, isStale])

  return result
}

/**
 * Concurrent search hook with debouncing and stale state management
 */
export function useConcurrentSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  initialQuery: string = '',
  options?: {
    debounceMs?: number
    minQueryLength?: number
    maxResults?: number
  }
) {
  const { debounceMs = 300, minQueryLength = 1, maxResults = 50 } = options || {}
  const { isPending, startTransition } = useOptimizedTransition()
  
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<T[]>([])
  const [error, setError] = useState<Error | null>(null)
  
  const deferredQuery = useOptimizedDeferredValue(query, { debounceMs })
  
  const search = useCallback((searchQuery: string) => {
    if (searchQuery.length < minQueryLength) {
      setResults([])
      setError(null)
      return
    }

    startTransition(async () => {
      try {
        setError(null)
        const searchResults = await searchFn(searchQuery)
        const limitedResults = maxResults ? searchResults.slice(0, maxResults) : searchResults
        setResults(limitedResults)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Search failed'))
        setResults([])
      }
    }, `search-${searchQuery}`)
  }, [searchFn, minQueryLength, maxResults, startTransition])

  // Trigger search when deferred query changes
  useEffect(() => {
    if (deferredQuery.value !== query) {
      // Query is stale, but we don't need to do anything special
      return
    }
    
    search(deferredQuery.value)
  }, [deferredQuery.value, search, query])

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery)
  }, [])

  return {
    query,
    updateQuery,
    results,
    error,
    isSearching: isPending || deferredQuery.isStale,
    isStale: deferredQuery.isStale
  }
}

/**
 * Concurrent list virtualization hook
 */
export function useConcurrentVirtualization<T>(
  items: T[],
  config: {
    itemHeight: number
    containerHeight: number
    overscan?: number
  }
) {
  const { itemHeight, containerHeight, overscan = 5 } = config
  const [scrollTop, setScrollTop] = useState(0)
  
  const deferredScrollTop = useOptimizedDeferredValue(scrollTop, { debounceMs: 16 })
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(deferredScrollTop.value / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    )
    
    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex: Math.min(items.length - 1, endIndex + overscan)
    }
  }, [deferredScrollTop.value, itemHeight, containerHeight, items.length, overscan])
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
      .map((item, index) => ({
        item,
        index: visibleRange.startIndex + index,
        top: (visibleRange.startIndex + index) * itemHeight
      }))
  }, [items, visibleRange, itemHeight])
  
  const totalHeight = items.length * itemHeight
  
  return {
    visibleItems,
    visibleRange,
    totalHeight,
    scrollTop: deferredScrollTop.value,
    setScrollTop,
    isScrolling: deferredScrollTop.isStale
  }
}

/**
 * Concurrent form validation hook
 */
export function useConcurrentFormValidation<T extends Record<string, unknown>>(
  values: T,
  validationFn: (values: T) => Promise<Record<keyof T, string | null>>,
  options?: {
    debounceMs?: number
    validateOnChange?: boolean
  }
) {
  const { validateOnChange = true } = options || {}
  const { isPending, startTransition } = useOptimizedTransition()
  
  const [errors, setErrors] = useState<Record<keyof T, string | null>>({} as Record<keyof T, string | null>)
  const [isValid, setIsValid] = useState(true)
  
  const deferredValues = useOptimizedDeferredValue(values)
  
  const validate = useCallback(async (formValues: T) => {
    startTransition(async () => {
      try {
        const validationErrors = await validationFn(formValues)
        setErrors(validationErrors)
        
        const hasErrors = Object.values(validationErrors).some(error => error !== null)
        setIsValid(!hasErrors)
      } catch (error) {
        console.error('Validation error:', error)
        setIsValid(false)
      }
    }, 'form-validation')
  }, [validationFn, startTransition])
  
  useEffect(() => {
    if (validateOnChange && !deferredValues.isStale) {
      validate(deferredValues.value)
    }
  }, [deferredValues.value, deferredValues.isStale, validate, validateOnChange])
  
  const validateNow = useCallback(() => {
    validate(values)
  }, [validate, values])
  
  return {
    errors,
    isValid,
    isValidating: isPending || deferredValues.isStale,
    validate: validateNow,
    isStale: deferredValues.isStale
  }
}

const concurrentFeaturesExports = {
  useOptimizedTransition,
  useOptimizedDeferredValue,
  useConcurrentSearch,
  useConcurrentVirtualization,
  useConcurrentFormValidation
}

export default concurrentFeaturesExports