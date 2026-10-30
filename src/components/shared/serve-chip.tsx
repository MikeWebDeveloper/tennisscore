import type { ServeIndicator } from "@/lib/utils/db-score"

/**
 * "1. podání" / "2. podání" beside the server, on every scoreboard: quiet for a first serve,
 * amber for a second, so anyone watching knows at a glance. Re-mounts on change to pop in.
 * Plain class strings (no class-merge helper) keep the lightweight spectator page small.
 */
export function ServeChip({ serve, label }: { serve: ServeIndicator; label: string }) {
  const look = serve === "second"
    ? "bg-amber-400 text-amber-950 ring-2 ring-amber-400/30"
    : "border border-border text-muted-foreground"
  return (
    <span
      key={serve}
      data-serve-chip={serve}
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-1.5 text-[10px] font-bold leading-4 animate-in zoom-in-75 duration-200 ${look}`}
    >
      {label}
    </span>
  )
}
