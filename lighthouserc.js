module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/en/dashboard',
        'http://localhost:3000/en/matches',
        'http://localhost:3000/en/players',
        'http://localhost:3000/en/statistics',
        'http://localhost:3000/en/matches/new',
      ],
      startServerCommand: 'npm run build && npm start',
      startServerReadyPattern: 'Ready in',
      startServerReadyTimeout: 45000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless --disable-dev-shm-usage',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        }
      }
    },
    budgets: 'performance-budget.json',
    assert: {
      assertions: {
        // Core Web Vitals - Tennis App Optimized
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'interaction-to-next-paint': ['error', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1200 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        'speed-index': ['warn', { maxNumericValue: 2000 }],
        
        // Resource budgets for tennis app
        'resource-summary:script:size': ['error', { maxNumericValue: 400000 }], // 400KB
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 30000 }], // 30KB
        'resource-summary:document:size': ['warn', { maxNumericValue: 18000 }], // 18KB
        'resource-summary:font:size': ['warn', { maxNumericValue: 80000 }], // 80KB
        'resource-summary:image:size': ['warn', { maxNumericValue: 200000 }], // 200KB
        
        // Tennis-specific performance optimizations
        'unused-javascript': ['warn', { maxNumericValue: 50000 }],
        'render-blocking-resources': ['warn', { maxNumericValue: 200 }],
        'efficient-animated-content': 'error',
        'uses-responsive-images': 'error',
        'modern-image-formats': 'warn',
        'uses-optimized-images': 'warn',
        'preload-lcp-image': 'warn',
        'uses-rel-preconnect': 'warn',
        
        // PWA requirements for tennis scoring
        'installable-manifest': 'warn',
        'service-worker': 'warn',
        'works-offline': 'warn',
        
        // Accessibility for sports applications
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'valid-lang': 'error',
        'focus-traps': 'warn',
        'focusable-controls': 'error',
        
        // i18n and SEO optimization
        'hreflang': 'warn',
        'canonical': 'warn',
        'meta-description': 'warn',
        
        // Category thresholds
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        
        // Bundle optimization for real-time features
        'total-byte-weight': ['warn', { maxNumericValue: 1400000 }], // 1.4MB
        'dom-size': ['warn', { maxNumericValue: 1200 }],
        'third-party-summary': ['warn', { maxNumericValue: 100000 }] // 100KB
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};