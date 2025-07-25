import { Match } from "@/lib/types"
import { StatisticsFilters } from "./statistics-filters"

/**
 * Apply filters to match data
 */
export function applyFiltersToMatches(matches: Match[], filters: StatisticsFilters, mainPlayerId?: string): Match[] {
  let filteredMatches = [...matches]

  // Date range filter
  if (filters.dateRange.from || filters.dateRange.to) {
    filteredMatches = filteredMatches.filter(match => {
      const matchDate = new Date(match.matchDate)
      
      if (filters.dateRange.from && matchDate < filters.dateRange.from) {
        return false
      }
      
      if (filters.dateRange.to) {
        const endOfDay = new Date(filters.dateRange.to)
        endOfDay.setHours(23, 59, 59, 999)
        if (matchDate > endOfDay) {
          return false
        }
      }
      
      return true
    })
  }

  // Opponent filter
  if (filters.opponent && mainPlayerId) {
    filteredMatches = filteredMatches.filter(match => {
      // Find who the opponent is based on mainPlayerId
      if (match.playerOneId === mainPlayerId) {
        return match.playerTwoId === filters.opponent ||
               match.playerTwo?.firstName === filters.opponent ||
               match.playerTwo?.lastName === filters.opponent ||
               `${match.playerTwo?.firstName} ${match.playerTwo?.lastName}` === filters.opponent
      } else if (match.playerTwoId === mainPlayerId) {
        return match.playerOneId === filters.opponent ||
               match.playerOne?.firstName === filters.opponent ||
               match.playerOne?.lastName === filters.opponent ||
               `${match.playerOne?.firstName} ${match.playerOne?.lastName}` === filters.opponent
      }
      // For doubles matches
      return match.playerThreeId === filters.opponent ||
             match.playerFourId === filters.opponent
    })
  }

  // Status filter
  if (filters.status) {
    filteredMatches = filteredMatches.filter(match => {
      const status = match.status.toLowerCase().replace(' ', '-')
      return status === filters.status
    })
  }

  // Match format filter
  if (filters.matchFormat) {
    filteredMatches = filteredMatches.filter(match => {
      const isDoubles = !!(match.playerThreeId && match.playerFourId)
      if (filters.matchFormat === 'singles') {
        return !isDoubles
      } else if (filters.matchFormat === 'doubles') {
        return isDoubles
      }
      return true
    })
  }

  return filteredMatches
}

/**
 * Get filter summary for display
 */
export function getFilterSummary(filters: StatisticsFilters, totalMatches: number, filteredMatches: number): string {
  const parts: string[] = []

  if (filters.dateRange.from || filters.dateRange.to) {
    if (filters.dateRange.from && filters.dateRange.to) {
      parts.push(`${filters.dateRange.from.toLocaleDateString()} - ${filters.dateRange.to.toLocaleDateString()}`)
    } else if (filters.dateRange.from) {
      parts.push(`From ${filters.dateRange.from.toLocaleDateString()}`)
    } else if (filters.dateRange.to) {
      parts.push(`Until ${filters.dateRange.to.toLocaleDateString()}`)
    }
  }

  if (filters.opponent) {
    parts.push(`vs ${filters.opponent}`)
  }

  if (filters.status) {
    parts.push(`${filters.status} matches`)
  }

  if (filters.matchFormat) {
    parts.push(`${filters.matchFormat} only`)
  }

  if (parts.length === 0) {
    return `All ${totalMatches} matches`
  }

  return `${filteredMatches} of ${totalMatches} matches (${parts.join(', ')})`
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: StatisticsFilters): boolean {
  return !!(
    filters.dateRange.from ||
    filters.dateRange.to ||
    filters.opponent ||
    filters.status ||
    filters.matchFormat ||
    filters.minMatches
  )
}