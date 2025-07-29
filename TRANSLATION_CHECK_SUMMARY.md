# Czech Translation & Hardcoded Strings Check Summary

## Overview
This document summarizes the comprehensive check for ensuring Czech (cs) is properly set as the default locale and identifying any remaining hardcoded English strings in the Tennis Score application.

## Scripts Created for Analysis

### 1. `check-hardcoded-strings.sh`
- Searches for hardcoded text between JSX tags
- Identifies string literals in props
- Finds common UI text patterns
- Checks for hardcoded 'en' locale references

### 2. `find-hardcoded-strings.sh`
- More targeted search for specific patterns
- Checks placeholders, titles, aria-labels
- Searches for button and link text
- Identifies form validation messages

### 3. `find-all-hardcoded.sh`
- Comprehensive search across all components
- Checks common UI words (Submit, Cancel, Save, etc.)
- Examines toast messages
- Reviews empty state messages
- Generates detailed report

### 4. `check-czech-translations.sh`
- Compares English and Czech translation files
- Identifies missing keys in Czech translations
- Finds English text in Czech files
- Verifies defaultLocale configuration

### 5. `final-translation-check.sh`
- Most comprehensive check combining all patterns
- Checks configuration files
- Examines high-risk areas (dashboard, statistics, matches)
- Provides actionable summary

### 6. `fix-translations.sh`
- Generates specific fix recommendations
- Creates markdown report with line-by-line fixes
- Suggests translation keys for hardcoded strings
- Provides code examples for fixes

## Key Findings

### 1. Default Locale Configuration
**Current Status:** Need to verify and update defaultLocale from 'en' to 'cs' in:
- `src/i18n/config.ts`
- `src/i18n/navigation.ts`
- `src/middleware.ts`
- `next.config.mjs`

### 2. Common Hardcoded String Patterns
The scripts will identify:
- Text between JSX tags not using `{t(...)}`
- Hardcoded placeholders, titles, and aria-labels
- Button and Link components with literal text
- Toast messages with hardcoded strings
- Form validation messages
- Common UI words (Submit, Cancel, Save, etc.)

### 3. High-Risk Areas
Special attention needed for:
- Dashboard components
- Statistics pages and sub-components
- Match creation and live scoring
- Player management pages
- Authentication pages
- Admin pages

## How to Run the Checks

1. Make scripts executable:
```bash
chmod +x *.sh
```

2. Run the comprehensive check:
```bash
./final-translation-check.sh
```

3. Generate fix recommendations:
```bash
./fix-translations.sh
```

4. Check Czech translation completeness:
```bash
./check-czech-translations.sh
```

## Action Items

### 1. Update Configuration (Priority 1)
- Change `defaultLocale = 'en'` to `defaultLocale = 'cs'` in all config files
- Ensure middleware properly handles Czech as default

### 2. Fix Hardcoded Strings (Priority 2)
- Replace all hardcoded English text with translation function calls
- Use appropriate namespaces (auth, common, dashboard, match, navigation, player, statistics)
- Follow the pattern:
  ```tsx
  // Client Components
  const t = useTranslations('namespace')
  <p>{t('key')}</p>
  
  // Server Components
  const t = await getTranslations('namespace')
  <p>{t('key')}</p>
  ```

### 3. Complete Czech Translations (Priority 3)
- Add any missing Czech translations for new keys
- Ensure Czech translations don't contain English text
- Verify all namespaces have complete Czech translations

### 4. Testing (Priority 4)
- Test entire application in Czech locale
- Verify no English text appears when Czech is selected
- Check all forms, buttons, messages, and UI elements
- Test error states and edge cases

## Best Practices Going Forward

1. **Never hardcode user-facing text** - Always use the translation system
2. **Add translations immediately** - When adding new text, add to all language files
3. **Use meaningful translation keys** - e.g., 'dashboard.welcomeMessage' not 'text1'
4. **Test in multiple languages** - Especially Czech as it's the default
5. **Regular audits** - Run these scripts periodically to catch new issues

## Support for 8 Languages

The application supports:
- English (en)
- Czech (cs) - DEFAULT
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)

All new text must be added to ALL language files to maintain complete multilingual support.

## Conclusion

Use the provided scripts to identify and fix all hardcoded strings. The goal is to have a fully internationalized application with Czech as the default locale and no hardcoded English strings anywhere in the codebase.