# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL WORKFLOW REQUIREMENTS

### 🔴 TEST BRANCH MANDATE
**ALL changes must be made on `test` branch. NEVER work directly on `main`.**
- User will manually merge `test` → `main` after thorough testing
- Always confirm current branch: `git branch --show-current`
- If not on `test` branch, switch immediately: `git checkout test`

### Priority Workflow
1. **ALWAYS read CLAUDE.md first** after each user prompt
2. **CONFIRM on test branch** before any changes
3. **Use Context7 BEFORE** writing any framework code
4. **Launch parallel agents** for research tasks (3-5 minimum)
5. **Run type-check and lint** after EVERY code change
6. **NEVER create files** unless absolutely necessary

### ULTRATHINK Activation Scenarios
Use ULTRATHINK for complex situations:
- **Tennis Scoring Edge Cases**: Complex tiebreak scenarios, super tiebreaks, match format transitions
- **Debugging Complex Issues**: After 3+ failed attempts, corrupted match data, real-time sync issues
- **State Management Migrations**: Refactoring Zustand stores, adding new slices, complex state flows
- **i18n Expansion**: Adding new languages beyond en/cs, complex translation patterns
- **Architecture Decisions**: Major refactoring, real-time features with Appwrite

## 🛠️ MCP SERVER USAGE PATTERNS

### Context7 (MANDATORY before new code)
**When to use:**
- Before implementing ANY Next.js 15 patterns or features
- Before using Appwrite SDK methods
- Before adding shadcn/ui components
- Before implementing Zustand patterns
- Before adding next-intl features

**Example usage:**
```
1. User asks to add new feature
2. FIRST: Use Context7 to get latest Next.js 15 App Router patterns
3. THEN: Research Appwrite real-time subscriptions
4. FINALLY: Implement with correct patterns
```

### GitHub MCP
**Primary uses:**
- Find similar tennis scoring implementations
- Research TanStack Query patterns with real-time sync
- Research Czech tennis integration patterns
- Review uPlot chart implementations
- Find PWA offline scoring patterns
- Check soft delete system implementations

**Search queries:**
- `tennis score real-time tanstack query`
- `uplot charts react tennis sports`
- `soft delete system 7 day retention`
- `pwa offline sports scoring`
- `czech tennis player search diacritics`
- `next.js 15 app router optimistic updates`

### Playwright MCP
**Testing scenarios:**
- Live scoring interface with optimistic updates
- Czech tennis player search and import flow
- Soft delete and restoration workflow
- PWA installation and offline functionality
- Multi-language UI verification (en/cs)
- TanStack Query cache invalidation testing
- Performance monitoring and bundle analysis
- uPlot chart rendering and interactions

### Memory MCP
**Store permanently:**
- Czech tennis player search patterns and common queries
- TanStack Query optimization strategies
- Soft delete implementation patterns
- PWA offline scoring techniques
- Performance optimization discoveries
- uPlot chart configuration examples
- Bundle size optimization techniques
- Testing credentials and scenarios

### WebSearch
**Current information needs:**
- Latest Next.js 15 updates and breaking changes
- Current Appwrite features and limitations
- Tennis rule clarifications (ITF, ATP, WTA)
- Real-time sync patterns for mobile Safari
- Performance optimization techniques 2025
- PWA best practices

## 🤖 AGENT ORCHESTRATION PATTERNS

### For New Features
```
1. Launch 3-5 research-analyst agents in PARALLEL:
   - Agent 1: Research similar implementations
   - Agent 2: Find best practices
   - Agent 3: Check existing patterns in codebase
   - Agent 4: Look for potential issues
   - Agent 5: Find testing strategies
2. Use code-architect for system design
3. Use code-executor for implementation
4. Use test-guardian for validation
```

### For Debugging
```
1. Use parallel-explorer for rapid codebase search
2. Launch multiple research-analyst agents:
   - Error pattern identification
   - Solution research from GitHub/WebSearch
   - Related issue investigation
   - Stack trace analysis
```

