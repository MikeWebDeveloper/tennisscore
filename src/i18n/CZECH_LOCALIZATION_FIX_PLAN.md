# Czech Localization Fix Implementation Plan

## Overview
This document provides a step-by-step plan to fix all Czech localization issues in the TennisScore application.

## Phase 1: Immediate Foundation Updates (Day 1)

### 1.1 Update Common Namespace
Add these essential keys to both `/src/i18n/locales/en/common.json` and `/src/i18n/locales/cs/common.json`:

```json
// English (en/common.json)
{
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
    "viewAll": "View All",
    "select": "Select",
    "search": "Search",
    "filter": "Filter",
    "reset": "Reset",
    "refresh": "Refresh",
    "share": "Share",
    "download": "Download",
    "upload": "Upload",
    "start": "Start",
    "end": "End",
    "pause": "Pause",
    "resume": "Resume",
    "stop": "Stop"
  },
  "states": {
    "loading": "Loading...",
    "saving": "Saving...",
    "deleting": "Deleting...",
    "updating": "Updating...",
    "processing": "Processing...",
    "searching": "Searching...",
    "empty": "No data available",
    "error": "Error",
    "success": "Success",
    "pending": "Pending",
    "completed": "Completed",
    "active": "Active",
    "inactive": "Inactive",
    "online": "Online",
    "offline": "Offline"
  },
  "messages": {
    "saveSuccess": "Saved successfully",
    "updateSuccess": "Updated successfully",
    "deleteSuccess": "Deleted successfully",
    "createSuccess": "Created successfully",
    "errorGeneric": "Something went wrong",
    "errorNetwork": "Network error. Please check your connection.",
    "tryAgain": "Please try again",
    "confirmDelete": "Are you sure you want to delete this?",
    "confirmAction": "Are you sure you want to proceed?",
    "cannotUndo": "This action cannot be undone",
    "noResults": "No results found",
    "noData": "No data to display",
    "welcome": "Welcome",
    "goodbye": "Goodbye"
  },
  "validation": {
    "required": "This field is required",
    "email": "Please enter a valid email address",
    "minLength": "Must be at least {{min}} characters",
    "maxLength": "Must be no more than {{max}} characters",
    "minValue": "Must be at least {{min}}",
    "maxValue": "Must be no more than {{max}}",
    "pattern": "Invalid format",
    "unique": "This value already exists",
    "passwordMatch": "Passwords do not match",
    "invalidDate": "Invalid date",
    "futureDate": "Date must be in the future",
    "pastDate": "Date must be in the past"
  },
  "time": {
    "seconds": "seconds",
    "minutes": "minutes",
    "hours": "hours",
    "days": "days",
    "weeks": "weeks",
    "months": "months",
    "years": "years",
    "today": "Today",
    "yesterday": "Yesterday",
    "tomorrow": "Tomorrow",
    "now": "Now",
    "ago": "{{time}} ago",
    "in": "in {{time}}"
  },
  "labels": {
    "name": "Name",
    "firstName": "First Name",
    "lastName": "Last Name",
    "email": "Email",
    "password": "Password",
    "confirmPassword": "Confirm Password",
    "date": "Date",
    "time": "Time",
    "duration": "Duration",
    "status": "Status",
    "type": "Type",
    "category": "Category",
    "description": "Description",
    "notes": "Notes",
    "country": "Country",
    "language": "Language",
    "settings": "Settings",
    "profile": "Profile",
    "preferences": "Preferences"
  },
  "placeholders": {
    "enterName": "Enter name",
    "enterEmail": "Enter email address",
    "enterPassword": "Enter password",
    "selectOption": "Select an option",
    "selectDate": "Select date",
    "selectTime": "Select time",
    "search": "Search...",
    "typeHere": "Type here...",
    "addNote": "Add a note..."
  }
}

// Czech (cs/common.json)
{
  "actions": {
    "save": "Uložit",
    "cancel": "Zrušit",
    "delete": "Smazat",
    "edit": "Upravit",
    "create": "Vytvořit",
    "update": "Aktualizovat",
    "submit": "Odeslat",
    "back": "Zpět",
    "next": "Další",
    "previous": "Předchozí",
    "close": "Zavřít",
    "confirm": "Potvrdit",
    "view": "Zobrazit",
    "viewAll": "Zobrazit vše",
    "select": "Vybrat",
    "search": "Hledat",
    "filter": "Filtrovat",
    "reset": "Resetovat",
    "refresh": "Obnovit",
    "share": "Sdílet",
    "download": "Stáhnout",
    "upload": "Nahrát",
    "start": "Začít",
    "end": "Ukončit",
    "pause": "Pozastavit",
    "resume": "Pokračovat",
    "stop": "Zastavit"
  },
  "states": {
    "loading": "Načítání...",
    "saving": "Ukládání...",
    "deleting": "Mazání...",
    "updating": "Aktualizace...",
    "processing": "Zpracování...",
    "searching": "Vyhledávání...",
    "empty": "Žádná data k zobrazení",
    "error": "Chyba",
    "success": "Úspěch",
    "pending": "Čekající",
    "completed": "Dokončeno",
    "active": "Aktivní",
    "inactive": "Neaktivní",
    "online": "Online",
    "offline": "Offline"
  },
  "messages": {
    "saveSuccess": "Úspěšně uloženo",
    "updateSuccess": "Úspěšně aktualizováno",
    "deleteSuccess": "Úspěšně smazáno",
    "createSuccess": "Úspěšně vytvořeno",
    "errorGeneric": "Něco se pokazilo",
    "errorNetwork": "Chyba sítě. Zkontrolujte prosím připojení.",
    "tryAgain": "Zkuste to prosím znovu",
    "confirmDelete": "Opravdu chcete tuto položku smazat?",
    "confirmAction": "Opravdu chcete pokračovat?",
    "cannotUndo": "Tuto akci nelze vrátit zpět",
    "noResults": "Žádné výsledky",
    "noData": "Žádná data k zobrazení",
    "welcome": "Vítejte",
    "goodbye": "Nashledanou"
  },
  "validation": {
    "required": "Toto pole je povinné",
    "email": "Zadejte prosím platnou e-mailovou adresu",
    "minLength": "Musí mít alespoň {{min}} znaků",
    "maxLength": "Může mít maximálně {{max}} znaků",
    "minValue": "Musí být alespoň {{min}}",
    "maxValue": "Může být maximálně {{max}}",
    "pattern": "Neplatný formát",
    "unique": "Tato hodnota již existuje",
    "passwordMatch": "Hesla se neshodují",
    "invalidDate": "Neplatné datum",
    "futureDate": "Datum musí být v budoucnosti",
    "pastDate": "Datum musí být v minulosti"
  },
  "time": {
    "seconds": "sekund",
    "minutes": "minut",
    "hours": "hodin",
    "days": "dní",
    "weeks": "týdnů",
    "months": "měsíců",
    "years": "let",
    "today": "Dnes",
    "yesterday": "Včera",
    "tomorrow": "Zítra",
    "now": "Nyní",
    "ago": "před {{time}}",
    "in": "za {{time}}"
  },
  "labels": {
    "name": "Jméno",
    "firstName": "Křestní jméno",
    "lastName": "Příjmení",
    "email": "E-mail",
    "password": "Heslo",
    "confirmPassword": "Potvrdit heslo",
    "date": "Datum",
    "time": "Čas",
    "duration": "Trvání",
    "status": "Stav",
    "type": "Typ",
    "category": "Kategorie",
    "description": "Popis",
    "notes": "Poznámky",
    "country": "Země",
    "language": "Jazyk",
    "settings": "Nastavení",
    "profile": "Profil",
    "preferences": "Předvolby"
  },
  "placeholders": {
    "enterName": "Zadejte jméno",
    "enterEmail": "Zadejte e-mailovou adresu",
    "enterPassword": "Zadejte heslo",
    "selectOption": "Vyberte možnost",
    "selectDate": "Vyberte datum",
    "selectTime": "Vyberte čas",
    "search": "Hledat...",
    "typeHere": "Pište zde...",
    "addNote": "Přidat poznámku..."
  }
}
```

