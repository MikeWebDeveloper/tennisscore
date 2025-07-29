# Comprehensive Czech Localization Analysis Report

## Executive Summary
This report provides a comprehensive analysis of localization issues in the TennisScore Next.js application, focusing on:
1. Current i18n implementation status
2. Hardcoded English text locations
3. Missing Czech translations
4. Recommended improvements

## 1. Current i18n Implementation Analysis

### Structure Overview
- **Framework**: next-intl with App Router support
- **Languages**: 8 supported (en, cs, es, fr, de, it, pt, ru)
- **Location**: `/src/i18n/`
- **Namespaces**: auth, common, dashboard, match, navigation, player, statistics

### Current File Organization
```
src/i18n/
├── config.ts           # next-intl configuration
├── index.ts            # Main export file
├── navigation.ts       # Internationalized routing
├── request.ts          # Server-side locale handling
├── utils.ts            # Tennis-specific formatters
├── client-hooks.ts     # Client-side hooks
├── example-usage.tsx   # Usage examples
└── locales/
    ├── en/
    │   ├── auth.json
    │   ├── common.json
    │   ├── dashboard.json
    │   ├── match.json
    │   ├── navigation.json
    │   ├── player.json
    │   └── statistics.json
    ├── cs/             # Czech translations
    └── [other langs]/  # Other language directories
```

## 2. Hardcoded English Text Locations

### Critical Areas with Hardcoded Text

#### A. Component Files to Check
1. **Match Components** (`/src/app/(app)/matches/`)
   - Live scoring interface
   - Match creation forms
   - Match history lists
   - Statistics displays

2. **Player Components** (`/src/app/(app)/players/`)
   - Player creation/edit forms
   - Player profiles
   - Player selection dialogs

3. **Dashboard Components** (`/src/app/(app)/dashboard/`)
   - Bento grid cards
   - Statistics widgets
   - Performance summaries

4. **Statistics Components** (`/src/app/(app)/statistics/`)
   - Chart labels and legends
   - Filter options
   - Data table headers
   - Analytics descriptions

5. **Shared Components** (`/src/components/`)
   - UI components with default labels
   - Error boundaries
   - Loading states
   - Empty states
   - Toast notifications

#### B. Common Patterns of Hardcoded Text
- Button labels: "Save", "Cancel", "Submit", "Delete", "Edit"
- Form placeholders: "Enter name", "Select player", "Choose date"
- Error messages: "Something went wrong", "Please try again"
- Success messages: "Saved successfully", "Updated"
- Loading states: "Loading...", "Please wait"
- Empty states: "No data", "No matches found"
- Validation messages: "Required field", "Invalid format"

## 3. Specific Files Requiring Attention

### High Priority Files (Most User-Facing)
1. `/src/app/(app)/matches/paginated-matches-client.tsx` - Modified file
2. `/src/app/(app)/statistics/_components/match-patterns.tsx` - Modified file
3. `/src/app/(app)/statistics/_components/performance-trends.tsx` - Modified file
4. `/src/app/(app)/statistics/_components/statistics-filters.tsx` - Modified file
5. All components in `/src/components/features/`
6. All components in `/src/components/ui/` that have text

### Server Actions & Error Handling
- `/src/lib/actions/` - Check all error messages
- Form validation messages in Zod schemas
- API error responses

## 4. Missing Translation Keys

### Common Namespace Gaps
```json
{
  "common": {
    // UI Actions
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "update": "Update",
    "submit": "Submit",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "close": "Close",
    "confirm": "Confirm",
    
    // States
    "loading": "Loading...",
    "saving": "Saving...",
    "deleting": "Deleting...",
    "updating": "Updating...",
    "noData": "No data available",
    "error": "Error",
    "success": "Success",
    
    // Messages
    "saveSuccess": "Saved successfully",
    "updateSuccess": "Updated successfully",
    "deleteSuccess": "Deleted successfully",
    "errorGeneric": "Something went wrong",
    "tryAgain": "Please try again",
    
    // Validation
    "required": "This field is required",
    "invalidFormat": "Invalid format",
    "minLength": "Minimum {{count}} characters",
    "maxLength": "Maximum {{count}} characters"
  }
}
```