### Specialized Agent Assignment
- **Real-time Features**: `devops-engineer` for WebSocket configuration
- **UI Components**: `frontend-ui-specialist` for responsive design
- **Database Operations**: `backend-database-engineer` for Appwrite queries
- **Performance**: `code-architect` for optimization strategies
- **Testing**: `test-guardian` for test implementation
- **Research**: `research-analyst` for documentation and examples

## 📋 ENHANCED WORKFLOW

### Standard Development Flow
```bash
1. Read CLAUDE.md (mandatory)
2. Check Context7 for framework docs
3. TodoWrite for tasks (3+ steps)
4. Launch parallel research agents
5. Implement with existing patterns
6. Run typecheck/lint after changes
7. Test in en/cs locales
8. Mark tasks complete when verified
```

### Complex Feature Implementation
```bash
1. ULTRATHINK for architecture
2. 5 parallel research agents
3. code-architect for design
4. TodoWrite detailed subtasks
5. code-executor for build
6. test-guardian for validation
7. Playwright for E2E tests
```

## 🎾 TENNIS DOMAIN EXPERTISE

### Core Scoring Logic
Located in: `src/lib/utils/tennis-scoring.ts`

#### Critical Implementation Details
- **Tiebreak Serving Rotation**: Server changes every 2 points, starting with original server
- **Super Tiebreak (10 points)**: First to 10, win by 2, used in final sets
- **No-Ad Scoring**: Deuce becomes sudden death point
- **Match Suspension**: Preserve complete state including server, score, point logs
- **Set Formats**: Best of 3 or 5, with different final set rules

#### Pressure & Momentum Analysis
```typescript
// Key metrics tracked:
- Break points (serving to stay in set/match)
- Game points (crucial service holds)
- Set points (momentum shifts)
- Match points (ultimate pressure)
- Comeback detection (deficit recovery)
- Streak analysis (consecutive points/games won)
```

#### Edge Cases to Handle
- Tiebreak at 6-6 (standard) or 12-12 (final set)
- Server rotation in super tiebreak
- No-ad deuce point importance
- Retirement/walkover during match
- Live score corrections
- Match format changes mid-tournament

## 🏗️ ARCHITECTURE OVERVIEW

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **UI**: shadcn/ui components (Radix UI primitives)
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Appwrite (auth, database, storage, real-time)
- **State**: Zustand stores with TypeScript
- **Data Fetching**: TanStack Query v5 with optimistic updates
- **Animation**: Framer Motion with LazyMotion (90% bundle reduction)
- **Charts**: uPlot for statistics (performance optimized, migrated from Recharts)
- **i18n**: next-intl (currently en, cs - planned for 8 languages)
- **PWA**: Service Worker v2.1.0 with IndexedDB for offline support

### Project Structure
```
src/
├── app/[locale]/           # Internationalized routes
│   ├── (auth)/            # Public auth pages
│   ├── (app)/             # Protected app pages
│   │   ├── dashboard/     # Bento grid overview
│   │   ├── matches/       # Match management
│   │   ├── players/       # Player profiles
│   │   └── statistics/    # Analytics views
│   └── live/[matchId]/    # Public match sharing
├── components/
│   ├── ui/                # shadcn/ui components
│   │   └── charts/       # uPlot chart components
│   ├── features/          # Domain components
│   └── shared/            # Reusable components
├── data/                  # Czech tennis player data (1,382 players)
├── hooks/
│   ├── use-optimistic-scoring.ts   # Sub-100ms UI updates
│   ├── use-concurrent-scoring.ts   # React 18 concurrent features
│   └── use-performance-realtime.ts # WebSocket + polling fallback
├── i18n/
│   ├── locales/           # Translation files (9 namespaces)
│   │   ├── en/           # English (complete)
│   │   └── cs/           # Czech (complete)
│   └── config.ts         # i18n configuration
├── lib/
│   ├── actions/          # Server Actions
│   ├── schemas/          # Zod validation
│   ├── tanstack-query/   # TanStack Query v5 implementation
│   │   ├── queries/      # Query hooks
│   │   ├── mutations/    # Mutation hooks
│   │   └── client.ts     # QueryClient configuration
│   ├── utils/            # Tennis scoring, stats
│   │   ├── chunked-player-search.ts  # Czech tennis search
│   │   ├── bundle-optimization.ts    # Dynamic imports
│   │   └── indexeddb-storage.ts      # Offline storage
│   └── appwrite-*.ts     # Client configurations
└── stores/               # Zustand state
    ├── matchStore.ts     # Match state & scoring
    └── userStore.ts      # User preferences
```

