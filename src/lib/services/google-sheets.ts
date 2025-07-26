import { TournamentPlayer } from '@/lib/types/tournament'

export interface GoogleSheetsConfig {
  endpoint: string
  apiKey?: string
  sheetId?: string
}

export interface GoogleSheetsResponse {
  success: boolean
  players?: TournamentPlayer[]
  error?: string
}

export class GoogleSheetsService {
  private config: GoogleSheetsConfig

  constructor(config: GoogleSheetsConfig) {
    this.config = config
  }

  async fetchPlayers(): Promise<GoogleSheetsResponse> {
    try {
      if (!this.config.endpoint) {
        throw new Error('Google Sheets endpoint not configured')
      }

      console.log('[GoogleSheets] Fetching players from:', this.config.endpoint)

      const response = await fetch(this.config.endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Parse the response and convert to TournamentPlayer format
      const players = this.parsePlayersData(data)
      
      console.log('[GoogleSheets] Successfully fetched', players.length, 'players')
      
      return {
        success: true,
        players
      }
    } catch (error) {
      console.error('[GoogleSheets] Error fetching players:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async validateConnection(): Promise<boolean> {
    try {
      const result = await this.fetchPlayers()
      return result.success
    } catch {
      return false
    }
  }

  private parsePlayersData(data: unknown): TournamentPlayer[] {
    // Handle different possible Google Sheets response formats
    let rows: unknown[] = []

    if (Array.isArray(data)) {
      rows = data
    } else if (data && typeof data === 'object') {
      // Common Google Sheets API response formats
      const dataObj = data as Record<string, unknown>
      
      if (Array.isArray(dataObj.values)) {
        rows = dataObj.values
      } else if (Array.isArray(dataObj.data)) {
        rows = dataObj.data
      } else if (Array.isArray(dataObj.players)) {
        rows = dataObj.players
      } else {
        console.warn('[GoogleSheets] Unknown response format:', data)
        return []
      }
    }

    const players: TournamentPlayer[] = []

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i]
        const player = this.parsePlayerRow(row, i)
        if (player) {
          players.push(player)
        }
      } catch (error) {
        console.warn(`[GoogleSheets] Error parsing row ${i}:`, error)
        continue
      }
    }

    return players
  }

  private parsePlayerRow(row: unknown, index: number): TournamentPlayer | null {
    // Skip header row if it exists
    if (index === 0 && this.isHeaderRow(row)) {
      return null
    }

    if (Array.isArray(row)) {
      // Array format: [name, surname, yearOfBirth, ranking?, ...]
      const [name, surname, yearOfBirth, ranking] = row
      
      if (!name || !surname) {
        return null
      }

      return {
        id: `gs_${index}_${String(name).toLowerCase()}_${String(surname).toLowerCase()}`,
        name: String(name).trim(),
        surname: String(surname).trim(),
        yearOfBirth: this.parseYearOfBirth(yearOfBirth),
        ranking: ranking ? Number(ranking) : undefined
      }
    } else if (row && typeof row === 'object') {
      // Object format: { name, surname, yearOfBirth, ranking?, ... }
      const rowObj = row as Record<string, unknown>
      
      const name = this.extractFieldValue(rowObj, ['name', 'firstName', 'first_name'])
      const surname = this.extractFieldValue(rowObj, ['surname', 'lastName', 'last_name', 'family_name'])
      const yearOfBirth = this.extractFieldValue(rowObj, ['yearOfBirth', 'birth_year', 'year_of_birth', 'birthYear'])
      const ranking = this.extractFieldValue(rowObj, ['ranking', 'rank', 'position'])

      if (!name || !surname) {
        return null
      }

      return {
        id: `gs_${index}_${String(name).toLowerCase()}_${String(surname).toLowerCase()}`,
        name: String(name).trim(),
        surname: String(surname).trim(),
        yearOfBirth: this.parseYearOfBirth(yearOfBirth),
        ranking: ranking ? Number(ranking) : undefined
      }
    }

    return null
  }

  private isHeaderRow(row: unknown): boolean {
    if (Array.isArray(row)) {
      const firstCell = String(row[0] || '').toLowerCase()
      return ['name', 'first', 'player', 'nom'].includes(firstCell)
    } else if (row && typeof row === 'object') {
      // If it's an object, it's likely data, not headers
      return false
    }
    return false
  }

  private extractFieldValue(obj: Record<string, unknown>, possibleKeys: string[]): unknown {
    for (const key of possibleKeys) {
      if (key in obj && obj[key] != null) {
        return obj[key]
      }
    }
    return undefined
  }

  private parseYearOfBirth(value: unknown): number {
    if (value == null) {
      return new Date().getFullYear() - 25 // Default age assumption
    }

    const year = Number(value)
    
    if (isNaN(year)) {
      // Try to extract year from date string
      const dateMatch = String(value).match(/\b(\d{4})\b/)
      if (dateMatch) {
        return Number(dateMatch[1])
      }
      return new Date().getFullYear() - 25 // Default fallback
    }

    // Validate reasonable year range
    const currentYear = new Date().getFullYear()
    if (year < 1900 || year > currentYear) {
      return new Date().getFullYear() - 25 // Default fallback
    }

    return year
  }
}

// Mock service for development and testing
export class MockGoogleSheetsService extends GoogleSheetsService {
  constructor() {
    super({ endpoint: 'mock://localhost' })
  }

  async fetchPlayers(): Promise<GoogleSheetsResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const mockPlayers: TournamentPlayer[] = [
      {
        id: 'mock_1',
        name: 'John',
        surname: 'Doe',
        yearOfBirth: 1990,
        ranking: 1
      },
      {
        id: 'mock_2',
        name: 'Jane',
        surname: 'Smith',
        yearOfBirth: 1985,
        ranking: 2
      },
      {
        id: 'mock_3',
        name: 'Bob',
        surname: 'Johnson',
        yearOfBirth: 1992,
        ranking: 3
      },
      {
        id: 'mock_4',
        name: 'Alice',
        surname: 'Williams',
        yearOfBirth: 1988,
        ranking: 4
      },
      {
        id: 'mock_5',
        name: 'Charlie',
        surname: 'Brown',
        yearOfBirth: 1991,
        ranking: 5
      },
      {
        id: 'mock_6',
        name: 'Diana',
        surname: 'Davis',
        yearOfBirth: 1987,
        ranking: 6
      }
    ]

    return {
      success: true,
      players: mockPlayers
    }
  }

  async validateConnection(): Promise<boolean> {
    return true
  }
}

// Factory function to create the appropriate service
export function createGoogleSheetsService(config?: GoogleSheetsConfig): GoogleSheetsService {
  if (!config || !config.endpoint || config.endpoint.includes('mock://')) {
    console.log('[GoogleSheets] Using mock service for development')
    return new MockGoogleSheetsService()
  }
  
  return new GoogleSheetsService(config)
}