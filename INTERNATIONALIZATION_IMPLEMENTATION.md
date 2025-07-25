# Internationalization Implementation Guide

## Current Status

The i18n system (next-intl) has been temporarily disabled to restore app functionality. The blank screen was caused by a mismatch between the i18n middleware expectations and the app structure.

## What Happened

1. We implemented next-intl with all translation files and configuration
2. The middleware was rewriting URLs to include locales (e.g., `/dashboard` → `/en/dashboard`)
3. But the app structure doesn't have routes under `[locale]` directory
4. Result: All routes returned 404, causing a blank screen

## Temporary Fix Applied

1. **Disabled next-intl plugin** in `next.config.mjs`
2. **Disabled i18n middleware** in `src/middleware.ts`
3. **App is now functional** without i18n URL routing

## Proper Implementation Path

To properly implement i18n with next-intl in Next.js App Router, follow these steps:

### 1. Restructure App Directory

Move all routes under a `[locale]` directory:

```
src/app/
├── [locale]/                    # New locale directory
│   ├── (app)/                  # Move existing (app) here
│   │   ├── dashboard/
│   │   ├── matches/
│   │   ├── players/
│   │   └── statistics/
│   ├── (auth)/                 # Move existing (auth) here
│   │   ├── login/
│   │   └── signup/
│   ├── layout.tsx              # Locale-specific layout
│   └── page.tsx                # Home page
├── api/                        # Keep API routes at root
├── live/[matchId]/            # Keep public routes at root
├── globals.css
└── layout.tsx                  # Root layout (minimal)
```

### 2. Update Layouts

#### Root Layout (`src/app/layout.tsx`):
```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
```

#### Locale Layout (`src/app/[locale]/layout.tsx`):
```tsx
import { notFound } from 'next/navigation'
import { locales } from '@/i18n/config'
import { Providers } from './providers'

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!locales.includes(locale as any)) {
    notFound()
  }

  return (
    <html lang={locale}>
      <body>
        <Providers locale={locale}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### 3. Update All Link/Router References

Change all navigation to use locale-aware routing:

```tsx
// Before
import Link from 'next/link'
<Link href="/dashboard">Dashboard</Link>

// After
import { Link } from '@/i18n/navigation'
<Link href="/dashboard">Dashboard</Link>
```

### 4. Re-enable i18n

Once the restructuring is complete:

1. **Re-enable next-intl plugin** in `next.config.mjs`:
```js
export default withNextIntl(nextConfig);
```

2. **Re-enable i18n middleware** in `src/middleware.ts`:
```ts
const response = intlMiddleware(request)
// ... rest of the code
return response
```

## Current Working State

- **App is functional** without i18n URL routing
- **All translations are ready** in 8 languages
- **Translation hooks work** but use the old system fallback
- **Language switcher is implemented** but won't change URLs

## Benefits After Proper Implementation

1. **SEO-friendly URLs**: `/es/dashboard`, `/fr/matches`
2. **Server-side rendering** with proper locale
3. **Automatic locale detection** from browser
4. **Better performance** with locale-specific bundles
5. **Full next-intl features** available

## Migration Timeline

1. **Phase 1**: Current state (functional but no i18n routing)
2. **Phase 2**: Restructure app directory (1-2 days)
3. **Phase 3**: Update all navigation (1 day)
4. **Phase 4**: Re-enable and test i18n (1 day)

## Alternative: Keep Current Structure

If you prefer not to restructure, you can:
1. Keep the current translations system
2. Use client-side locale switching only
3. No URL-based locale routing
4. Simpler but less SEO-friendly

The app is now working. This guide provides the path forward for proper i18n implementation when ready.