## 🌍 INTERNATIONALIZATION (CRITICAL)

### 🚨 ABSOLUTE RULE: NO HARDCODED STRINGS
Every user-facing text MUST use the translation system. No exceptions.

### Supported Languages
Currently implemented:
- **en** - English (primary)
- **cs** - Czech (secondary)

Planned (translations needed):
- **es** - Spanish
- **fr** - French  
- **de** - German
- **it** - Italian
- **pt** - Portuguese
- **ru** - Russian

### Implementation Pattern
```tsx
// ✅ CORRECT
import { useTranslations } from '@/i18n'

export function Component() {
  const t = useTranslations('match')
  return <h1>{t('liveScoring')}</h1>
}

// ❌ NEVER DO THIS
export function Component() {
  return <h1>Live Scoring</h1>  // FORBIDDEN
}
```

### Translation Namespaces (9 total)
- `admin` - Admin panel functionality  
- `auth` - Authentication flows
- `common` - Shared UI elements
- `dashboard` - Main overview
- `match` - Match creation, scoring
- `navigation` - Menu, routing
- `player` - Player management
- `settings` - User settings
- `statistics` - Analytics, charts

## 🚀 PERFORMANCE OPTIMIZATIONS

### Bundle Size Achievement
**Major Success**: Bundle size reduced from **869KB to 692KB** (20% reduction)

### Key Performance Improvements
- **LazyMotion with Framer Motion**: ~90% reduction in motion library bundle size
- **uPlot Migration**: Replaced Recharts with performance-optimized uPlot charts
- **Advanced Code Splitting**: 30+ async chunks with priority-based loading
- **Dynamic Imports**: Comprehensive lazy loading for major components
- **Image Optimization**: AVIF/WebP with 1-year caching, modern format support
- **Font Optimization**: Variable fonts with display=swap strategy

### Performance Monitoring
- **Real-time Metrics**: Sub-100ms UI response targets for scoring
- **Web Vitals Tracking**: Performance monitoring hooks and alerting
- **Bundle Analysis**: Dedicated performance analysis scripts
- **Cache Optimization**: Multi-tier caching with intelligent invalidation

### Performance Scripts
```bash
npm run perf:all              # Comprehensive performance analysis
npm run perf:analyze          # Bundle size analysis
npm run perf:lighthouse       # Lighthouse performance testing
npm run lucide:optimize       # Icon optimization
```

## 🇨🇿 CZECH TENNIS INTEGRATION

### Czech Tennis Database
- **1,382 Players**: Complete Czech Tennis Association player database
- **Data Source**: `czech-tennis-full-data.csv` with official rankings
- **Chunked Loading**: Performance-optimized search with 4 chunks (a-d, e-k, l-r, s-z)
- **Offline Support**: Works with cached data when offline

### Player Data Structure
```typescript
interface CzechTennisPlayer {
  czRanking: number        // Czech ranking (1-1500)
  lastName: string         // Player's last name
  firstName: string        // Player's first name
  yearOfBirth: number     // Birth year
  club: string            // Tennis club affiliation
  bhRating: string        // BH rating (e.g., "60BH", "45BH")
  cztennisUrl: string     // Link to cztenis.cz profile
  uniqueId: string        // Unique Czech tennis ID
}
```

### Search Features
- **Diacritic-Aware**: Normalizes Czech characters (ř, ň, ž, etc.)
- **Multi-field Search**: Name, club, BH rating, ranking
- **Performance Optimized**: Chunked loading, 50 result limit
- **Visual Integration**: Czech import badges and external links

