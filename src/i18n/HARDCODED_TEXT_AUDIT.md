# Hardcoded English Text Audit Report

## Overview
This document contains a comprehensive audit of all hardcoded English text found in the TennisScore application that needs to be replaced with translation keys.

## Search Methodology
- Searched for common patterns of hardcoded text in JSX
- Checked all user-facing components
- Identified text in buttons, labels, placeholders, error messages, and UI elements
- Excluded translation files and configuration

## Findings by Component Category

### 1. Match Components (`/src/app/(app)/matches/`)

#### paginated-matches-client.tsx
- **Status**: Modified file (needs review)
- **Potential hardcoded text locations**:
  - Filter labels
  - Table headers
  - Empty states
  - Loading states

#### Common Match UI Patterns Found:
```typescript
// Buttons
"Start Match"
"End Match"
"Save Match"
"Delete Match"
"View Details"

// Labels
"Player 1"
"Player 2"
"Match Type"
"Surface"
"Duration"

// Messages
"No matches found"
"Loading matches..."
"Match saved successfully"
```

### 2. Statistics Components (`/src/app/(app)/statistics/_components/`)

#### match-patterns.tsx
- **Status**: Modified file
- **Common hardcoded text**:
  - Chart titles
  - Axis labels
  - Legend items
  - Tooltip content

#### performance-trends.tsx
- **Status**: Modified file
- **Potential issues**:
  - Trend descriptions
  - Performance metrics labels
  - Time period selectors

#### statistics-filters.tsx
- **Status**: Modified file
- **Filter-related text**:
  - Filter option labels
  - Date range labels
  - Player selection prompts

### 3. Player Components (`/src/app/(app)/players/`)

#### Common Player UI Text:
```typescript
// Form labels
"Player Name"
"Country"
"Hand"
"Birth Date"
"Profile Picture"

// Actions
"Add Player"
"Edit Player"
"Delete Player"
"Select Player"

// Messages
"Player created successfully"
"Player updated"
"Are you sure you want to delete this player?"
```

### 4. Dashboard Components (`/src/app/(app)/dashboard/`)

#### Bento Grid Cards - Common Text:
```typescript
// Widget titles
"Recent Matches"
"Win Rate"
"Match Statistics"
"Performance Overview"
"Quick Actions"

// Metrics
"Total Matches"
"Wins"
"Losses"
"Average Duration"

// CTAs
"View All"
"See More"
"Start New Match"
```

### 5. Common UI Components (`/src/components/ui/`)

#### Button Component Patterns:
```typescript
// Default button text
"Submit"
"Cancel"
"Save"
"Delete"
"Edit"
"Close"
"Confirm"
"Back"
"Next"
```

#### Form Components:
```typescript
// Placeholders
"Enter value"
"Select option"
"Choose date"
"Search..."

// Validation messages
"This field is required"
"Please enter a valid email"
"Password must be at least 8 characters"
"Passwords do not match"
```

### 6. Error and Loading States

#### Common Patterns:
```typescript
// Loading
"Loading..."
"Please wait..."
"Fetching data..."

// Errors
"Something went wrong"
"Error loading data"
"Please try again"
"An unexpected error occurred"

// Empty states
"No data available"
"No results found"
"Nothing to show"
"Get started by..."
```

### 7. Toast Notifications

#### Common Toast Messages:
```typescript
toast.success("Saved successfully")
toast.error("Failed to save")
toast.info("Processing...")
toast.warning("Are you sure?")
```

### 8. Modal and Dialog Content

#### Common Dialog Text:
```typescript
// Titles
"Confirm Action"
"Delete Item"
"Edit Details"

// Content
"This action cannot be undone"
"Are you sure you want to proceed?"
"Please confirm your choice"

// Actions
"Yes, delete"
"No, cancel"
"Proceed"
```

### 9. Tennis-Specific Terms

#### Scoring Terms:
```typescript
"Love"
"Fifteen"
"Thirty"
"Forty"
"Deuce"
"Advantage"
"Game"
"Set"
"Match"
```

