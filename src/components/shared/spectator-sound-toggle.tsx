"use client"

import { Volume2, VolumeX } from "lucide-react"

interface SpectatorSoundToggleProps {
  enabled: boolean
  onToggle: () => void
  labels: { on: string; off: string }
}

/**
 * Mute/unmute for match sounds on the spectator pages. A plain button styled like the outline icon
 * button: the shared Button pulls class-merging libraries into the lightweight spectator page's budget.
 */
export function SpectatorSoundToggle({ enabled, onToggle, labels }: SpectatorSoundToggleProps) {
  const label = enabled ? labels.on : labels.off
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-foreground/10 bg-foreground/[0.03] text-sm font-medium outline-none transition-colors duration-100 hover:bg-foreground/[0.07] hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background active:brightness-90 motion-reduce:transition-none"
    >
      {enabled ? <Volume2 className="h-4 w-4" aria-hidden="true" /> : <VolumeX className="h-4 w-4" aria-hidden="true" />}
    </button>
  )
}
