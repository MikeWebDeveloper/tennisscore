"use client"

import { ReactNode, useEffect, useState } from "react"

interface ChartContainerProps {
  children: ReactNode
  className?: string
  minHeight?: string
}

export function ChartContainer({ 
  children, 
  className = "", 
  minHeight = "200px" 
}: ChartContainerProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Small delay to ensure container has dimensions
    const timer = setTimeout(() => setIsReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={className} style={{ minHeight }}>
      {isReady ? children : (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">Loading chart...</div>
        </div>
      )}
    </div>
  )
}