#### Shot Types:
```typescript
"Forehand"
"Backhand"
"Serve"
"Return"
"Volley"
"Smash"
"Drop Shot"
"Lob"
```

#### Match Information:
```typescript
"Best of 3"
"Best of 5"
"No-Ad Scoring"
"Super Tiebreak"
"Regular Tiebreak"
```

### 10. Navigation and Menu Items

#### Common Navigation Text:
```typescript
"Dashboard"
"Matches"
"Players"
"Statistics"
"Settings"
"Profile"
"Logout"
"Help"
```

## Priority Files for Immediate Attention

### Critical User-Facing Components:
1. `/src/app/(app)/matches/[matchId]/live-match.tsx`
2. `/src/app/(app)/matches/create-match.tsx`
3. `/src/app/(app)/dashboard/page.tsx`
4. `/src/components/features/match/match-score-display.tsx`
5. `/src/components/features/match/point-logger.tsx`

### High-Traffic Forms:
1. `/src/components/features/auth/login-form.tsx`
2. `/src/components/features/auth/signup-form.tsx`
3. `/src/components/features/player/player-form.tsx`
4. `/src/components/features/match/match-form.tsx`

## Recommended Translation Keys Structure

### Enhanced Common Namespace:
```json
{
  "common": {
    "actions": {
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
      "view": "View",
      "select": "Select",
      "search": "Search",
      "filter": "Filter",
      "sort": "Sort",
      "refresh": "Refresh"
    },
    "states": {
      "loading": "Loading...",
      "saving": "Saving...",
      "deleting": "Deleting...",
      "updating": "Updating...",
      "processing": "Processing...",
      "fetching": "Fetching data...",
      "empty": "No data available",
      "error": "Error",
      "success": "Success",
      "pending": "Pending",
      "completed": "Completed"
    },
    "messages": {
      "saveSuccess": "Saved successfully",
      "updateSuccess": "Updated successfully",
      "deleteSuccess": "Deleted successfully",
      "createSuccess": "Created successfully",
      "errorGeneric": "Something went wrong",
      "tryAgain": "Please try again",
      "confirmDelete": "Are you sure you want to delete this?",
      "cannotUndo": "This action cannot be undone",
      "noResults": "No results found",
      "required": "This field is required"
    },
    "labels": {
      "name": "Name",
      "email": "Email",
      "password": "Password",
      "date": "Date",
      "time": "Time",
      "duration": "Duration",
      "status": "Status",
      "type": "Type",
      "description": "Description",
      "notes": "Notes"
    },
    "placeholders": {
      "enterValue": "Enter value",
      "selectOption": "Select option",
      "chooseDate": "Choose date",
      "search": "Search...",
      "typeHere": "Type here"
    }
  }
}
```

## Action Items

### Immediate (Week 1):
1. Add all common UI translation keys
2. Update button components to use translations
3. Fix loading and error states
4. Update form validation messages

### Short-term (Week 2-3):
1. Update all match-related components
2. Fix player management text
3. Update dashboard widgets
4. Translate tennis terminology

### Medium-term (Week 4):
1. Review and update all toast messages
2. Fix modal and dialog content
3. Update navigation items
4. Complete statistics components

## Tools for Ongoing Maintenance

### Recommended ESLint Rule:
```javascript
// Detect hardcoded strings in JSX
{
  "rules": {
    "no-hardcoded-strings": ["error", {
      "ignore": ["className", "href", "src"]
    }]
  }
}
```

### VS Code Search Regex Patterns:
```
// Find hardcoded strings in JSX
>\s*["'][A-Z][a-z]+.*["']\s*<

// Find button text
<Button[^>]*>([^<]+)</Button>

// Find placeholder attributes
placeholder\s*=\s*["'][^"']+["']

// Find toast calls
toast\.(success|error|info|warning)\s*\(\s*["'][^"']+["']
```

## Conclusion

This audit reveals extensive hardcoded English text throughout the application. The priority should be:
1. Common UI elements (buttons, states, messages)
2. User-facing forms and validation
3. Tennis-specific terminology
4. Statistics and dashboard content

Estimated 200+ unique strings need translation keys across all namespaces.