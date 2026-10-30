"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { nameMatchesSearch, searchRank } from "@/lib/utils/player-name-search"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
  group?: string
  icon?: React.ReactNode
  disabled?: boolean
  /** Always listed, whatever is typed (an action such as "Create new player") */
  pinned?: boolean
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  /** Second line of the empty state, e.g. what to try instead */
  emptyHint?: string
  className?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select an option...",
  searchPlaceholder,
  emptyText = "No option found.",
  emptyHint,
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const searching = search.trim() !== ""

  // Our own filter, not cmdk's fuzzy one: that matched letters scattered across the label and the
  // record id, so "Nikola" listed nearly every player. Only labels containing the typed words stay.
  const visibleGroups = React.useMemo(() => {
    const groups = new Map<string, ComboboxOption[]>()
    options
      .filter(option => option.pinned || nameMatchesSearch(option.label, search))
      .forEach(option => {
        const group = option.group || "default"
        groups.set(group, [...(groups.get(group) ?? []), option])
      })
    const entries = [...groups.entries()]
    if (!searching) return entries
    // While searching, results lead: closest names first, pinned actions after them
    return entries
      .map(([group, groupOptions]) => [group, [...groupOptions].sort((a, b) => searchRank(a.label, search) - searchRank(b.label, search))] as const)
      .sort(([, a], [, b]) => Number(a.every(option => option.pinned)) - Number(b.every(option => option.pinned)))
  }, [options, search, searching])

  const hasMatches = visibleGroups.some(([, groupOptions]) => groupOptions.some(option => !option.pinned))
  const selectedOption = options.find(option => option.value === value)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setSearch("")
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedOption?.icon}
            {selectedOption ? selectedOption.label : placeholder}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-sm p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput value={search} onValueChange={setSearch} placeholder={searchPlaceholder ?? placeholder} className="h-8" />
          <CommandList className="max-h-48">
            {searching && !hasMatches && (
              <div data-combobox-empty className="px-3 py-5 text-center">
                <p className="text-sm font-medium">{emptyText}</p>
                {emptyHint && <p className="mt-1 text-xs text-muted-foreground">{emptyHint}</p>}
              </div>
            )}
            {visibleGroups.map(([groupName, groupOptions]) => (
              <CommandGroup
                key={groupName}
                heading={groupName !== "default" ? groupName : undefined}
              >
                {groupOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    onSelect={() => {
                      if (!option.disabled) {
                        onValueChange?.(option.value)
                        handleOpenChange(false)
                      }
                    }}
                    className={cn(
                      "text-sm py-1.5",
                      (groupName === "Main Player" || groupName === "Hlavní hráč") && "text-primary font-medium" // Special styling for main player
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {option.icon}
                      <span className="truncate">{option.label}</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 