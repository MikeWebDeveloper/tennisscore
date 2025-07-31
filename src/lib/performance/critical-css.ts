/**
 * Critical CSS Management
 * Optimizes CSS delivery for faster First Contentful Paint
 */

export interface CriticalCSSConfig {
  inlineThreshold: number // Size in bytes under which CSS should be inlined
  deferNonCritical: boolean
  extractCriticalPath: boolean
  optimizeFonts: boolean
}

const DEFAULT_CONFIG: CriticalCSSConfig = {
  inlineThreshold: 14 * 1024, // 14KB - recommended TCP slow start
  deferNonCritical: true,
  extractCriticalPath: true,
  optimizeFonts: true,
}

/**
 * Critical CSS utilities for tennis scoring app
 */
export class CriticalCSSManager {
  private config: CriticalCSSConfig

  constructor(config: Partial<CriticalCSSConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Get critical CSS for above-the-fold content
   */
  getCriticalCSS(): string {
    return `
      /* Critical CSS for tennis scoring app */
      
      /* Reset and base styles */
      *,*::before,*::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}
      html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";font-feature-settings:normal;font-variation-settings:normal}
      body{margin:0;line-height:inherit;color:#0a0a0a;background-color:#0a0a0a}
      
      /* Critical layout components */
      .app-shell{display:flex;flex-direction:column;min-height:100vh;background:#0a0a0a}
      .main-content{flex:1;padding:1rem}
      .scoreboard{background:#1a1a1a;border-radius:0.75rem;padding:1.5rem;margin-bottom:1rem}
      .score-display{font-family:JetBrains Mono,monospace;font-size:2.25rem;font-weight:700;color:#39ff14;text-align:center}
      .player-names{display:flex;justify-content:space-between;margin-bottom:1rem;color:#ffffff}
      .action-buttons{display:flex;gap:0.75rem;margin-top:1rem}
      .btn-primary{background:#39ff14;color:#0a0a0a;border:none;border-radius:0.5rem;padding:0.75rem 1.5rem;font-weight:600;cursor:pointer;transition:all 0.15s ease}
      .btn-primary:hover{background:#2dd10c;transform:scale(1.02)}
      
      /* Mobile-first navigation */
      .mobile-nav{position:fixed;bottom:0;left:0;right:0;background:#1a1a1a;border-top:1px solid #333;display:flex;z-index:50}
      @media (min-width:768px){.mobile-nav{display:none}}
      .nav-item{flex:1;padding:0.75rem;text-align:center;color:#888;border:none;background:transparent;cursor:pointer}
      .nav-item.active{color:#39ff14}
      
      /* Loading states */
      .skeleton{background:#333;border-radius:0.25rem;animation:pulse 2s cubic-bezier(0.4,0,0.6,1) infinite}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      
      /* Error boundary */
      .error-boundary{padding:2rem;text-align:center;color:#ef4444}
      .error-message{font-size:1.125rem;margin-bottom:1rem}
      .error-details{font-family:monospace;font-size:0.875rem;color:#888;background:#1a1a1a;padding:1rem;border-radius:0.5rem;text-align:left;overflow-x:auto}
      
      /* Tennis-specific styles */
      .tennis-court{background:linear-gradient(135deg,#2d5016,#4a7c59);border-radius:1rem;padding:2rem;position:relative;overflow:hidden}
      .court-lines{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:80%;height:60%;border:2px solid #ffffff;opacity:0.3}
      .court-lines::before{content:'';position:absolute;top:50%;left:0;right:0;height:2px;background:#ffffff;transform:translateY(-50%)}
      .momentum-bar{height:0.5rem;background:#333;border-radius:0.25rem;overflow:hidden;margin:0.5rem 0}
      .momentum-fill{height:100%;background:linear-gradient(90deg,#ef4444,#f97316,#eab308,#22c55e,#39ff14);transition:width 0.3s ease;border-radius:0.25rem}
      
      /* Performance optimizations */
      .lazy-load{opacity:0;transition:opacity 0.3s ease}
      .lazy-load.loaded{opacity:1}
      .will-change-transform{will-change:transform}
      .gpu-accelerated{transform:translateZ(0)}
      
      /* Dark mode variables */
      :root{
        --bg-primary:#0a0a0a;
        --bg-secondary:#1a1a1a;
        --bg-tertiary:#2a2a2a;
        --text-primary:#ffffff;
        --text-secondary:#cccccc;
        --text-muted:#888888;
        --accent-primary:#39ff14;
        --accent-secondary:#2dd10c;
        --border-color:#333333;
        --error-color:#ef4444;
        --warning-color:#f59e0b;
        --success-color:#10b981;
      }
    `
  }

  /**
   * Get font preload links for critical fonts
   */
  getFontPreloads(): string[] {
    return [
      '<link rel="preload" href="/fonts/satoshi-variable.woff2" as="font" type="font/woff2" crossorigin>',
      '<link rel="preload" href="/fonts/inter-variable.woff2" as="font" type="font/woff2" crossorigin>',
      '<link rel="preload" href="/fonts/jetbrains-mono-variable.woff2" as="font" type="font/woff2" crossorigin>',
    ]
  }

  /**
   * Get CSS for font loading optimization
   */
  getFontCSS(): string {
    return `
      /* Font loading optimization */
      @font-face {
        font-family: 'Satoshi';
        src: url('/fonts/satoshi-variable.woff2') format('woff2');
        font-weight: 300 900;
        font-style: normal;
        font-display: swap;
      }
      
      @font-face {
        font-family: 'Inter';
        src: url('/fonts/inter-variable.woff2') format('woff2');
        font-weight: 100 900;
        font-style: normal;
        font-display: swap;
      }
      
      @font-face {
        font-family: 'JetBrains Mono';
        src: url('/fonts/jetbrains-mono-variable.woff2') format('woff2');
        font-weight: 100 800;
        font-style: normal;
        font-display: swap;
      }
      
      /* Fallback fonts to prevent layout shift */
      .font-satoshi { font-family: 'Satoshi', ui-sans-serif, system-ui, sans-serif; }
      .font-inter { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
      .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
    `
  }

  /**
   * Get non-critical CSS that can be deferred
   */
  getNonCriticalSelectors(): string[] {
    return [
      '.animation-*',
      '.transition-*',
      '.hover:*',
      '.focus:*',
      '.dark:*',
      '.lg:*',
      '.xl:*',
      '.2xl:*',
      '.print:*',
      '.motion-reduce:*',
      '.motion-safe:*',
    ]
  }

  /**
   * Generate CSS for lazy loading images
   */
  getLazyLoadCSS(): string {
    return `
      /* Lazy loading optimization */
      img[loading="lazy"] {
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      img[loading="lazy"].loaded {
        opacity: 1;
      }
      
      /* Intersection observer fallback */
      .lazy-image {
        background-color: #333;
        background-image: linear-gradient(90deg, #333 25%, #555 50%, #333 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      .lazy-image.loaded {
        background: none;
        animation: none;
      }
    `
  }

  /**
   * Get CSS for reduced motion preferences
   */
  getReducedMotionCSS(): string {
    return `
      /* Respect user motion preferences */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
        
        .momentum-fill,
        .score-animation,
        .court-animation {
          transition: none !important;
          animation: none !important;
        }
      }
    `
  }

  /**
   * Generate complete critical CSS bundle
   */
  generateCriticalBundle(): string {
    const components = [
      this.getCriticalCSS(),
      this.getFontCSS(),
      this.getLazyLoadCSS(),
      this.getReducedMotionCSS(),
    ]

    return components.join('\n')
  }

  /**
   * Check if CSS should be inlined based on size
   */
  shouldInlineCSS(cssContent: string): boolean {
    const sizeInBytes = new TextEncoder().encode(cssContent).length
    return sizeInBytes <= this.config.inlineThreshold
  }

  /**
   * Generate link preload for non-critical CSS
   */
  generateNonCriticalPreload(href: string): string {
    return `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">`
  }

  /**
   * Generate performance hints for the browser
   */
  getPerformanceHints(): string[] {
    return [
      '<link rel="dns-prefetch" href="//fonts.googleapis.com">',
      '<link rel="dns-prefetch" href="//cloud.appwrite.io">',
      '<link rel="preconnect" href="https://cloud.appwrite.io">',
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
      '<meta name="theme-color" content="#39ff14">',
      '<meta name="color-scheme" content="dark">',
    ]
  }
}

// Singleton instance
export const criticalCSSManager = new CriticalCSSManager()

// React integration
export function useCriticalCSS() {
  return {
    getCriticalCSS: () => criticalCSSManager.generateCriticalBundle(),
    getFontPreloads: () => criticalCSSManager.getFontPreloads(),
    getPerformanceHints: () => criticalCSSManager.getPerformanceHints(),
    shouldInline: (css: string) => criticalCSSManager.shouldInlineCSS(css),
  }
}