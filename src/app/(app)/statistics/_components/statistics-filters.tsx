"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Filter, 
  Calendar as CalendarIcon, 
  User, 
  RotateCcw,
  ChevronDown,
  X
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Match, Player } from "@/lib/types"

export interface StatisticsFilters {
  dateRange: {
    from?: Date
    to?: Date
  }
  opponent?: string
  matchFormat?: string
  status?: string
  minMatches?: number
}

interface StatisticsFiltersProps {
  matches: Match[]
  filters: StatisticsFilters
  onFiltersChange: (filters: StatisticsFilters) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function StatisticsFiltersComponent({
  matches,
  filters,
  onFiltersChange,
  isCollapsed = false,
  onToggleCollapse
}: StatisticsFiltersProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>(filters.dateRange)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  // Extract unique opponents from matches
  const opponents = Array.from(
    new Set(
      matches.flatMap(match => [
        match.playerOneName,
        match.playerTwoName,
        match.playerThreeName,
        match.playerFourName
      ]).filter((name): name is string => Boolean(name))
    )
  ).sort()

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setDateRange(range)
    onFiltersChange({
      ...filters,
      dateRange: range
    })
  }

  const handleFilterChange = (key: keyof StatisticsFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    const emptyFilters: StatisticsFilters = {
      dateRange: {},
      opponent: undefined,
      matchFormat: undefined,
      status: undefined,
      minMatches: undefined
    }
    setDateRange({})
    onFiltersChange(emptyFilters)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.dateRange.from || filters.dateRange.to) count++
    if (filters.opponent) count++
    if (filters.matchFormat) count++
    if (filters.status) count++
    if (filters.minMatches) count++
    return count
  }

  const activeFilters = getActiveFilterCount()

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Filters</CardTitle>
            {activeFilters > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilters} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs h-8"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                isCollapsed && "rotate-180"
              )} />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-4">
          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label htmlFor="dateRange" className="text-sm font-medium">
              Date Range
            </Label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.from && !dateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    "Pick a date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range) {
                      handleDateRangeChange({ from: range.from, to: range.to })
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            {(dateRange.from || dateRange.to) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDateRangeChange({})}
                className="text-xs h-6 px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Clear dates
              </Button>
            )}
          </div>

          {/* Opponent Filter */}
          <div className="space-y-2">
            <Label htmlFor="opponent" className="text-sm font-medium">
              Opponent
            </Label>
            <Select
              value={filters.opponent || ""}
              onValueChange={(value) => 
                handleFilterChange('opponent', value === "" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All opponents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All opponents</SelectItem>
                {opponents.map(opponent => (
                  <SelectItem key={opponent} value={opponent}>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      {opponent}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Match Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">
              Match Status
            </Label>
            <Select
              value={filters.status || ""}
              onValueChange={(value) => 
                handleFilterChange('status', value === "" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All matches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All matches</SelectItem>
                <SelectItem value="completed">Completed only</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Match Format Filter */}
          <div className="space-y-2">
            <Label htmlFor="format" className="text-sm font-medium">
              Match Format
            </Label>
            <Select
              value={filters.matchFormat || ""}
              onValueChange={(value) => 
                handleFilterChange('matchFormat', value === "" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All formats" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All formats</SelectItem>
                <SelectItem value="singles">Singles</SelectItem>
                <SelectItem value="doubles">Doubles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Minimum Matches Filter */}
          <div className="space-y-2">
            <Label htmlFor="minMatches" className="text-sm font-medium">
              Minimum Matches (for averages)
            </Label>
            <Input
              id="minMatches"
              type="number"
              min="1"
              max="100"
              value={filters.minMatches || ""}
              onChange={(e) => 
                handleFilterChange('minMatches', e.target.value ? parseInt(e.target.value) : undefined)
              }
              placeholder="e.g., 5"
              className="text-sm"
            />
          </div>
        </CardContent>
      )}
    </Card>
  )
}