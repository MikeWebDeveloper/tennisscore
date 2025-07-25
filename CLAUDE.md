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
- **Internationalization**: next-intl with 8 language support (en, cs, es, fr, de, it, pt, ru)

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

#### Internationalization (i18n)
- **Next-intl System**: Modern i18n built for Next.js 15 App Router
- **8 Supported Languages**: English, Czech, Spanish, French, German, Italian, Portuguese, Russian
- **Namespace Organization**: Translations organized by domain (auth, match, statistics, dashboard, player, common, navigation)
- **Server-Side Rendering**: SEO-optimized with locale-based URLs (`/es/dashboard`, `/fr/matches`)
- **Type Safety**: Full TypeScript support with autocomplete for translation keys
- **Tennis-Specific Formatters**: Specialized utilities for tennis terminology, scores, and statistics
- **Configuration**: Located in `src/i18n/` with locale files in `src/i18n/locales/`

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
├── i18n/                  # Internationalization system
│   ├── config.ts          # next-intl configuration
│   ├── navigation.ts      # Internationalized routing
│   ├── request.ts         # Server-side locale detection
│   ├── utils.ts           # Tennis-specific formatters
│   └── locales/           # Translation files (en, cs, es, fr, de, it, pt, ru)
│       ├── en/            # English translations
│       ├── cs/            # Czech translations
│       └── [other]/       # Additional language directories
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

#### Multilingual Development (CRITICAL)
**🚨 ABSOLUTE RULE: NO HARDCODED ENGLISH STRINGS ALLOWED 🚨**

All user-facing text MUST use the internationalization system. This is a fundamental requirement for this application.

**Mandatory Practices:**
- **Import translations**: Always use `import { useTranslations } from '@/i18n'`
- **Use proper namespaces**: Choose appropriate namespace (auth, match, statistics, dashboard, player, common, navigation)
- **Add translation keys**: All new text must be added to translation files in ALL supported languages
- **Test in multiple languages**: Verify components work in English, Czech, and other supported languages

**Supported Languages (8 total):**
- English (en) - Primary language
- Czech (cs) - Secondary language  
- Spanish (es) - European and Latin American markets
- French (fr) - France and French-speaking countries
- German (de) - Germany, Austria, Switzerland
- Italian (it) - Italy
- Portuguese (pt) - Brazil and Portugal
- Russian (ru) - Russia and Eastern Europe

**Component Usage Patterns:**
```tsx
// ✅ CORRECT - Using translation system
import { useTranslations } from '@/i18n'

export function MyComponent() {
  const t = useTranslations('match') // Use appropriate namespace
  
  return (
    <div>
      <h1>{t('liveScoring')}</h1>
      <button>{t('common.save')}</button>
    </div>
  )
}

// ❌ INCORRECT - Hardcoded English
export function MyComponent() {
  return (
    <div>
      <h1>Live Scoring</h1>  {/* NEVER DO THIS */}
      <button>Save</button>   {/* NEVER DO THIS */}
    </div>
  )
}
```

**Namespace Guidelines:**
- `auth` - Authentication, login, signup, errors
- `match` - Match creation, live scoring, match details, tennis terminology
- `statistics` - Performance analytics, charts, data visualization
- `dashboard` - Main dashboard, overview, performance summaries
- `player` - Player management, profiles, player-related actions
- `common` - Shared UI elements (buttons, labels, states, actions)
- `navigation` - Menu items, page titles, routing

**Tennis-Specific Considerations:**
- Use proper tennis terminology for each language
- Leverage tennis formatters from `src/i18n/utils.ts` for scores, durations, statistics
- Consider cultural differences in tennis terminology (e.g., "deuce" vs "iguales")
- Maintain consistency with international tennis standards

**Error Handling & Validation:**
- All form validation messages must be translated
- Error messages in Server Actions must use translation keys
- Toast notifications must use the translation system
- Loading states and empty states must be translated

**Adding New Translations:**
1. **Add keys to English file first**: `src/i18n/locales/en/[namespace].json`
2. **Translate to all other languages**: Maintain consistency across all 8 languages
3. **Use descriptive key names**: `statisticsNeedMainPlayer` not `stats1`
4. **Group related keys**: Organize by feature/component
5. **Test in all languages**: Verify UI works correctly with different text lengths

**Testing Requirements:**
- Every new component must be tested with multiple languages
- Check text overflow/truncation with longer translations (German, French)
- Verify right-to-left layout if adding RTL languages
- Test date/number formatting across different locales

**Development Workflow:**
1. **Design component** with translations in mind
2. **Import translation hook** with appropriate namespace
3. **Add translation keys** to ALL language files
4. **Use translation keys** in component
5. **Test in multiple languages** during development
6. **Build and verify** no hardcoded strings remain

**Enforcement:**
- Build process should fail if hardcoded strings are detected
- Code reviews must verify translation usage
- All UI text must be translatable
- No exceptions for "temporary" or "internal" text

This is not optional - multilingual support is a core feature of this application.

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