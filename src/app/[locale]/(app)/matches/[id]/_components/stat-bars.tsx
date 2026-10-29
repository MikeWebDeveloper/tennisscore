"use client"

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { motion } from "@/lib/framer-motion-config"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/** Rows fade and rise in one after another when their card appears. */
export const statItemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

/** False on the first paint and true a couple of frames later, so bars start empty and grow into place. */
function useGrown() {
  const [grown, setGrown] = useState(false)
  useEffect(() => {
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setGrown(true))
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
    }
  }, [])
  return grown
}

/**
 * Blue (player one) and red (player two) halves sized by their share, so the bar leans toward
 * whoever has more. CSS transitions rather than JS animation: the bar always ends at its value,
 * and slides when a new point changes the numbers.
 */
export function ComparisonBar({ value1, value2, size = "md" }: { value1: number; value2: number; size?: "md" | "sm" }) {
  const grown = useGrown()
  const total = value1 + value2
  const height = size === "sm" ? "h-1.5" : "h-2"

  // Nothing to compare: a neutral track, not a misleading 50:50
  if (total <= 0) {
    return <div data-comparison-bar data-bar-empty className={cn(height, "rounded-full bg-muted")} />
  }

  const share1 = grown ? (value1 / total) * 100 : 0
  const share2 = grown ? (value2 / total) * 100 : 0
  return (
    <div data-comparison-bar className={cn("flex overflow-hidden rounded-full bg-muted", height)}>
      <div data-bar-side className="h-full bg-blue-500 transition-[width] duration-700 ease-out" style={{ width: `${share1}%` }} />
      <div data-bar-side className="ml-auto h-full border-l-2 border-card bg-red-500 transition-[width] duration-700 ease-out" style={{ width: `${share2}%` }} />
    </div>
  )
}

type Tone = "lead1" | "lead2" | "trail" | "even"

const toneClasses: Record<Tone, string> = {
  lead1: "font-semibold text-blue-600 dark:text-blue-400",
  lead2: "font-semibold text-red-600 dark:text-red-400",
  trail: "text-muted-foreground",
  even: "font-semibold text-foreground",
}

function tones(value1: number, value2: number): [Tone, Tone] {
  if (value1 === value2) return ["even", "even"]
  return value1 > value2 ? ["lead1", "trail"] : ["trail", "lead2"]
}

/** A number that pops when it changes (a new point), but not on first load. */
function StatValue({ value, display, tone, className }: { value: number; display: string; tone: Tone; className?: string }) {
  const previous = useRef(value)
  const changed = previous.current !== value
  useEffect(() => {
    previous.current = value
  }, [value])
  return (
    <span
      // A new key replays the pop animation for the changed value
      key={changed ? `changed-${value}` : "steady"}
      data-stat-value
      className={cn("inline-block font-mono tabular-nums", toneClasses[tone], changed && "stat-pop", className)}
    >
      {display}
    </span>
  )
}

/** Main statistics row: both players' values, the label and the leaning bar; optionally opens a breakdown. */
export function StatRow({
  label,
  value1,
  value2,
  format = "number",
  showProgress = true,
  onClick,
  isExpanded = false,
  expandedContent,
}: {
  label: string
  value1: number
  value2: number
  format?: "number" | "percentage"
  showProgress?: boolean
  onClick?: () => void
  isExpanded?: boolean
  expandedContent?: ReactNode
}) {
  const formatValue = (value: number) => (format === "percentage" ? `${value.toFixed(0)}%` : value.toString())
  const [tone1, tone2] = tones(value1, value2)

  return (
    <motion.div variants={statItemVariants} className="space-y-2">
      {/* A row with a breakdown behaves like a button and shows an arrow, so it is clear it can be tapped */}
      <div
        className={cn("space-y-2", onClick && "-m-2 cursor-pointer rounded p-2 transition-colors hover:bg-muted/50")}
        onClick={onClick}
        {...(onClick && {
          role: "button",
          // Opts out of the global phone touch-target layout (see globals.css)
          "data-stat-toggle": "",
          tabIndex: 0,
          "aria-expanded": isExpanded,
          onKeyDown: (event: KeyboardEvent) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              onClick()
            }
          },
        })}
      >
        <div className="flex items-center justify-between text-sm">
          <StatValue value={value1} display={formatValue(value1)} tone={tone1} />
          <span className="flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
            {label}
            {onClick && (
              <ChevronDown data-expand-icon aria-hidden="true" className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-180")} />
            )}
          </span>
          <StatValue value={value2} display={formatValue(value2)} tone={tone2} />
        </div>
        {showProgress && <ComparisonBar value1={value1} value2={value2} />}
      </div>

      {/* Fades in below the row; no height animation that could leave it clipped */}
      {isExpanded && expandedContent && (
        <div data-stat-breakdown className="stat-expand mt-3 space-y-3 border-l-2 border-muted pl-4">
          {expandedContent}
        </div>
      )}
    </motion.div>
  )
}

/** One line of a breakdown (a shot type, a placement): counts either side, label, and a thin leaning bar. */
export function BreakdownRow({ label, value1, value2 }: { label: string; value1: number; value2: number }) {
  const [tone1, tone2] = tones(value1, value2)
  return (
    <div data-breakdown-row className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <StatValue value={value1} display={String(value1)} tone={tone1} />
        <span className="text-xs text-muted-foreground">{label}</span>
        <StatValue value={value2} display={String(value2)} tone={tone2} />
      </div>
      <ComparisonBar value1={value1} value2={value2} size="sm" />
    </div>
  )
}
