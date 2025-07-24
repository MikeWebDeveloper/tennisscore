# Tournament System Design

## Overview

The tournament system extends the existing tennis scoring application with tournament management capabilities. It integrates with external data sources (Google Sheets), manages bracket screenshots, and creates tournament matches that utilize the existing match scoring infrastructure. The system supports both singles and doubles formats with up to 64 participants per tournament.

## Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend UI   │◄──►│  Tournament API  │◄──►│ External APIs   │
│  Tournament     │    │    Layer         │    │ Google Sheets   │
│  Management     │    │                  │    │ Integration     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌──────────────────┐            │
         └─────────────►│  Database Layer  │◄───────────┘
                        │  Tournament      │
                        │  Collections     │
                        └──────────────────┘
                                 │
                        ┌──────────────────┐
                        │ Existing Match   │
                        │ Scoring System   │
                        └──────────────────┘
```

### Integration Points
- **Database**: New Appwrite collections alongside existing structure
- **File Storage**: Appwrite storage bucket for bracket screenshots
- **Match System**: Tournament matches use existing match scoring infrastructure
- **External APIs**: Google Sheets integration for player data

## Components and Interfaces

### Frontend Components
1. **TournamentList** (`/tournaments`)
   - Display all tournaments with status indicators
   - Create new tournament button
   - Filter by status (upcoming, active, completed)

2. **TournamentForm** (`/tournaments/create`)
   - Tournament name and basic details
   - Format selection (singles/doubles)
   - Player capacity (max 64)
   - Date picker

3. **PlayerSelection** (`/tournaments/[id]/players`)
   - Google Sheets player data import
   - Player search and filtering
   - Selected players management
   - Capacity validation

4. **BracketUpload** (`/tournaments/[id]/bracket`)
   - File upload component for bracket images
   - Image preview functionality
   - File validation and storage

5. **MatchBuilder** (`/tournaments/[id]/matches`)
   - Display uploaded bracket screenshot
   - Manual match creation interface
   - Player pairing selection
   - Match validation

6. **TournamentDashboard** (`/tournaments/[id]`)
   - Tournament overview and status
   - Match list with status indicators
   - Quick access to scoring interface
   - Tournament statistics

### Backend API Endpoints
```typescript
// Tournament CRUD
POST   /api/tournaments              // Create tournament
GET    /api/tournaments              // List tournaments
GET    /api/tournaments/[id]         // Get tournament details
PUT    /api/tournaments/[id]         // Update tournament
DELETE /api/tournaments/[id]         // Delete tournament

// Player Integration
GET    /api/tournaments/players      // Fetch Google Sheets players
POST   /api/tournaments/[id]/players // Add players to tournament

// Bracket Management
POST   /api/tournaments/[id]/bracket // Upload bracket screenshot
GET    /api/tournaments/[id]/bracket // Get bracket image

// Match Management
POST   /api/tournaments/[id]/matches // Create tournament matches
GET    /api/tournaments/[id]/matches // Get tournament matches
```

### External Service Integration
```typescript
// Google Sheets Service
interface GoogleSheetsService {
  fetchPlayers(): Promise<TournamentPlayer[]>
  validateConnection(): Promise<boolean>
}

// File Storage Service
interface FileStorageService {
  uploadBracket(file: File, tournamentId: string): Promise<string>
  getBracketUrl(tournamentId: string): Promise<string>
}
```

## Data Models

### Tournament Collection
```typescript
interface Tournament {
  $id: string
  $createdAt: string
  $updatedAt: string
  name: string
  description?: string
  format: 'singles' | 'doubles'
  maxParticipants: number
  tournamentDate: string
  status: 'draft' | 'active' | 'completed'
  bracketImageId?: string
  organizerId: string
  participants: string[] // Player IDs
  configuration: {
    googleSheetsEndpoint?: string
    // Extensible for future configurations
  }
}
```

### Tournament Player (External Data)
```typescript
interface TournamentPlayer {
  id: string
  name: string
  surname: string
  yearOfBirth: number
  ranking?: number
  // Additional fields from Google Sheets
}
```

### Tournament Match (extends existing Match)
```typescript
interface TournamentMatch extends Match {
  tournamentId: string
  round: string
  bracketPosition: number
  nextMatchId?: string // For tournament progression
}
```

### Tournament Configuration
```typescript
interface TournamentConfig {
  googleSheets: {
    endpoint: string
    apiKey?: string
    sheetId?: string
  }
  storage: {
    bucketId: string
    maxFileSize: number
  }
}
```

## Error Handling

### API Error Responses
```typescript
interface TournamentError {
  code: string
  message: string
  details?: Record<string, any>
}

// Error Types
- TOURNAMENT_NOT_FOUND
- INVALID_TOURNAMENT_FORMAT
- PLAYER_CAPACITY_EXCEEDED
- BRACKET_UPLOAD_FAILED
- GOOGLE_SHEETS_CONNECTION_ERROR
- MATCH_CREATION_FAILED
```

### Frontend Error Handling
- Toast notifications for user-facing errors
- Retry mechanisms for network failures
- Graceful degradation for external service failures
- Form validation with clear error messages

### Data Consistency
- Tournament state validation before match creation
- Player capacity enforcement
- Duplicate match prevention
- Transaction-based operations for critical updates

## Testing Strategy

### Unit Testing
```typescript
// Core Tournament Logic
- Tournament creation validation
- Player selection logic
- Match generation algorithms
- Status transition validation

// External Service Integration
- Google Sheets API mocking
- File upload simulation
- Error response handling
```

### Integration Testing
```typescript
// API Endpoint Testing
- Tournament CRUD operations
- Player data fetching
- Bracket upload workflow
- Match creation process

// Database Integration
- Tournament collection operations
- Match linking verification
- Data consistency checks
```

### End-to-End Testing
```typescript
// Complete Tournament Workflow
- Create tournament → Add players → Upload bracket → Create matches
- Tournament match scoring integration
- Tournament completion workflow
```

### Performance Testing
- Google Sheets API response times
- File upload performance (up to 10MB)
- Tournament list rendering with large datasets
- Concurrent tournament management