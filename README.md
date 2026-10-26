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
- **Doubles**: four players, the serving partner is shown and can be chosen (recorded per point, no schema change)
- **Offline-safe saving**: retried saves, persisted in-progress match, "Saved / Saving / Not sent" indicator with automatic retry
- Screen stays awake while scoring (Screen Wake Lock)
- Live sharing with a public link, plus a shareable PNG **score card**
- PWA: network-first service worker (no stale pages after deploys), install button (Android) / Add-to-Home-Screen hint (iPhone)
- Player profiles with image upload/crop, statistics, soft delete (7-day retention)
- Performance: first load ~200 KB (dashboard) / ~275 KB (live scoring), enforced by a CI bundle budget
- Tests: unit tests (scoring engine, doubles rotation, sync, share card, i18n keys), Playwright shell tests, CI (types, tests, build, budget)

### 🚧 In Development
- Complete chart migration to uPlot across all views
- Performance monitoring (web-vitals, dashboards)
- Enhanced dashboard with analytics widgets

### 📋 Planned
- Match setup screen option for "who serves first" in doubles (currently chosen on the scoring screen)
- More formats (Fast4, pro set) once the exact rules are confirmed against the ITF text
- Lighter read-only spectator page (cached polling instead of one live connection per viewer)
- IndexedDB outbox with idempotent client IDs (today: persisted store + full-snapshot sync)
- Practice session tracking, social features

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Appwrite Cloud account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tennisscore
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Update `.env.local` with your Appwrite configuration:
```bash
# Public Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT=your-project-id

# Database Configuration
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
NEXT_PUBLIC_APPWRITE_PLAYERS_COLLECTION_ID=players-collection-id
NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID=matches-collection-id

# Server-only Appwrite Configuration
APPWRITE_API_KEY=your-secret-api-key
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_PLAYERS_COLLECTION_ID=players-collection-id
APPWRITE_MATCHES_COLLECTION_ID=matches-collection-id
APPWRITE_PROFILE_PICTURES_BUCKET_ID=profile-pictures-bucket-id
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── [locale]/         # Localized routes (next-intl)
│   ├── live/[matchId]/   # Public live sharing
│   └── layout.tsx
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── features/         # Feature-specific components
│   └── layout/           # Layout components
├── lib/
│   ├── appwrite/         # Appwrite clients and helpers
│   ├── actions/          # Server Actions
│   └── utils.ts
├── stores/               # Zustand stores
│   ├── userStore.ts
│   └── matchStore.ts
└── hooks/                # Custom React hooks
```

## Design System

### Typography
- **Primary Font**: Satoshi (headings, UI)
- **Secondary Font**: Inter (body, data)
- **Monospace**: JetBrains Mono (scores, stats)

### Colors
- **Theme**: Dark mode first with light mode support
- **Primary**: Electric Green (#39FF14)
- **Neutrals**: Slate scale (slate-950 to slate-200)

### Animation
- Page transitions with Framer Motion
- Micro-interactions for all buttons
- Staggered animations for lists
- Smooth score updates

## Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler
- `npm run perf:all` - Analyze and audit performance

### Code Style
- TypeScript for type safety
- ESLint for code quality
- shadcn/ui component patterns
- Server Components by default
- Client Components for interactivity

## Branches & Deployments

- `main`: Production. Deploys to production domain on Vercel.
- `test`: Preview. Used for testing; generates preview URLs only.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please open an issue on GitHub or contact the development team.

---

Built with ❤️ for the tennis community

## Testing

- `npm test` – unit tests (scoring engine, service-worker caching strategy)
- `npm run test:e2e:shell` – Playwright tests for the app shell (mobile/desktop layout, themes, shortcuts).
  Needs a running production build with the test auth bypass:
  `PLAYWRIGHT=1 DISABLE_AUTH_FOR_TEST=1 npm run build && npx next start -p 3100`
