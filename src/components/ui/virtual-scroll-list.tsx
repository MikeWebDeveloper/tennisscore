"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"

export interface VirtualScrollListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  getItemKey?: (item: T, index: number) => string | number
  overscan?: number
  className?: string
  onScroll?: (scrollTop: number) => void
}

export function VirtualScrollList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  getItemKey = (_, index) => index,
  overscan = 5,
  className,
  onScroll
}: VirtualScrollListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  const totalHeight = items.length * itemHeight

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const containerStart = scrollTop
    const containerEnd = scrollTop + containerHeight

    let start = Math.floor(containerStart / itemHeight)
    let end = Math.ceil(containerEnd / itemHeight)

    // Add overscan
    start = Math.max(0, start - overscan)
    end = Math.min(items.length - 1, end + overscan)

    return { start, end }
  }, [scrollTop, containerHeight, itemHeight, overscan, items.length])

  // Get visible items
  const visibleItems = useMemo(() => {
    const result = []
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (items[i]) {
        result.push({
          item: items[i],
          index: i,
          key: getItemKey(items[i], i)
        })
      }
    }
    return result
  }, [items, visibleRange, getItemKey])

  // Handle scroll
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop
    setScrollTop(scrollTop)
    onScroll?.(scrollTop)
  }

  // Scroll to item
  const scrollToItem = useCallback((index: number, alignment: 'start' | 'center' | 'end' = 'start') => {
    if (!scrollElementRef.current) return

    const itemTop = index * itemHeight
    let scrollTo = itemTop

    if (alignment === 'center') {
      scrollTo = itemTop - containerHeight / 2 + itemHeight / 2
    } else if (alignment === 'end') {
      scrollTo = itemTop - containerHeight + itemHeight
    }

    scrollTo = Math.max(0, Math.min(scrollTo, totalHeight - containerHeight))
    scrollElementRef.current.scrollTop = scrollTo
  }, [itemHeight, containerHeight, totalHeight])

  // Public API
  useEffect(() => {
    if (scrollElementRef.current) {
      (scrollElementRef.current as any).scrollToItem = scrollToItem
    }
  }, [scrollToItem])

  if (items.length === 0) {
    return (
      <div
        className={cn("overflow-hidden", className)}
        style={{ height: containerHeight }}
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No items to display
        </div>
      </div>
    )
  }

  return (
    <div
      ref={scrollElementRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Total height spacer */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${visibleRange.start * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, index, key }) => (
            <div
              key={key}
              style={{
                height: itemHeight,
                overflow: 'hidden'
              }}
              data-index={index}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Hook for easier usage
export function useVirtualScrollList<T>(items: T[], itemHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const totalHeight = items.length * itemHeight
  const maxScrollTop = Math.max(0, totalHeight - containerHeight)
  
  const scrollToTop = () => setScrollTop(0)
  const scrollToBottom = () => setScrollTop(maxScrollTop)
  
  const scrollToItem = (index: number, alignment: 'start' | 'center' | 'end' = 'start') => {
    const itemTop = index * itemHeight
    let newScrollTop = itemTop

    if (alignment === 'center') {
      newScrollTop = itemTop - containerHeight / 2 + itemHeight / 2
    } else if (alignment === 'end') {
      newScrollTop = itemTop - containerHeight + itemHeight
    }

    newScrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop))
    setScrollTop(newScrollTop)
  }

  return {
    scrollTop,
    setScrollTop,
    scrollToTop,
    scrollToBottom,
    scrollToItem,
    totalHeight,
    maxScrollTop
  }
}