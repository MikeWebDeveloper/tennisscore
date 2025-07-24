'use client'

import { createContext, useContext, useCallback, useRef, ReactNode } from 'react'

type CleanupFunction = () => void
type CleanupPriority = 'high' | 'medium' | 'low'
type CleanupType = 'timer' | 'observer' | 'listener' | 'other'

interface CleanupItem {
  fn: CleanupFunction
  priority: CleanupPriority
  type: CleanupType
}

interface MemoryContextValue {
  registerCustomCleanup: (
    fn: CleanupFunction, 
    priority?: CleanupPriority, 
    type?: CleanupType
  ) => void
  cleanup: () => void
}

const MemoryContext = createContext<MemoryContextValue | undefined>(undefined)

interface MemoryProviderProps {
  children: ReactNode
}

export function MemoryProvider({ children }: MemoryProviderProps) {
  const cleanupItems = useRef<CleanupItem[]>([])

  const registerCustomCleanup = useCallback(
    (fn: CleanupFunction, priority: CleanupPriority = 'medium', type: CleanupType = 'other') => {
      cleanupItems.current.push({ fn, priority, type })
    },
    []
  )

  const cleanup = useCallback(() => {
    // Sort by priority (high first)
    const priorityOrder: CleanupPriority[] = ['high', 'medium', 'low']
    const sortedItems = cleanupItems.current.sort((a, b) => {
      return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
    })

    // Execute cleanup functions
    sortedItems.forEach(({ fn, type }) => {
      try {
        fn()
      } catch (error) {
        console.warn(`Cleanup failed for ${type}:`, error)
      }
    })

    // Clear the cleanup items array
    cleanupItems.current = []
  }, [])

  const value: MemoryContextValue = {
    registerCustomCleanup,
    cleanup
  }

  return (
    <MemoryContext.Provider value={value}>
      {children}
    </MemoryContext.Provider>
  )
}

export function useMemoryContext(): MemoryContextValue {
  const context = useContext(MemoryContext)
  if (context === undefined) {
    throw new Error('useMemoryContext must be used within a MemoryProvider')
  }
  return context
}