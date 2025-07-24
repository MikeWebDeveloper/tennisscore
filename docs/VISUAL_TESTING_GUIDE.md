# Visual Testing & Browser Debugging Guide

## Overview
This guide covers the enhanced visual testing and browser debugging capabilities for the Tennis Score app, including console error monitoring, screenshot comparison, and design compliance checking.

## Setup Completed

### 1. Browser Tools MCP Server ✅
- **Status**: Installed and connected
- **Features**:
  - Real-time console error capture
  - Automatic screenshots
  - Network monitoring
  - DOM inspection
  - Lighthouse audits (SEO, performance, accessibility)

### 2. Chrome Extension Installation 📁
The Browser Tools Chrome extension has been downloaded to:
```
/Users/michallatal/Desktop/tennisscore/browser-tools-chrome-extension/
```

**To install in Chrome:**
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `browser-tools-chrome-extension` folder
5. Pin the extension for easy access

### 3. Visual Regression Testing 🎯
Created enhanced Puppeteer scripts at:
- `__tests__/visual-regression.puppeteer.test.ts`
- `scripts/visual-compare.js`

## Usage Guide

### Starting the Browser Tools Server

Before using Browser Tools MCP, start the server:
```bash
npx @agentdeskai/browser-tools-server@latest
```
This runs on port 3025 by default.

### Using Browser Tools in Claude Code

1. **Capture Console Errors**
   ```
   "Check the browser console for errors on localhost:3000"
   ```

2. **Take Screenshots**
   ```
   "Take a screenshot of the dashboard page"
   ```

3. **Monitor Network**
   ```
   "Show me all API calls made on this page"
   ```

4. **Run Audits**
   ```
   "Run a Lighthouse audit on the homepage"
   ```

### Running Visual Regression Tests

1. **Run Puppeteer Visual Tests**
   ```bash
   npm run test:puppeteer -- __tests__/visual-regression.puppeteer.test.ts
   ```

2. **Compare Screenshots**
   ```bash
   node scripts/visual-compare.js
   ```
   This generates an HTML report showing visual differences.

### Visual Testing Workflow

```yaml
Development Workflow:
1. Start dev server: npm run dev
2. Start Browser Tools server: npx @agentdeskai/browser-tools-server@latest
3. Open Chrome with extension loaded
4. Open DevTools (right-click → Inspect)
5. Navigate to "BrowserTools" tab in DevTools
6. Console errors will now be captured by Claude Code
```

## Autonomous Testing Examples

### 1. Console Error Monitor Agent
```
"Monitor localhost:3000/dashboard continuously. When you detect any console 
errors, capture a screenshot, analyze the error, and suggest fixes. Store 
error patterns in Memory server for future reference."
```

### 2. Visual Regression Agent
```
"Run visual regression tests on all main pages (dashboard, matches, players). 
Compare with baseline screenshots and report any visual differences. If 
differences are found, analyze if they match our design system requirements."
```

### 3. Design Compliance Agent
```
"Check all pages for design system compliance:
- Primary color should be Electric Green (#39FF14)
- Font families: Satoshi for headings, Inter for body
- Dark mode should be consistent
Report any deviations with screenshots."
```

### 4. Performance Monitor Agent
```
"Every hour, run Lighthouse audits on key pages. Track performance metrics 
over time. Alert if any metric drops below:
- Performance: 90
- Accessibility: 95
- Best Practices: 90
- SEO: 85"
```

## Test Credentials
For authenticated testing:
- **Email**: michal.latal@yahoo.co.uk
- **Password**: Mikemike88

## Visual Baseline Management

### Creating Baselines
First run creates baseline screenshots automatically:
```bash
npm run test:puppeteer -- __tests__/visual-regression.puppeteer.test.ts
```

### Updating Baselines
To accept current screenshots as new baselines:
```bash
rm -rf __tests__/visual-baseline/*
npm run test:puppeteer -- __tests__/visual-regression.puppeteer.test.ts
```

### Viewing Differences
After running comparison:
```bash
open visual-comparison-report.html
```

## Directory Structure
```
__tests__/
├── visual-baseline/     # Baseline screenshots
├── visual-current/      # Current test run screenshots
├── visual-diff/         # Difference images (if ImageMagick installed)
└── visual-regression.puppeteer.test.ts

scripts/
└── visual-compare.js    # Comparison utility

browser-tools-chrome-extension/  # Chrome extension files
```

## Troubleshooting

### Browser Tools Not Connecting
1. Ensure server is running: `npx @agentdeskai/browser-tools-server@latest`
2. Check port 3025 is not in use
3. Restart Claude Code after adding MCP server
4. Make sure Chrome extension is installed and active

### Console Errors Not Captured
1. Open Chrome DevTools (F12)
2. Navigate to "BrowserTools" tab
3. Refresh the page
4. Errors should appear in Claude Code

### Screenshots Not Working
1. Check Puppeteer Chrome is installed: `npx puppeteer browsers install chrome`
2. Ensure directories have write permissions
3. Verify localhost:3000 is accessible

## Best Practices

1. **Regular Visual Testing**
   - Run visual tests before each deployment
   - Keep baselines updated with intentional changes
   - Document why baselines were updated

2. **Console Error Monitoring**
   - Fix console errors immediately
   - Track error patterns over time
   - Set up alerts for critical errors

3. **Design Consistency**
   - Regular design system audits
   - Screenshot all new features
   - Compare mobile and desktop views

4. **Performance Tracking**
   - Run Lighthouse audits daily
   - Track metrics over time
   - Optimize based on trends

## Next Steps

1. Install Chrome extension from `browser-tools-chrome-extension/`
2. Start Browser Tools server
3. Test console error capture
4. Run visual regression tests
5. Set up automated testing workflows

With these tools, you can now:
- See console errors in real-time through Claude Code
- Capture and compare screenshots automatically
- Monitor design compliance
- Track performance metrics
- Create powerful autonomous testing agents