### 1.2 Update Tennis-Specific Terms in Match Namespace

Add to `/src/i18n/locales/en/match.json` and `/src/i18n/locales/cs/match.json`:

```json
// English additions
{
  "scoring": {
    "love": "Love",
    "fifteen": "15",
    "thirty": "30",
    "forty": "40",
    "deuce": "Deuce",
    "advantage": "Advantage",
    "advantageShort": "Ad",
    "game": "Game",
    "set": "Set",
    "match": "Match",
    "tiebreak": "Tiebreak",
    "superTiebreak": "Super Tiebreak"
  },
  "shots": {
    "forehand": "Forehand",
    "backhand": "Backhand",
    "serve": "Serve",
    "return": "Return",
    "volley": "Volley",
    "smash": "Smash",
    "dropShot": "Drop Shot",
    "lob": "Lob",
    "slice": "Slice",
    "topspin": "Topspin",
    "flat": "Flat"
  },
  "courtSurfaces": {
    "hard": "Hard Court",
    "clay": "Clay Court",
    "grass": "Grass Court",
    "indoor": "Indoor Court",
    "carpet": "Carpet"
  },
  "matchFormats": {
    "bestOf3": "Best of 3 Sets",
    "bestOf5": "Best of 5 Sets",
    "noAd": "No-Ad Scoring",
    "regular": "Regular Scoring",
    "championship": "Championship Tiebreak"
  }
}

// Czech additions
{
  "scoring": {
    "love": "Nula",
    "fifteen": "15",
    "thirty": "30",
    "forty": "40",
    "deuce": "Shoda",
    "advantage": "Výhoda",
    "advantageShort": "Výh",
    "game": "Hra",
    "set": "Set",
    "match": "Zápas",
    "tiebreak": "Tiebreak",
    "superTiebreak": "Super Tiebreak"
  },
  "shots": {
    "forehand": "Forhend",
    "backhand": "Bekhend",
    "serve": "Podání",
    "return": "Return",
    "volley": "Volej",
    "smash": "Smeč",
    "dropShot": "Kraťas",
    "lob": "Lob",
    "slice": "Slice",
    "topspin": "Topspin",
    "flat": "Rovný úder"
  },
  "courtSurfaces": {
    "hard": "Tvrdý povrch",
    "clay": "Antuka",
    "grass": "Tráva",
    "indoor": "Hala",
    "carpet": "Koberec"
  },
  "matchFormats": {
    "bestOf3": "Na 2 vítězné sety",
    "bestOf5": "Na 3 vítězné sety",
    "noAd": "Bez výhod",
    "regular": "Standardní bodování",
    "championship": "Rozhodující tiebreak"
  }
}
```

