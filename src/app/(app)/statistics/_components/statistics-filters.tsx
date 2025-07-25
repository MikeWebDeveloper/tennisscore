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
  mainPlayerId: string
  filters: StatisticsFilters
  onFiltersChange: (filters: StatisticsFilters) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function StatisticsFiltersComponent({
  matches,
  mainPlayerId,
  filters,
  onFiltersChange,
  isCollapsed = false,
  onToggleCollapse
}: StatisticsFiltersProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>(filters.dateRange)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  // Extract unique opponents from matches
  const opponentsMap = new Map<string, Player>()
  matches.forEach(match => {
    // Find opponents based on mainPlayerId
    if (match.playerOneId === mainPlayerId && match.playerTwo) {
      opponentsMap.set(match.playerTwoId!, match.playerTwo)
    } else if (match.playerTwoId === mainPlayerId && match.playerOne) {
      opponentsMap.set(match.playerOneId!, match.playerOne)
    }
    // Handle doubles opponents
    if (match.playerThree && match.playerThreeId !== mainPlayerId) {
      opponentsMap.set(match.playerThreeId!, match.playerThree)
    }
    if (match.playerFour && match.playerFourId !== mainPlayerId) {
      opponentsMap.set(match.playerFourId!, match.playerFour)
    }
  })

  const opponents = Array.from(opponentsMap.values()).sort((a, b) => 
    `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
  )

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setDateRange(range)
    onFiltersChange({
      ...filters,
      dateRange: range
    })
  }

  const handleFilterChange = (key: keyof StatisticsFilters, value: string | number | undefined) => {
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
            {onToggleCollapse && (
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
            )}
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
                    "Pick date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="hidden sm:block">
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
                </div>
                <div className="block sm:hidden">
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
                    numberOfMonths={1}
                  />
                </div>
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
              value={filters.opponent || "all"}
              onValueChange={(value) => 
                handleFilterChange('opponent', value === "all" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All opponents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All opponents</SelectItem>
                {opponents.map(opponent => (
                  <SelectItem key={opponent.$id} value={opponent.$id}>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      {opponent.firstName} {opponent.lastName}
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
              value={filters.status || "all"}
              onValueChange={(value) => 
                handleFilterChange('status', value === "all" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All matches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All matches</SelectItem>
                <SelectItem value="completed">Completed only</SelectItem>
                <SelectItem value="in-progress">In progress</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Match Format Filter */}
          <div className="space-y-2">
            <Label htmlFor="format" className="text-sm font-medium">
              Match Format
            </Label>
            <Select
              value={filters.matchFormat || "all"}
              onValueChange={(value) => 
                handleFilterChange('matchFormat', value === "all" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All formats" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All formats</SelectItem>
                <SelectItem value="singles">Singles</SelectItem>
                <SelectItem value="doubles">Doubles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Minimum Matches Filter */}
          <div className="space-y-2">
            <Label htmlFor="minMatches" className="text-sm font-medium">
              Minimum Matches
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
              placeholder="Enter minimum matches"
              className="text-sm"
            />
          </div>
        </CardContent>
      )}
    </Card>
  )
}