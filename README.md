# TennisScore 🎾

Professional tennis scoring and analytics platform - Your digital tennis companion.

## Overview

TennisScore is a modern web application for tennis scoring, statistics tracking, and real-time match sharing. The app targets competitive junior players and coaches, providing professional-grade statistical analysis with an elegant, intuitive user experience.

## Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **BaaS**: Appwrite Cloud
- **Authentication**: Appwrite Auth (Email/Password)
- **Database**: Appwrite Databases
- **Storage**: Appwrite Storage
- **Real-time**: Appwrite Realtime

### Deployment
- **Hosting**: Vercel
- **Domain**: tenscr.app

## Features

### ✅ Implemented
- User authentication (signup/signin/signout)
- Dark mode first design with Electric Green primary color
- Responsive design (mobile-first)
- Modern UI with shadcn/ui components
- Framer Motion animations
- Protected routes with middleware
- TypeScript support

### 🚧 In Development
- Player management
- Live match scoring
- Real-time match sharing
- Dashboard with Bento Grid layout
- Performance analytics with charts
- Photo and comment sharing

### 📋 Planned
- Advanced statistics visualization
- PWA support
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
│   ├── (auth)/           # Auth pages (login, signup)
│   ├── (app)/            # Authenticated app pages
│   │   ├── dashboard/
│   │   └── matches/
│   ├── live/[matchId]/   # Public live sharing
│   └── layout.tsx
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── features/         # Feature-specific components
│   └── layout/           # Layout components
├── lib/
│   ├── appwrite-client.ts
│   ├── appwrite-server.ts
│   ├── auth.ts
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

### Code Style
- TypeScript for type safety
- ESLint for code quality
- shadcn/ui component patterns
- Server Components by default
- Client Components for interactivity

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