### Data Processing
```bash
npm run process:czech         # Process Czech tennis data
```

## 🔄 TANSTACK QUERY V5 IMPLEMENTATION

### Comprehensive Query System
- **Tennis-Optimized Configuration**: 5-minute stale time for match data
- **Live Match Updates**: 10-second stale time with 15-second polling
- **Query Key Factory**: Hierarchical structure for efficient cache invalidation
- **Optimistic Updates**: Sub-100ms UI responses with background sync
- **Real-time Integration**: WebSocket + TanStack Query cache synchronization

### Performance Features
- **Concurrent Scoring**: React 18 concurrent features for live scoring
- **Query Analytics**: Enterprise-level monitoring dashboard
- **Intelligent Batching**: Groups similar queries with priority scheduling
- **Query Deduplication**: Prevents redundant identical queries
- **Advanced Caching**: Multi-level with TTL and LRU eviction

### Implementation Status
⚠️ **Critical Note**: TanStack Query hooks are fully implemented but **not yet adopted in components**
- All query/mutation hooks are defined and ready
- Provider is configured in app layout
- Migration from existing Server Action patterns still needed

### Key Hook Examples
```typescript
// Live match with optimistic updates
const { data: match } = useLiveMatchQuery(matchId)
const scoreMutation = useScorePointMutation()

// Czech tennis search
const { data: players } = useCzechTennisSearchQuery(searchTerm)
```

## 🗑️ SOFT DELETE SYSTEM

### 7-Day Retention for Matches
- **Soft Delete Fields**: `isDeleted`, `deletedAt`, `deletedBy` in match schema
- **Restoration Window**: 7-day recovery period with enforcement
- **Undo Toast**: 10-second undo button after deletion
- **Permission Validation**: Only match owner can delete/restore

### Database Schema
```typescript
// Soft delete fields in matches collection
deletedAt?: string    // ISO timestamp when deleted
deletedBy?: string    // User ID who deleted
isDeleted?: boolean   // Quick filter flag
```

### User Experience
- **Confirmation Dialog**: Prevents accidental deletion
- **Success Toast with Undo**: 10-second window for immediate recovery
- **Filtered Queries**: Deleted matches hidden from normal views
- **TanStack Query Integration**: Optimistic updates with cache invalidation

### Current Limitations
⚠️ **Missing Features**:
- No automated cleanup (matches remain in DB forever)
- No "Trash" UI for managing deleted items
- Only applies to matches (not players or other entities)
- No bulk restoration capabilities

### Schema Management
```bash
npm run update:schema         # Update database schema
```

## 📱 PWA ENHANCEMENTS

### Service Worker v2.1.0
- **Multi-tier Caching**: Static, dynamic, and API response caches
- **Background Sync**: Queue offline actions for later sync
- **Route Prefetching**: Automatic prefetching of common routes
- **Offline Fallback**: Custom branded offline page with retry

### Offline Capabilities
- **IndexedDB Storage**: Comprehensive offline data persistence
- **Match Scoring**: Full offline scoring with sync when online
- **Cache Management**: LRU cache with automatic cleanup
- **Network Monitoring**: Real-time connection status

### Installation Experience
- **Smart Install Prompts**: Platform-specific instructions (iOS/Android/Desktop)
- **App Manifest**: Complete with shortcuts and screenshots
- **Icon Strategy**: 8 sizes with maskable support

### Current Status
⚠️ **Missing Components**:
- `use-pwa-install` hook referenced but not implemented
- Push notifications infrastructure ready but not activated
- Background sync actions need full implementation

## 🧪 TESTING STRATEGY

### Current Testing Status
**Jest & Playwright are installed but NOT configured:**
- Jest v29.7.0 and Playwright v1.54.1 are available
- No jest.config.js or playwright.config.js exists
- No test script in package.json
- Only existing test: `src/lib/utils/tennis-scoring.test.ts`

### Available Testing
```bash
# Manual test run (single file)
npx jest src/lib/utils/tennis-scoring.test.ts

# Use Playwright MCP for browser automation
# (Configuration would need to be added first)
```

