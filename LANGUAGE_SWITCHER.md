# Language Switcher Component

A comprehensive, accessible language switcher component for the TennisScore application supporting all 8 languages with multiple display variants.

## Features

- **8 Language Support**: English, Czech, Spanish, French, German, Italian, Portuguese, Russian
- **Multiple Variants**: Dropdown, Select, and Compact button
- **Flag Icons**: Visual language identification using emoji flags
- **Native Names**: Display languages in their native scripts
- **URL-based Routing**: Proper locale routing with next-intl navigation
- **Accessibility**: Full keyboard navigation and ARIA labels
- **Mobile Responsive**: Optimized for mobile with proper touch targets (44px+)
- **Persistent**: Remembers user language choice
- **Loading States**: Graceful hydration and loading handling

## Usage

### Basic Usage

```tsx
import { LanguageSwitcher } from "@/components/ui/language-switcher"

// Default dropdown variant
<LanguageSwitcher />

// Select variant
<LanguageSwitcher variant="select" />

// Compact button variant
<LanguageSwitcher variant="compact" />
```

### Props

```typescript
interface LanguageSwitcherProps {
  variant?: 'select' | 'dropdown' | 'compact'  // Default: 'dropdown'
  className?: string                           // Additional CSS classes
  showNativeNames?: boolean                    // Default: true
  showFlags?: boolean                          // Default: true  
  size?: 'sm' | 'md' | 'lg'                   // Default: 'md'
}
```

### Variants

#### 1. Dropdown (Default)
- Uses shadcn/ui DropdownMenu
- Best for desktop navigation
- Shows current language with chevron indicator
- Dropdown list with all languages

```tsx
<LanguageSwitcher variant="dropdown" size="md" />
```

#### 2. Select
- Uses shadcn/ui Select component
- Good for forms and settings pages
- Native browser select styling
- Accessible with screen readers

```tsx
<LanguageSwitcher variant="select" size="md" />
```

#### 3. Compact
- Simple button that cycles through languages
- Minimal space usage
- Perfect for mobile headers
- Click to cycle to next language

```tsx
<LanguageSwitcher variant="compact" size="sm" />
```

### Customization Examples

```tsx
// Mobile header - compact with flag only
<LanguageSwitcher 
  variant="compact" 
  size="sm" 
  showNativeNames={false} 
  showFlags={true} 
/>

// Settings page - full select with native names
<LanguageSwitcher 
  variant="select" 
  size="md" 
  showNativeNames={true} 
  showFlags={true} 
/>

// Desktop navigation - dropdown with English names
<LanguageSwitcher 
  variant="dropdown" 
  size="sm" 
  showNativeNames={false} 
  showFlags={true} 
/>
```

## Language Configuration

The component uses the `LANGUAGE_CONFIG` constant which defines:

```typescript
export const LANGUAGE_CONFIG = {
  en: {
    code: 'en',
    name: 'English',      // English name
    nativeName: 'English', // Native name
    flag: '🇺🇸',           // Flag emoji
    direction: 'ltr',      // Text direction
  },
  // ... other languages
}
```

## Supported Languages

| Code | English Name | Native Name | Flag |
|------|-------------|-------------|------|
| en   | English     | English     | 🇺🇸   |
| cs   | Czech       | Čeština     | 🇨🇿   |
| es   | Spanish     | Español     | 🇪🇸   |
| fr   | French      | Français    | 🇫🇷   |
| de   | German      | Deutsch     | 🇩🇪   |
| it   | Italian     | Italiano    | 🇮🇹   |
| pt   | Portuguese  | Português   | 🇵🇹   |
| ru   | Russian     | Русский     | 🇷🇺   |

## Accessibility Features

- **ARIA Labels**: Descriptive labels for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Proper focus indicators
- **Role Attributes**: Correct semantic roles
- **Touch Targets**: Minimum 44px touch targets for mobile

## Integration with App Shell

The component is integrated into the app shell at two locations:

### Desktop Sidebar
```tsx
<LanguageSwitcher 
  variant="dropdown" 
  size="sm" 
  showFlags={true} 
  showNativeNames={false} 
/>
```

### Mobile Header
```tsx
<LanguageSwitcher 
  variant="compact" 
  size="sm" 
  showFlags={true} 
  showNativeNames={false} 
/>
```

## Hooks

### useLanguageSwitcher

Advanced hook for programmatic language switching:

```tsx
import { useLanguageSwitcher } from "@/components/ui/language-switcher"

function MyComponent() {
  const {
    currentLocale,
    currentLanguage,
    isChanging,
    switchLanguage,
    getAvailableLanguages,
    switchToNext,
    switchToPrevious,
  } = useLanguageSwitcher()

  return (
    <button onClick={() => switchLanguage('es')}>
      Switch to Spanish
    </button>
  )
}
```

### Available Methods

- `switchLanguage(locale: Locale)` - Switch to specific language
- `switchToNext()` - Cycle to next language
- `switchToPrevious()` - Cycle to previous language
- `getAvailableLanguages()` - Get all languages with active state
- `currentLocale` - Current language code
- `currentLanguage` - Current language config object
- `isChanging` - Loading state during language switch

## Storage and Persistence

The component uses Zustand for state management with persistence:

- **localStorage**: Stores user language preference
- **URL Sync**: Keeps URL in sync with selected language
- **SSR Safe**: Handles hydration properly

## Error Handling

- **Fallback**: Falls back to English if invalid locale
- **Graceful Degradation**: Shows loading state during hydration
- **Navigation Errors**: Catches and logs navigation failures

## Performance

- **Code Splitting**: Translation files loaded on demand
- **Caching**: Browser caches translation files
- **Minimal Bundle**: Only includes needed translations
- **Fast Switching**: Optimized route transitions

## Troubleshooting

### Language not switching
1. Check if locale is in `locales` array in `i18n/config.ts`
2. Verify translation files exist for the locale
3. Check browser console for navigation errors

### Missing translations
1. Ensure all translation keys exist in locale files
2. Check `common.json` has language name translations
3. Verify translation file structure matches

### Hydration mismatches
1. Component handles hydration automatically
2. Shows loading state until mounted
3. Syncs store with URL-based locale

## Migration from LanguageToggle

The new LanguageSwitcher replaces the old LanguageToggle component:

```tsx
// Old
<LanguageToggle />

// New
<LanguageSwitcher variant="compact" size="sm" />
```

All existing functionality is preserved with additional features.