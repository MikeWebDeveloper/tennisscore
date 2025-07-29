"use client"

import { useState, useEffect } from "react"
import { useMatchStore } from "@/stores/matchStore"
import { Clock } from "lucide-react"

interface MatchTimerDisplayProps {
  className?: string
  // Optional props to override store data (for public pages)
  startTime?: string | null
  endTime?: string | null
  setDurations?: number[]
  isMatchComplete?: boolean
}

export function MatchTimerDisplay({ 
  className, 
  startTime: propStartTime,
  endTime: propEndTime,
  setDurations: propSetDurations,
  isMatchComplete: propIsMatchComplete
}: MatchTimerDisplayProps) {
  const storeData = useMatchStore()
  const [currentTime, setCurrentTime] = useState<string>(new Date().toISOString())

  // Use props if provided, otherwise fall back to store
  const startTime = propStartTime !== undefined ? propStartTime : storeData.startTime
  const endTime = propEndTime !== undefined ? propEndTime : storeData.endTime
  const setDurations = propSetDurations !== undefined ? propSetDurations : storeData.setDurations
  const isMatchComplete = propIsMatchComplete !== undefined ? propIsMatchComplete : storeData.isMatchComplete

  // Update current time every second for live timer
  useEffect(() => {
    if (!isMatchComplete && startTime) {
      const interval = setInterval(() => {
        setCurrentTime(new Date().toISOString())
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isMatchComplete, startTime])

  // Helper function to format duration
  const formatDuration = (durationMs: number): string => {
    const totalSeconds = Math.floor(durationMs / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  // Calculate live duration
  const getLiveDuration = (): string => {
    if (!startTime) return "0m"
    
    const endTimeToUse = endTime || currentTime
    const durationMs = Date.parse(endTimeToUse) - Date.parse(startTime)
    return formatDuration(durationMs)
  }

  // Don't show timer if match hasn't started
  if (!startTime) {
    return null
  }

  return (
    <div className={`flex items-center gap-4 text-sm text-muted-foreground ${className}`}>
      {/* Live match duration */}
      <div className="flex items-center gap-1">
        <Clock className="h-4 w-4" />
        <span className="font-mono">
          {getLiveDuration()}
        </span>
        {!isMatchComplete && (
          <span className="text-green-500 animate-pulse">●</span>
        )}
      </div>

      {/* Set durations */}
      {setDurations.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs">Sets:</span>
          {setDurations.map((duration, index) => (
            <span key={index} className="text-xs font-mono bg-muted px-2 py-1 rounded">
              {index + 1}: {formatDuration(duration)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
} 