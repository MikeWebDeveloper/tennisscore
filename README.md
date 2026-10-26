# TennisScore 🎾

Professional tennis scoring and analytics platform – your digital tennis companion.

## Overview

TennisScore is a modern web application for tennis scoring, statistics tracking, and real-time match sharing. The app targets competitive junior players and coaches, providing professional-grade statistical analysis with an elegant, intuitive user experience.

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Runtime**: React 19
- **UI Library**: shadcn/ui (Radix UI)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion (LazyMotion + domAnimation)
- **State Management**: Zustand
- **Charts**: uPlot (migrated from Recharts)
- **Icons**: lucide-react (optimized imports)

### Backend
- **BaaS**: Appwrite Cloud
- **Authentication**: Appwrite Auth (Email/Password)
- **Database**: Appwrite Databases (soft delete with retention)
- **Storage**: Appwrite Storage (profile pictures)
- **Real-time**: Appwrite Realtime (public live sharing)

### Deployment
- **Hosting**: Vercel
- **Branches**: `main` (production), `test` (preview deployments)

## Features

### ✅ Implemented
- Authentication (signup/signin/signout) and protected routes
- Internationalization: English + Czech
- Mobile-first shell: single content tree, flat bottom tab bar, three themes (Dark / Dim / Light), `N` shortcut, print styles
- Live match scoring with a point log as the single source of truth (3/5 sets, no-ad, tiebreaks, super tiebreak, advantage final set)
- Formats chosen in the match wizard: standard, **ITF short sets** (to 4, tiebreak at 4-4), **Fast4** (to 4, tiebreak at 3-3, no-ad) and **pro set** (to 8, tiebreak at 8-8; a common club/USTA format, not an ITF-defined one)
- **Doubles**: four players, first server chosen at match setup, serving partner shown and changeable (recorded per point, no schema change)
- **Offline-safe saving**: retried saves, in-progress match persisted in IndexedDB (localStorage fallback), "Saved / Saving / Not sent" indicator with automatic retry
- Screen stays awake while scoring (Screen Wake Lock)
- Live sharing with a public link, a **lightweight spectator view** at `/watch/<id>` (server-rendered, ~107 KB first load vs ~255 KB, refreshes with plain HTML), plus a shareable PNG **score card**
- PWA: network-first service worker (no stale pages after deploys), install button (Android) / Add-to-Home-Screen hint (iPhone)
- Player profiles with image upload/crop, statistics, soft delete (7-day retention)
- Performance: first load ~200 KB (dashboard) / ~275 KB (live scoring), enforced by a CI bundle budget
- Tests: unit tests (scoring engine, doubles rotation, sync, share card, i18n keys), Playwright shell tests, CI (types, tests, build, budget)

### 🚧 In Development
- Complete chart migration to uPlot across all views
- Performance monitoring (web-vitals, dashboards)
- Enhanced dashboard with analytics widgets

### 📋 Planned
- Idempotent client IDs for points (today: persisted store + full-snapshot sync, which is already safe to repeat)
- Move the remaining `recharts` charts to a lighter library (uPlot)
- Practice session tracking, social features

## Testing

- `npm test` – unit tests (scoring engine, service-worker caching strategy)
- `npm run test:e2e:shell` – Playwright tests for the app shell (mobile/desktop layout, themes, shortcuts).
  Needs a running production build with the test auth bypass:
  `PLAYWRIGHT=1 DISABLE_AUTH_FOR_TEST=1 npm run build && npx next start -p 3100`
- Lite spectator page end-to-end: `node tools/fake-appwrite.js`, build with `NEXT_PUBLIC_APPWRITE_ENDPOINT=http://localhost:4100/v1 NEXT_PUBLIC_APPWRITE_DATABASE_ID=d NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID=m APPWRITE_DATABASE_ID=d APPWRITE_MATCHES_COLLECTION_ID=m APPWRITE_PLAYERS_COLLECTION_ID=p`, start the app, then `FAKE_APPWRITE=1 npm run test:e2e:shell`
