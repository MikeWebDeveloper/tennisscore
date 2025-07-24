# ERR_TOO_MANY_REDIRECTS Fix Guide

## Summary of Changes Made

1. **Removed `output: 'standalone'` from next.config.mjs**
   - This mode is incompatible with Vercel's serverless platform
   - Was causing static files to return 404 errors

2. **Updated middleware matcher to exclude all static files**
   - Added pattern to exclude any file with an extension
   - Prevents middleware from interfering with static assets

3. **Added error handling to root page redirect**
   - Prevents potential infinite loops if auth check fails
   - Logs errors for debugging

4. **Created debugging tools**
   - `scripts/debug-redirect-loop.js` - Run to check configuration
   - `public/test-static.html` - Test static file serving

## Deployment Steps

### 1. Clear All Caches

```bash
# Clear local build cache
rm -rf .next

# Clear Vercel cache
vercel --force

# Build locally to test
npm run build
```

### 2. Test Locally

```bash
# Start production server locally
npm run start

# Test these URLs:
# http://localhost:3000
# http://localhost:3000/test-static.html
# http://localhost:3000/manifest.json
```

### 3. Deploy to Vercel

```bash
# Deploy to preview
vercel

# If preview works, deploy to production
vercel --prod
```

### 4. Post-Deployment Verification

1. **Clear Browser Data**
   - Clear all cookies for test.tenis.click
   - Clear browser cache
   - Try incognito/private mode

2. **Test URLs**
   - https://test.tenis.click/test-static.html (should show static test page)
   - https://test.tenis.click/manifest.json (should return JSON)
   - https://test.tenis.click (should redirect to /login or /dashboard)

3. **Use curl for debugging** (bypasses browser cache):
   ```bash
   # Check redirect headers
   curl -I https://test.tenis.click
   curl -I https://test.tenis.click/login
   curl -I https://test.tenis.click/test-static.html
   ```

## If Issues Persist

### 1. Check Vercel Dashboard
- Go to your Vercel dashboard
- Check deployment logs for build errors
- Verify environment variables are set correctly

### 2. DNS/CDN Issues
- If using Cloudflare, ensure SSL mode is set to "Full"
- Check for any redirect rules at DNS/CDN level

### 3. Nuclear Option - Full Reset
```bash
# Remove all build artifacts
rm -rf .next .vercel node_modules

# Reinstall dependencies
npm install

# Deploy fresh
vercel --force --prod
```

### 4. Temporary Workaround
If redirects still occur, you can temporarily disable ALL redirects:

1. Keep middleware bypassed (already done)
2. Update root page.tsx to show a simple link page instead of redirecting
3. Update login page to not redirect authenticated users

## Monitoring

After deployment, monitor for:
- Check browser console for errors
- Check network tab for redirect chains
- Monitor Vercel function logs for errors

## Root Cause Analysis

The issue was caused by:
1. `output: 'standalone'` incompatibility with Vercel
2. Static files (manifest.json, _next chunks) returning 404
3. This triggered fallback behavior causing redirect loops
4. Browser cache retained corrupted state from previous deployments

## Prevention

To prevent future issues:
1. Don't use `output: 'standalone'` on Vercel
2. Always test with cleared cache after deployment
3. Use comprehensive middleware matchers
4. Add error boundaries around auth checks