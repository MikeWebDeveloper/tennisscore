"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, SunMoon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/i18n"

export const THEME_ORDER = ["dark", "dim", "light"] as const

const options = [
  { value: "dark", icon: Moon, labelKey: "themeDark" },
  { value: "dim", icon: SunMoon, labelKey: "themeDim" },
  { value: "light", icon: Sun, labelKey: "themeLight" },
] as const

/** Three-way segmented picker: dark / dim / light. */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const t = useTranslations("navigation")
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div role="radiogroup" aria-label={t("theme")} className={cn("grid grid-cols-3 gap-1 rounded-lg bg-muted p-1", className)}>
      {options.map(({ value, icon: Icon, labelKey }) => {
        const active = mounted && resolvedTheme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-[11px] font-medium transition-colors",
              active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="max-w-full truncate">{t(labelKey)}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Header button: cycles dark → dim → light. Icon is chosen by CSS on <html>, so no mount gate. */
export function ThemeCycleButton({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const t = useTranslations("navigation")

  const next = () => {
    const i = THEME_ORDER.indexOf((resolvedTheme as (typeof THEME_ORDER)[number]) ?? "dark")
    setTheme(THEME_ORDER[(i + 1) % THEME_ORDER.length])
  }

  return (
    <button
      type="button"
      onClick={next}
      aria-label={t("switchTheme")}
      className={cn("inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-accent", className)}
    >
      <Sun className="hidden h-4 w-4 [.light_&]:block" aria-hidden="true" />
      <SunMoon className="hidden h-4 w-4 [.dim_&]:block" aria-hidden="true" />
      <Moon className="h-4 w-4 [.light_&]:hidden [.dim_&]:hidden" aria-hidden="true" />
    </button>
  )
}