## Phase 2: Component Updates (Day 2-3)

### 2.1 Update Modified Components

1. **paginated-matches-client.tsx**
   - Replace all hardcoded strings with translation keys
   - Update filter labels
   - Fix empty state messages

2. **match-patterns.tsx**
   - Update chart titles and labels
   - Fix tooltip content
   - Translate pattern descriptions

3. **performance-trends.tsx**
   - Update trend labels
   - Fix metric descriptions
   - Translate time period selectors

4. **statistics-filters.tsx**
   - Update all filter option labels
   - Fix date range labels
   - Translate player selection prompts

### 2.2 Common Component Patterns to Fix

```tsx
// Before:
<Button>Save</Button>
<h2>Recent Matches</h2>
<p>No matches found</p>
toast.success("Match saved successfully")

// After:
import { useTranslations } from '@/i18n'

const t = useTranslations('common')
const tMatch = useTranslations('match')

<Button>{t('actions.save')}</Button>
<h2>{tMatch('recentMatches')}</h2>
<p>{t('messages.noResults')}</p>
toast.success(t('messages.saveSuccess'))
```

## Phase 3: Systematic Component Review (Day 4-5)

### 3.1 Search and Replace Strategy

Use these VS Code search patterns to find hardcoded text:

```regex
// Find button text
<Button[^>]*>([A-Za-z\s]+)</Button>

// Find headings
<h[1-6][^>]*>([A-Za-z\s]+)</h[1-6]>

// Find paragraphs with text
<p[^>]*>([A-Za-z][^<]+)</p>

// Find placeholder attributes
placeholder="([^"]+)"

// Find toast messages
toast\.(success|error|info|warning)\("([^"]+)"\)

// Find string literals in JSX
{["']([A-Z][a-z][^"']+)["']}
```