### Manual Testing Checklist
- [ ] Test in English and Czech
- [ ] Verify mobile view (iPhone Safari)
- [ ] Check real-time updates
- [ ] Test match sharing links
- [ ] Check all match formats

## 🐛 COMMON ISSUES & SOLUTIONS

### Safari WebSocket Limitations
**Issue**: WebSocket connections fail on Vercel preview URLs
**Solution**: Implemented fallback polling mechanism
```typescript
// See: src/hooks/useRealtimeConnection.ts
// Automatic fallback to polling when WebSocket fails
```

### Match Data Corruption
**Issue**: Inconsistent state between score and point logs
**Solution**: Point logs are source of truth
```bash
# Note: These script files don't currently exist
npm run investigate  # Would analyze match (script missing)
npm run fix         # Would fix single match (script missing)
npm run fix:all     # Would fix all matches (script missing)
```

### Real-time Sync Delays
**Issue**: Updates lag on mobile devices
**Solution**: 
- Optimistic UI updates
- Debounced sync for rapid actions
- Connection state monitoring

### Translation Key Mismatches
**Issue**: Missing translations cause crashes
**Solution**: Manual validation required (validation scripts missing)
```bash
# These commands reference non-existent script files:
npm run validate:translations          # Script missing
npm run validate:translations:verbose  # Script missing
```

### Appwrite Connection Issues
**Issue**: Connection drops or rate limits
**Solution**:
- Exponential backoff retry logic
- Connection pooling
- Cached session management

## 🛡️ SECURITY & ENVIRONMENT

### Critical Environment Variables
```env
# Public (client-side)
NEXT_PUBLIC_APPWRITE_ENDPOINT
NEXT_PUBLIC_APPWRITE_PROJECT_ID
NEXT_PUBLIC_APPWRITE_DATABASE_ID

# Private (server-side)
APPWRITE_API_KEY
APPWRITE_USERS_COLLECTION_ID
APPWRITE_PLAYERS_COLLECTION_ID
APPWRITE_MATCHES_COLLECTION_ID
APPWRITE_PROFILE_PICTURES_BUCKET_ID
```

### Security Best Practices
- Never expose API keys in client code
- Use Server Actions for all database operations
- Implement proper session validation
- Sanitize user inputs
- Rate limit API calls
- Use HTTPS only in production

## 📝 DEVELOPMENT COMMANDS

### Setup & Core Commands
```bash
# First time setup
npm install                    # Install dependencies (required first)

# Development commands
npm run dev                    # Start dev server (localhost:3000)
npm run build                  # Production build
npm run start                  # Production server
npm run lint                   # ESLint checks (requires npm install)
npm run type-check            # TypeScript validation (requires npm install)
```

### Appwrite Setup
```bash
npm run setup:appwrite        # Initialize database
```

### Data Management Scripts
**Note: These scripts reference files that don't currently exist**
```bash
# Listed in package.json but script files not found:
npm run investigate           # Analyze match data (script missing)
npm run investigate:quick     # Quick match check (script missing)
npm run investigate:detailed  # Detailed analysis (script missing)
npm run fix                   # Fix corrupted match (script missing)
npm run fix:all              # Fix all matches (script missing)
```

### Performance Analysis Scripts
```bash
npm run perf:all              # Comprehensive performance analysis
npm run perf:analyze          # Bundle size analysis
npm run perf:audit            # Performance auditing
npm run perf:lighthouse       # Lighthouse performance testing
npm run perf:bundle           # Bundle size analysis
npm run lucide:analyze        # Icon analysis
npm run lucide:optimize       # Icon optimization
```

### Czech Tennis Data Processing
```bash
npm run process:czech         # Process Czech tennis data from CSV
```

### Database Schema Management
```bash
npm run update:schema         # Update Appwrite database schema
```

### Translation Validation
```bash
# Also references missing script files:
npm run validate:translations          # Check translations (script missing)
npm run validate:translations:verbose  # Detailed check (script missing)
```

