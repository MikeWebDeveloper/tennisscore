# Next-intl Internationalization System

This directory contains the new next-intl based internationalization system for the tennis scoring application. The system provides type-safe translations, proper server-side rendering support, and backward compatibility with the existing translation keys.

## Architecture Overview

```
src/i18n/
├── config.ts              # Main configuration and message loading
├── navigation.ts           # Internationalized routing setup  
├── request.ts             # Server-side locale detection
├── types.ts               # TypeScript type definitions
├── utils.ts               # Tennis-specific formatting utilities
├── client-hooks.ts        # Client-side React hooks
├── index.ts               # Main exports
├── example-usage.tsx      # Usage examples
├── README.md              # This documentation
└── locales/
    ├── en/                # English translations
    │   ├── common.json
    │   ├── navigation.json
    │   ├── auth.json
    │   ├── match.json
    │   ├── dashboard.json
    │   ├── player.json
    │   └── statistics.json
    └── cs/                # Czech translations
        ├── common.json
        ├── navigation.json
        ├── auth.json
        ├── match.json
        ├── dashboard.json
        ├── player.json
        └── statistics.json
```

## Key Features

### 1. **Type Safety**
- Full TypeScript support with autocomplete
- Compile-time checking of translation keys
- Parameter validation for interpolated messages

### 2. **Namespace Organization**
- Translations organized by feature area
- Prevents key conflicts
- Easier maintenance and updates

### 3. **Server-Side Rendering**
- Proper SSR support with next-intl
- No hydration mismatches
- SEO-friendly locale handling

### 4. **Backward Compatibility**
- Migration helpers for existing keys
- Gradual migration support
- Fallback mechanisms

### 5. **Tennis-Specific Utilities**
- Specialized formatters for scores, durations, statistics
- Court position and shot type formatting
- Match result presentation

## Usage Examples

### Basic Client Component

```tsx
'use client'

import { useTranslations } from '@/i18n'

export function MyComponent() {
  const t = useTranslations('common')
  
  return (
    <div>
      <button>{t('save')}</button>
      <button>{t('cancel')}</button>
    </div>
  )
}
```

### Tennis-Specific Formatting

```tsx
'use client'

import { useTennisTranslations } from '@/i18n'

export function MatchSummary({ match }) {
  const { t, formatDuration, formatScore, formatWinPercentage } = useTennisTranslations()
  
  return (
    <div>
      <h2>{t('match.matchSummary')}</h2>
      <p>Duration: {formatDuration(match.durationMinutes)}</p>
      <p>Score: {formatScore(match.sets, true)}</p>
      <p>Win Rate: {formatWinPercentage(match.wins, match.total)}</p>
    </div>
  )
}
```

### Server Component

```tsx
import { useTranslations } from 'next-intl'

export function ServerComponent() {
  const t = useTranslations('dashboard')
  
  return (
    <div>
      <h1>{t('welcomeBack')}</h1>
      <p>{t('dashboardSubtitle')}</p>
    </div>
  )
}
```

### Parameter Interpolation

```tsx
'use client'

import { useTranslations } from '@/i18n'

export function PlayerGreeting({ playerName }) {
  const t = useTranslations('dashboard')
  
  return (
    <h2>{t('matchVsOpponent', { opponentName: playerName })}</h2>
  )
}
```

### Locale Switching

```tsx
'use client'

import { useLocaleSwitch } from '@/i18n'

export function LanguageToggle() {
  const { currentLocale, switchToEnglish, switchToCzech } = useLocaleSwitch()
  
  return (
    <div>
      <span>Current: {currentLocale}</span>
      <button onClick={switchToEnglish}>English</button>
      <button onClick={switchToCzech}>Čeština</button>
    </div>
  )
}
```

## Migration Guide

### Gradual Migration Strategy

1. **Install and Configure** (✅ Complete)
   - next-intl package installed
   - Configuration files created
   - Middleware updated

