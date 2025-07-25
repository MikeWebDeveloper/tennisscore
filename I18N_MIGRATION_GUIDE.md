# i18n Migration Guide

## Overview

This guide explains the client-side internationalization solution implemented for TennisScore, which works without restructuring the app to use `[locale]` directories.

## Implementation Summary

### Key Benefits
- ✅ No route restructuring required
- ✅ Uses existing translation files
- ✅ Full TypeScript support
- ✅ Works with Zustand store
- ✅ Supports all 8 languages
- ✅ Client-side only (no SSR complexity)
- ✅ Minimal changes to existing code

### Architecture

1. **Translation Loading**: All translations are imported and bundled at build time
2. **Locale Storage**: Zustand store persists user's language preference
3. **Hydration Safe**: Always renders English on server, switches to user locale on client
4. **Parameter Support**: Handles dynamic values in translations

## Usage Guide

### Basic Usage

```tsx
import { useTranslations } from '@/hooks/use-translations'

export function MyComponent() {
  const t = useTranslations()
  
  return (
    <div>
      <h1>{t('common.loading')}</h1>
      <button>{t('common.save')}</button>
    </div>
  )
}
```

### With Namespaces

```tsx
import { useTranslations } from '@/hooks/use-translations'

export function MatchComponent() {
  const t = useTranslations('match')
  
  return (
    <div>
      <h1>{t('newMatch')}</h1>
      <p>{t('liveScoring')}</p>
    </div>
  )
}
```

### With Parameters

```tsx
const t = useTranslations('match')

// In translation file: "bestOf": "Best of {sets}"
<p>{t('bestOf', { sets: 5 })}</p> // Output: "Best of 5"
```

### Language Switcher

Add the language switcher to any layout or component:

```tsx
import { LanguageSwitcher } from '@/components/ui/language-switcher'

export function Header() {
  return (
    <header>
      <LanguageSwitcher />
    </header>
  )
}
```

## Migration Steps

### 1. Add LocaleProvider to Root Layout

In your root layout (`app/layout.tsx`), wrap the app with LocaleProvider:

```tsx
import { LocaleProvider } from '@/components/providers/locale-provider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </body>
    </html>
  )
}
```

### 2. Replace Hardcoded Strings

Replace all hardcoded strings with translation calls:

```tsx
// Before
<h1>Dashboard</h1>

// After
const t = useTranslations('navigation')
<h1>{t('dashboard')}</h1>
```

### 3. Update Existing Components

For components already using the old `useTranslations` from `@/i18n`:

```tsx
// Old import (remove this)
import { useTranslations } from '@/i18n'

// New import
import { useTranslations } from '@/hooks/use-translations'
```

## Translation File Structure

Translation files remain in their current structure:

```
src/i18n/locales/
├── en/
│   ├── common.json
│   ├── navigation.json
│   ├── auth.json
│   ├── match.json
│   ├── dashboard.json
│   ├── player.json
│   └── statistics.json
├── cs/
│   └── ... (same files)
├── es/
├── fr/
├── de/
├── it/
├── pt/
└── ru/
```

## Adding New Translations

1. Add the key to all language files:

```json
// en/common.json
{
  "common": {
    "newFeature": "New Feature"
  }
}

// cs/common.json
{
  "common": {
    "newFeature": "Nová funkce"
  }
}
```

2. Update the TypeScript types if needed (auto-generated from English translations)

3. Use in component:

```tsx
const t = useTranslations('common')
<p>{t('newFeature')}</p>
```

## Performance Considerations

- All translations are bundled at build time (increases bundle size by ~200KB)
- Consider code-splitting if translation files grow significantly
- Locale changes don't require page reload
- No network requests for translations

## Troubleshooting

### Translation Keys Showing Instead of Text

1. Ensure LocaleProvider is wrapping your app
2. Check that translation files are properly imported in `lib/translations.ts`
3. Verify the translation key exists in the language file

### Hydration Warnings

The implementation handles hydration by:
- Always rendering English on server
- Switching to user's locale after mount
- Using `mounted` and `hydrated` states to prevent mismatches

### Locale Not Persisting

1. Check browser localStorage is enabled
2. Verify Zustand persist middleware is working
3. Clear localStorage and try again

## Future Enhancements

1. **Dynamic Import**: Load only the needed locale to reduce bundle size
2. **Namespace Splitting**: Load translations by namespace on demand
3. **Server-Side Support**: Add middleware for cookie-based SSR if needed
4. **URL-Based Locale**: Optional locale in URL without restructuring routes

## Testing

Visit `/test-i18n` to see the implementation in action and test all languages.