#!/bin/bash

echo "=== Emergency Redirect Loop Fix ==="
echo ""

# 1. Clear all caches and build artifacts
echo "1. Clearing build artifacts and caches..."
rm -rf .next .vercel

# 2. Clear npm cache
echo "2. Clearing npm cache..."
npm cache clean --force

# 3. Reinstall dependencies
echo "3. Reinstalling dependencies..."
rm -rf node_modules package-lock.json
npm install

# 4. Run debug script
echo "4. Running configuration check..."
node scripts/debug-redirect-loop.js

# 5. Build the project
echo ""
echo "5. Building project..."
npm run build

# 6. Deploy instructions
echo ""
echo "=== Next Steps ==="
echo "1. Clear ALL browser data for test.tenis.click"
echo "2. Deploy with: vercel --force"
echo "3. Test with curl first:"
echo "   curl -I https://test.tenis.click/test-static.html"
echo "   curl -I https://test.tenis.click"
echo "4. Then test in incognito/private browsing mode"
echo ""
echo "If issues persist after these steps, the problem is likely at the infrastructure level (Vercel/DNS/CDN)."