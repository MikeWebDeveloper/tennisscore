# Test Branch Reset and Migration Workflow

## Overview
This document outlines the step-by-step process for resetting the test branch and migrating improvements from the current implementation to a clean, stable base.

## Phase 1: Preservation and Documentation (Day 1)

### 1.1 Backup Current Work
- [x] Create backup branch `test-backup-2025-01-24`
- [x] Push backup to remote
- [ ] Verify backup is complete with `git log`
- [ ] **TEST**: Confirm all commits are preserved

### 1.2 Document Features to Migrate
- [ ] Create `FEATURES_TO_MIGRATE.md`
- [ ] List all UI improvements
  - [ ] New dashboard bento grid layout
  - [ ] Enhanced statistics visualizations
  - [ ] Improved player profiles
- [ ] Document i18n enhancements
  - [ ] Better Czech translations
  - [ ] Locale switching improvements
- [ ] Note statistics page changes
- [ ] Identify critical bug fixes
- [ ] **TEST**: Review with `git diff main..test`

### 1.3 Extract Key Improvements
- [ ] Create temp directory: `mkdir ~/Desktop/tennisscore-improvements`
- [ ] Copy improved components
  ```bash
  cp -r src/app/(app)/dashboard ~/Desktop/tennisscore-improvements/
  cp -r src/app/(app)/statistics ~/Desktop/tennisscore-improvements/
  ```
- [ ] Save enhanced translations
- [ ] Archive visual test setups
- [ ] Document configuration changes
- [ ] **TEST**: Verify all files are readable

## Phase 2: Clean Start (Day 1-2)

### 2.1 Create Fresh Branch
- [ ] Checkout main branch: `git checkout main`
- [ ] Pull latest changes: `git pull origin main`
- [ ] Create new branch: `git checkout -b fix-redirect-clean`
- [ ] **TEST**: Verify clean state with `git status`

### 2.2 Core Authentication Fixes
- [ ] Add SESSION_SECRET validation in `src/lib/session.ts`
  ```typescript
  const sessionSecret = process.env.SESSION_SECRET
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET environment variable is not set")
  }
  ```
- [ ] Update cookie configuration (sameSite: lax)
- [ ] Keep middleware simple (no redirect loop detection)
- [ ] **TEST**: Run `npm run build`
- [ ] **TEST**: Login/logout flow works locally
- [ ] **TEST**: No redirect loops on root page

### 2.3 Essential Error Handling
- [ ] Create `/auth-error` page
- [ ] Create `/clear-session` utility page
- [ ] Add basic error boundaries
- [ ] **TEST**: Error pages render correctly
- [ ] **TEST**: Session clearing works
- [ ] **TEST**: Build passes without errors

### 2.4 First Deployment Check
- [ ] Commit core fixes: `git add . && git commit -m "fix: core authentication and session handling"`
- [ ] Push to origin: `git push origin fix-redirect-clean`
- [ ] Deploy to Vercel preview
- [ ] **TEST**: Preview URL loads without redirect loops
- [ ] **TEST**: Authentication works on preview
- [ ] **TEST**: Check browser console for errors
- [ ] **TEST**: Test on mobile Safari

## Phase 3: Progressive Enhancement (Day 2-3)

### 3.1 Dashboard Improvements
- [ ] Port new dashboard layout from backup
- [ ] Add bento grid components
- [ ] Update styling and animations
- [ ] **TEST**: Dashboard loads correctly
- [ ] **TEST**: Responsive design works
- [ ] **TEST**: No performance regression
- [ ] **TEST**: Deploy and verify on preview

### 3.2 Statistics Enhancements
- [ ] Port improved statistics pages
- [ ] Add new chart components
- [ ] Update data calculations
- [ ] **TEST**: Statistics load properly
- [ ] **TEST**: Charts render correctly
- [ ] **TEST**: Data accuracy maintained
- [ ] **TEST**: Mobile view works

### 3.3 i18n Improvements
- [ ] Port enhanced translations
- [ ] Update locale handling
- [ ] Add missing translation keys
- [ ] **TEST**: Language switching works
- [ ] **TEST**: All text properly translated
- [ ] **TEST**: No missing translation keys
- [ ] **TEST**: Persists across sessions

## Phase 4: Testing and Stabilization (Day 3-4)

### 4.1 Comprehensive Testing
- [ ] Run full authentication flow test
  - [ ] Sign up new user
  - [ ] Login/logout cycles
  - [ ] Password reset flow
- [ ] Test all main features
  - [ ] Create new match
  - [ ] Live scoring
  - [ ] Statistics generation
  - [ ] Player management
- [ ] Check mobile responsiveness
- [ ] Verify PWA functionality
- [ ] **TEST**: Create comprehensive test checklist
- [ ] **TEST**: Document any issues found

### 4.2 Performance Optimization
- [ ] Check bundle sizes: `npm run build`
- [ ] Optimize images and assets
- [ ] Review service worker strategy
- [ ] **TEST**: Run Lighthouse audit
- [ ] **TEST**: Page load times < 3s
- [ ] **TEST**: First contentful paint < 1.5s
- [ ] **TEST**: No memory leaks

### 4.3 Final Review
- [ ] Code review all changes
- [ ] Update CLAUDE.md documentation
- [ ] Create migration notes
- [ ] **TEST**: Fresh install works
- [ ] **TEST**: Existing users unaffected
- [ ] **TEST**: All environment variables documented

## Phase 5: Deployment (Day 4)

### 5.1 Pre-deployment Checks
- [ ] All tests passing
- [ ] No console errors in production build
- [ ] Environment variables verified in Vercel
- [ ] Create database backup
- [ ] **TEST**: Preview deployment stable for 24h
- [ ] **TEST**: Load test with multiple concurrent users

### 5.2 Production Deployment
- [ ] Create PR from `fix-redirect-clean` to `main`
- [ ] Get approval (double-check required)
- [ ] Merge to main
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] **TEST**: Production smoke tests
- [ ] **TEST**: Monitor for 2 hours post-deployment

## Testing Checkpoints

**After EVERY code change:**
```bash
npm run build
npm run lint
```

**After EVERY feature:**
- Test locally with `npm run dev`
- Check browser console
- Test on different browsers

**After EVERY phase:**
- Deploy to preview
- Test on real devices
- Get user feedback if possible

**Before production:**
- 24-hour stability test on preview
- Full regression test
- Performance benchmarks

## Rollback Plan

### If issues found during development:
```bash
git stash
git checkout main
git pull origin main
```

### If issues found after deployment:
1. Immediate rollback: Revert in Vercel dashboard
2. Code rollback:
   ```bash
   git checkout main
   git reset --hard <last-stable-commit>
   git push --force origin main
   ```
3. Notify team of rollback
4. Investigate issue in test environment

## Success Criteria
- [ ] No redirect loops
- [ ] Authentication works reliably
- [ ] All core features functional
- [ ] Performance metrics maintained
- [ ] No console errors
- [ ] Positive user feedback

## Notes
- Always test on preview before production
- Keep commits small and focused
- Document any deviations from plan
- Communicate progress regularly