"use client"

import { useEffect, useRef, useState } from "react"
import type { SoundEvent } from "@/lib/sounds"

// The sound library loads after the page is interactive: the lightweight spectator page has a tight
// first-load budget, and most viewers never turn sounds on
type SoundsModule = typeof import("@/lib/sounds")
let soundsModule: Promise<SoundsModule> | null = null
const loadSounds = () => (soundsModule ??= import("@/lib/sounds"))

/** What a spectator page knows about the match after each update. */
export interface ScoreSnapshot {
  pointCount: number
  lastOutcome?: string
  sets: number
  games: number
  status?: string
}

/** Snapshot from the saved point strings and parsed score that both spectator pages already hold. */
export function snapshotFrom(pointLog: string[] | undefined, score: { sets: unknown[]; games: number[] }, status?: string): ScoreSnapshot {
  const last = pointLog?.[pointLog.length - 1]
  let lastOutcome: string | undefined
  try { lastOutcome = last ? (JSON.parse(last) as { pointOutcome?: string }).pointOutcome : undefined } catch { lastOutcome = undefined }
  return { pointCount: pointLog?.length ?? 0, lastOutcome, sets: score.sets.length, games: (score.games[0] ?? 0) + (score.games[1] ?? 0), status }
}

/** The sound for the change between two updates; null when no new point arrived (first load, refresh, undo). */
export function spectatorSoundFor(previous: ScoreSnapshot, next: ScoreSnapshot): SoundEvent | null {
  if (next.pointCount <= previous.pointCount) return null
  if (next.status === "Completed" && previous.status !== "Completed") return "match-won"
  if (next.sets > previous.sets) return "set-won"
  if (next.lastOutcome === "ace") return "ace"
  if (next.lastOutcome === "double_fault") return "double-fault"
  if (next.games > previous.games) return "game-won"
  return "point-won"
}

/**
 * Opt-in match sounds for people watching through the share link. Off until the viewer turns it on
 * (browsers only allow audio after a tap); the choice is remembered with the device's other sound settings.
 */
export function useSpectatorSounds(snapshot: ScoreSnapshot) {
  const [enabled, setEnabled] = useState(false)
  const previous = useRef(snapshot)

  useEffect(() => {
    let cancelled = false
    void loadSounds().then(sounds => { if (!cancelled) setEnabled(sounds.soundManager.getSettings().enabled) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const event = spectatorSoundFor(previous.current, snapshot)
    previous.current = snapshot
    if (event && enabled) void loadSounds().then(sounds => sounds.playSound(event))
  }, [snapshot, enabled])

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    // Already loaded by now, so the confirmation still plays within the tap and unlocks audio on iPhone
    void loadSounds().then(sounds => {
      sounds.soundManager.updateSettings({ enabled: next })
      if (next) void sounds.playSound("point-won")
    })
  }

  return { enabled, toggle }
}
