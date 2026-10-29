"use client"

import { Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SpectatorSoundToggleProps {
  enabled: boolean
  onToggle: () => void
  labels: { on: string; off: string }
}

/** Mute/unmute for match sounds on the spectator pages. */
export function SpectatorSoundToggle({ enabled, onToggle, labels }: SpectatorSoundToggleProps) {
  const label = enabled ? labels.on : labels.off
  return (
    <Button variant="outline" size="icon" onClick={onToggle} className="shrink-0" aria-pressed={enabled} aria-label={label} title={label}>
      {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </Button>
  )
}