### Tennis-Specific Terms
```json
{
  "match": {
    // Scoring
    "ace": "Ace",
    "doubleFault": "Double Fault",
    "breakPoint": "Break Point",
    "matchPoint": "Match Point",
    "deuce": "Deuce",
    "advantage": "Advantage",
    "tiebreak": "Tiebreak",
    
    // Shot Types
    "forehand": "Forehand",
    "backhand": "Backhand",
    "serve": "Serve",
    "volley": "Volley",
    "smash": "Smash",
    "dropShot": "Drop Shot",
    
    // Match Info
    "duration": "Duration",
    "surface": "Surface",
    "matchFormat": "Match Format",
    "bestOf": "Best of {{sets}}",
    "sets": "Sets",
    "games": "Games",
    "points": "Points"
  }
}
```

## 5. Recommended i18n Structure

### Improved Namespace Organization
```
src/i18n/
├── config.ts
├── index.ts
├── navigation.ts
├── request.ts
├── utils/
│   ├── formatters.ts      # Tennis-specific formatters
│   ├── plurals.ts         # Pluralization rules
│   └── dates.ts           # Date formatting
└── messages/
    ├── en/
    │   ├── common.json     # Shared UI elements
    │   ├── auth.json       # Authentication
    │   ├── match/
    │   │   ├── scoring.json     # Live scoring
    │   │   ├── creation.json    # Match creation
    │   │   └── statistics.json  # Match stats
    │   ├── player.json
    │   ├── dashboard.json
    │   └── errors.json    # All error messages
    ├── cs/
    └── [other langs]/
```

### Namespace Guidelines
1. **common**: Shared UI elements, buttons, states
2. **auth**: Login, signup, password reset
3. **match**: All match-related features
   - match.scoring: Live scoring interface
   - match.creation: Match setup
   - match.history: Match lists
4. **player**: Player management
5. **dashboard**: Dashboard widgets
6. **statistics**: Analytics and charts
7. **errors**: Centralized error messages
8. **validation**: Form validation messages

## 6. Implementation Checklist

### Phase 1: Foundation (Priority 1)
- [ ] Audit all components for hardcoded text
- [ ] Create comprehensive translation key list
- [ ] Update common.json with missing UI elements
- [ ] Add validation message keys
- [ ] Update error message handling

### Phase 2: Component Updates (Priority 2)
- [ ] Update all button components
- [ ] Fix form placeholders and labels
- [ ] Update loading and empty states
- [ ] Fix toast notifications
- [ ] Update modal dialogs

### Phase 3: Feature-Specific (Priority 3)
- [ ] Tennis terminology translations
- [ ] Statistics labels and descriptions
- [ ] Chart translations
- [ ] Help text and tooltips

### Phase 4: Quality Assurance
- [ ] Test all pages in Czech
- [ ] Verify text overflow handling
- [ ] Check date/time formatting
- [ ] Validate number formatting
- [ ] Review error scenarios

## 7. Code Search Strategy

### Search Patterns for Hardcoded Text
1. String literals in JSX: `>"[A-Z][a-z]+`
2. Button text: `<Button.*>.*[A-Z]`
3. Placeholder text: `placeholder="[^"]+"`
4. Error messages: `error.*"[^"]+"`
5. Toast calls: `toast\.(success|error|info)\("[^"]+"`

### Files to Exclude from Search
- Translation files (`*.json` in locales/)
- Configuration files
- Type definitions
- Test files

## 8. Next Steps

1. **Immediate Actions**
   - Run comprehensive search for hardcoded strings
   - Create missing translation keys in all languages
   - Update components with highest user visibility

2. **Short-term Goals**
   - Implement consistent error handling with i18n
   - Add missing Czech translations
   - Test critical user flows in Czech

3. **Long-term Improvements**
   - Consider translation management system
   - Add translation linting rules
   - Create translation key generator tool
   - Document translation guidelines

## 9. Estimated Effort

- **Audit & Discovery**: 2-3 hours
- **Key Creation**: 3-4 hours
- **Component Updates**: 8-10 hours
- **Testing & Validation**: 2-3 hours
- **Total Estimate**: 15-20 hours

This analysis provides a roadmap for completely eliminating hardcoded English text and ensuring proper Czech localization throughout the application.