## 🎯 KEY PATTERNS TO FOLLOW

### 1. Server Components First
Use Client Components only when needed (interactivity, browser APIs)

### 2. Server Actions for Data
All database operations through Server Actions with Zod validation

### 3. Optimistic Updates
Update UI immediately, sync in background

### 4. Mobile-First Design
Design for mobile, enhance for desktop

### 5. Progressive Enhancement
Core functionality works without JavaScript

### 6. Error Boundaries
Graceful degradation with user-friendly error messages

### 7. Real-time Resilience
Fallback mechanisms for connection issues

### 8. Type Safety
Strict TypeScript with no `any` types

## 🚀 DEPLOYMENT NOTES

### Vercel Deployment
- Automatic deployments from main branch
- Preview deployments for PRs
- Environment variables in Vercel dashboard
- Edge functions for optimal performance

### Performance Optimizations
- **Bundle Size**: Reduced to 692KB (20% improvement)
- **LazyMotion**: 90% reduction in animation library size
- **uPlot Charts**: Performance-optimized charting (migrated from Recharts)
- **Advanced Code Splitting**: 30+ async chunks with priority loading
- **Dynamic Imports**: Comprehensive lazy loading system
- **Image Optimization**: AVIF/WebP with 1-year caching
- **Font Optimization**: Variable fonts with display=swap
- **Static Generation**: Where possible with ISR for dynamic content

## 📚 ADDITIONAL RESOURCES

### Documentation
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Appwrite Docs](https://appwrite.io/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Zustand](https://zustand-demo.pmnd.rs)
- [next-intl](https://next-intl-docs.vercel.app)

### Tennis Rules
- [ITF Rules](https://www.itftennis.com/en/about-us/governance/rules-and-regulations/)
- [ATP Rulebook](https://www.atptour.com/en/corporate/rulebook)
- [WTA Rules](https://www.wtatennis.com/rules)

## 🚨 CRITICAL IMPLEMENTATION GAPS

### Missing Implementations
1. **TanStack Query Adoption**: Hooks ready but components still use Server Actions
2. **Automated Cleanup**: Soft-deleted matches remain in database forever
3. **PWA Install Hook**: `use-pwa-install.ts` referenced but missing
4. **Push Notifications**: Infrastructure ready but not implemented
5. **Script Files**: Many package.json scripts reference non-existent files
6. **Test Configuration**: Jest/Playwright installed but no config files

### Performance Opportunities
1. **Component Migration**: Move to TanStack Query for better caching
2. **Background Sync**: Complete implementation for offline actions  
3. **Vercel Cron Jobs**: Add automated cleanup for old deleted matches
4. **Push Notifications**: Implement match score update notifications
5. **Bundle Analysis**: Regular monitoring and optimization

## ⚡ QUICK REFERENCE

### When stuck:
1. ULTRATHINK for complex problems (tennis scoring, performance, real-time sync)
2. Launch 5 parallel research agents
3. Check Context7 for TanStack Query/uPlot/Next.js 15 patterns
4. Search GitHub for Czech integration/PWA patterns
5. Use WebSearch for latest performance techniques
6. Ask user for clarification

### Before committing on test branch:
1. **Critical**: Confirm on test branch: `git branch --show-current`
2. **Required**: Run typecheck and lint: `npm run type-check && npm run lint`
3. Test in both languages (en/cs)
4. Test Czech tennis search functionality
5. Verify PWA offline capabilities
6. Check soft delete and restoration flow
7. Verify mobile view and performance
8. Update translations if needed
9. **Never commit to main** - test branch only

### Performance Checklist:
- [ ] Bundle size under 700KB
- [ ] Sub-100ms scoring updates
- [ ] Czech search under 200ms
- [ ] PWA offline functionality working
- [ ] uPlot charts rendering smoothly

---
*Last Updated: 2025-08-30*
*Version: 3.0.0*
*Updated with 44 new commits: Performance (692KB), Czech Tennis (1,382 players), TanStack Query v5, Soft Delete, PWA v2.1.0*
*Optimized for Claude Code with MCP servers*