2. **Update Components Gradually**
   - Start with new components
   - Update existing components one by one
   - Use legacy compatibility mode during transition

3. **Key Mapping**
   ```tsx
   // Old way
   const t = useTranslationsLegacy()
   t('loading') // Still works

   // New way
   const t = useTranslations('common')
   t('loading') // Preferred
   ```

### Legacy Key Support

The system automatically maps old keys to new namespaced keys:

```tsx
// These are equivalent:
t('dashboard')           → t('navigation.dashboard')
t('newMatch')           → t('match.newMatch')
t('firstName')          → t('player.firstName')
t('totalPoints')        → t('statistics.totalPoints')
t('welcomeBack')        → t('dashboard.welcomeBack')
```

## Configuration

### Locale Configuration (`config.ts`)

```typescript
export const locales = ['en', 'cs'] as const
export const defaultLocale: Locale = 'en'
```

### Middleware Integration

The middleware handles:
- Locale detection from headers
- Route protection with locale support
- Locale prefix management

### Next.js Configuration

```javascript
import createNextIntlPlugin from 'next-intl/plugin'
const withNextIntl = createNextIntlPlugin('./src/i18n/config.ts')
export default withNextIntl(nextConfig)
```

## File Structure

### Translation Files

Each locale has the following namespace files:

- **common.json**: Shared UI elements (buttons, labels, etc.)
- **navigation.json**: Menu items, page titles
- **auth.json**: Authentication-related text
- **match.json**: Match creation, scoring, results
- **dashboard.json**: Dashboard-specific content
- **player.json**: Player management
- **statistics.json**: Statistics and analysis

### Adding New Translations

1. **Add to TypeScript types** (`types.ts`)
2. **Add to all locale files** (`locales/*/namespace.json`)
3. **Use in components** with proper namespacing

## Best Practices

### 1. Always Use Namespaces
```tsx
// ✅ Good
const t = useTranslations('match')
t('newMatch')

// ❌ Avoid
const t = useTranslations()
t('match.newMatch')
```

### 2. Use Tennis Formatters
```tsx
// ✅ Good
const { formatDuration } = useTennisTranslations()
formatDuration(125) // "2 hr 5 min"

// ❌ Avoid
`${Math.floor(125/60)} hr ${125%60} min`
```

### 3. Handle Parameters Properly
```tsx
// ✅ Good
t('matchVsOpponent', { opponentName: player.name })

// ❌ Avoid
`Match vs. ${player.name}`
```

### 4. Validate Keys at Build Time
TypeScript will catch invalid keys:
```tsx
t('invalidKey') // ❌ TypeScript error
t('newMatch')   // ✅ Valid
```

## Error Handling

The system includes several fallback mechanisms:

1. **Missing Keys**: Falls back to English, then key name
2. **Invalid Parameters**: Logs warning, returns key
3. **Namespace Errors**: Returns fallback translation
4. **Legacy Keys**: Automatically mapped to new system

## Performance Considerations

- **Code Splitting**: Translations are loaded per namespace
- **Caching**: Messages are cached at build time
- **Tree Shaking**: Only used translations are included
- **SSR**: Proper server-side rendering without hydration issues

## Testing

```tsx
// Test with different locales
import { NextIntlClientProvider } from 'next-intl'

const messages = {
  common: {
    save: 'Save',
    cancel: 'Cancel'
  }
}

<NextIntlClientProvider locale="en" messages={messages}>
  <YourComponent />
</NextIntlClientProvider>
```

## Future Enhancements

- [ ] Pluralization rules for Czech language
- [ ] RTL language support preparation
- [ ] Translation validation tools
- [ ] Automated key extraction from components
- [ ] Translation management interface
- [ ] Performance monitoring for translation loading

## Support

For questions about the i18n system:
1. Check this README
2. Review example usage files
3. Consult next-intl documentation
4. Check the migration helpers for compatibility issues