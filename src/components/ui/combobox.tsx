"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn, normalizeTextForSearch } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
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
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select an option...",
  emptyText = "No option found.",
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  // Group options by their group property
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, ComboboxOption[]> = {}
    
    options.forEach(option => {
      const group = option.group || "default"
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(option)
    })
    
    return groups
  }, [options])

  const selectedOption = options.find(option => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        <Command>
          <CommandInput placeholder="Search..." className="h-8" />
          <CommandList className="max-h-48">
            <CommandEmpty>{emptyText}</CommandEmpty>
            {Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
              <CommandGroup
                key={groupName}
                heading={groupName !== "default" ? groupName : undefined}
              >
                {groupOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${normalizeTextForSearch(option.label)} ${normalizeTextForSearch(option.value)} ${option.label} ${option.value}`} // Include normalized and original for diacritic-insensitive search
                    disabled={option.disabled}
                    onSelect={() => {
                      if (!option.disabled) {
                        onValueChange?.(option.value)
                        setOpen(false)
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