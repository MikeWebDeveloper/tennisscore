# Project Status (Test Branch)

## Current Standing
- App upgraded to Next.js 15 + React 19 runtime
- Charts migrated to uPlot; Recharts removed
- Appwrite SDK usage optimized; real-time live sharing stabilized
- Soft delete for matches with 7-day retention implemented and back-compat fix
- First-load JS ~693 KB after bundle optimizations
- i18n: English and Czech fully supported

## Recently Completed
- Real-time routing and score updates on public live pages
- Bundle and dependency optimizations (icon imports, lazy libraries)
- Service worker and network resiliency improvements
- Image upload/crop for player profiles
- README refreshed and documentation organized

## In Progress
- Performance monitoring dashboards (web-vitals, memory, query analytics)
- Preview-only `test` branch deployment hygiene

## Next Up (Priority)
1. Strengthen React 19 compatibility
   - Remove any remaining experimental APIs
   - Add comprehensive error boundaries
2. Type safety hardening
   - Replace non-null assertions with proper guards
   - Unify score-related types and factories
3. Performance measurement accuracy
   - Add PerformanceObserver for paint/long-tasks
   - Track layout/paint/composite timing
4. PWA polish
   - Offline flows, cache strategy validation, install prompts
5. Database and query optimization
   - Review indexes, pagination, query costs

## Risks / Watchouts
- Incomplete render-time metrics can hide jank under load
- Optimistic/concurrent scoring must be conflict-safe with server state
- Service worker must not regress routing or auth

## Branch Policy
- `main`: production only
- `test`: previews only; never promote to production without approval

## How to Test Locally
- `npm run dev` then open http://localhost:3000
- Use `npm run perf:all` to run performance checks
- Run e2e: `npm run test:e2e`

---
Last updated: automated audit
