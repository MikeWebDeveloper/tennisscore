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
- Authentication (signup/signin/signout)
- Internationalization: English + Czech
- Player profiles with image upload/crop
- Live match scoring with real-time sharing (public route)
- Soft delete for matches (7‑day retention)
- Performance optimizations (first load ~693 KB)
- Framer Motion animations (LazyMotion)
- Protected routes with middleware
- TypeScript + ESLint

### 🚧 In Development
- Complete chart migration to uPlot across all views
- Performance monitoring (web‑vitals, budgets, dashboards)
- Database and query optimization
- PWA polish (offline flows, caching strategy)
- Enhanced dashboard with analytics widgets

### 📋 Planned
- Advanced statistics visualization
- Doubles scoring
- Practice session tracking
- Social features

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
