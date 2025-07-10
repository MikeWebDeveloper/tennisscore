# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks
- `npm run setup:appwrite` - Initialize Appwrite collections and database

### Testing
No specific test command defined in package.json - check for testing setup when implementing new features.

#### Test Credentials
For browser testing and debugging:
- **Email**: michal.latal@yahoo.co.uk
- **Password**: Mikemike88
- **Development URL**: http://localhost:3000 (may vary if other Next.js servers are running)

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **UI**: shadcn/ui components built on Radix UI
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Appwrite (authentication, database, storage, real-time)
- **State Management**: Zustand stores
- **Animation**: Framer Motion
- **Charts**: Recharts

### Key Architectural Patterns

#### Authentication
- Custom JWT session management using `jose` library
- Dual Appwrite client setup: admin client (server-side) and session client (user-scoped)
- Route protection via middleware in `src/middleware.ts`
- Auth functions in `src/lib/auth.ts`

#### Data Layer
- Server Actions pattern for all database operations (`src/lib/actions/`)
- Zod schemas for validation (`src/lib/schemas/`)
- Appwrite collections: Players, Matches, Users
- Real-time updates via Appwrite Realtime with extensive Safari mobile handling

#### State Management
- **User Store**: Persisted user preferences and main player selection
- **Match Store**: Complex tennis scoring state with real-time sync
- **Locale Store**: Internationalization state
- Located in `src/stores/`

#### Tennis Domain Logic
- Comprehensive scoring engine in `src/lib/utils/tennis-scoring.ts`
- Point-by-point tracking with contextual information
- Support for different match formats (3/5 sets, no-ad, super tiebreaks)
- Match statistics calculations in `src/lib/utils/match-stats.ts`

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login/signup pages
│   ├── (app)/             # Protected app pages
│   │   ├── dashboard/     # Main dashboard with Bento Grid
│   │   ├── matches/       # Match management and live scoring
│   │   └── players/       # Player management
│   └── live/[matchId]/    # Public live match sharing
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── features/          # Domain-specific components
│   └── shared/            # Reusable components
├── lib/
│   ├── actions/           # Server Actions for DB operations
│   ├── schemas/           # Zod validation schemas
│   ├── utils/             # Utilities including tennis scoring
│   ├── appwrite-*.ts      # Appwrite client configurations
│   └── auth.ts            # Authentication utilities
├── stores/                # Zustand state management
└── hooks/                 # Custom React hooks
```

### Design System
- **Colors**: Dark mode first with Electric Green (#39FF14) primary
- **Typography**: Satoshi (headings), Inter (body), JetBrains Mono (scores)
- **Spacing**: 8px grid system
- **Mobile-first**: Responsive design with bottom tab navigation on mobile

### Environment Variables
Critical environment variables required:
- `NEXT_PUBLIC_APPWRITE_*` - Public Appwrite configuration
- `APPWRITE_API_KEY` - Server-side API key
- `APPWRITE_*_COLLECTION_ID` - Database collection IDs
- `APPWRITE_PROFILE_PICTURES_BUCKET_ID` - Storage bucket for profile images

### Development Guidelines

#### Code Patterns
- Use TypeScript for all new code
- Follow existing component patterns with shadcn/ui
- Prefer Server Components; use Client Components only when needed
- Use Server Actions for database operations
- Follow mobile-first responsive design

#### Tennis Scoring
- All scoring logic should use the centralized tennis-scoring utils
- Point logs are the source of truth for match state
- Support for different match formats is built-in
- Real-time updates must handle mobile browser limitations

#### Error Handling
- Comprehensive retry logic with exponential backoff
- React error boundaries for graceful degradation
- Network resilience patterns for offline scenarios

#### Real-time Features
- Appwrite Realtime for live match updates
- Fallback polling for environments with WebSocket issues
- Proper connection management and reconnection logic

## Important Notes

### Mobile Safari Handling
The codebase includes extensive handling for Safari mobile WebSocket limitations, particularly on Vercel preview URLs. This is implemented in the real-time hooks and connection management.

### PWA Support
The application is configured as a Progressive Web App with service worker support for offline functionality.

### Cursor AI Rules
The project includes comprehensive Cursor AI rules in `.cursor/rules/gpt-4.1-best-practices.mdc` that emphasize functional programming patterns, proper TypeScript usage, and following existing project conventions.