### 3.2 Priority Component List

1. **Authentication Components**
   - `/src/app/(auth)/login/page.tsx`
   - `/src/app/(auth)/signup/page.tsx`
   - Update all form labels and error messages

2. **Dashboard Components**
   - `/src/app/(app)/dashboard/page.tsx`
   - All bento grid widgets
   - Performance summary cards

3. **Match Components**
   - Live scoring interface
   - Match creation form
   - Match history list

4. **Player Components**
   - Player creation/edit forms
   - Player selection dialogs
   - Player profiles

## Phase 4: Testing and Validation (Day 6)

### 4.1 Testing Checklist

- [ ] Switch to Czech locale and navigate all pages
- [ ] Test all forms with Czech validation messages
- [ ] Verify button labels are translated
- [ ] Check toast notifications in Czech
- [ ] Test empty states and loading messages
- [ ] Verify tennis terminology is correct
- [ ] Check for text overflow issues
- [ ] Test number and date formatting

### 4.2 Quality Assurance Steps

1. **Visual Review**
   - Check for any remaining English text
   - Verify text fits within UI elements
   - Ensure consistent terminology usage

2. **Functional Testing**
   - Test all user flows in Czech
   - Verify error messages display correctly
   - Check form validation messages

3. **Cross-Browser Testing**
   - Test in Chrome, Firefox, Safari
   - Check mobile responsive views
   - Verify special characters display correctly

## Phase 5: Documentation and Maintenance (Day 7)

### 5.1 Update Development Guidelines

Add to CLAUDE.md:
```markdown
### Translation Checklist for New Features
- [ ] All user-facing text uses translation keys
- [ ] Translation keys added to all 8 language files
- [ ] Component tested in multiple languages
- [ ] No hardcoded strings in JSX
- [ ] Toast messages use translations
- [ ] Form validation messages translated
- [ ] Loading and error states translated
```

### 5.2 Create Translation Helper Script

Create `/scripts/check-translations.js`:
```javascript
// Script to find missing translations and hardcoded strings
const fs = require('fs');
const path = require('path');

// Check for common hardcoded patterns
const patterns = [
  />["']?[A-Z][a-z]+/,
  /placeholder="[^"]+"/,
  /toast\.(success|error|info)\("[^"]+"\)/
];

// Scan components directory
// Report findings
```

## Success Metrics

- [ ] Zero hardcoded English strings in components
- [ ] All Czech translations complete and accurate
- [ ] Application fully functional in Czech locale
- [ ] Consistent tennis terminology across the app
- [ ] Clean, organized i18n file structure
- [ ] Developer guidelines updated

## Estimated Timeline

- **Day 1**: Foundation updates (common namespace, tennis terms)
- **Day 2-3**: Update modified components
- **Day 4-5**: Systematic component review
- **Day 6**: Testing and validation
- **Day 7**: Documentation and maintenance setup

Total: 7 working days for complete Czech localization fix