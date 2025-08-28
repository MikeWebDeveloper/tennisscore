import createNextIntlPlugin from 'next-intl/plugin'

// Build system optimization - Force new build with enhanced performance
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build quality checks enabled
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Experimental features compatible with Next.js 14
  experimental: {
    serverActions: {
      bodySizeLimit: '12mb', // Profile picture upload optimization
    },
  },
  
  // Enhanced webpack configuration for build performance
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Development optimizations
    if (dev) {
      // Enable faster refresh in development
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
      
      // Reduce memory usage during development
      config.optimization.removeAvailableModules = false;
      config.optimization.removeEmptyChunks = false;
      config.optimization.splitChunks = false;
    }
    
    // Production optimizations
    if (!dev && !isServer) {
      // Enhanced tree shaking configuration
      config.resolve.alias = {
        ...config.resolve.alias,
        // Remove unused Appwrite modules
        'node-appwrite': false, // Use client-side only
      };

      // Advanced code splitting strategy
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        maxAsyncRequests: 30,
        maxInitialRequests: 25,
        automaticNameDelimiter: '-',
        cacheGroups: {
          // Critical framework chunk (highest priority)
          frameworkCritical: {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'framework-critical',
            priority: 40,
            chunks: 'all',
            enforce: true,
          },
          // UI library chunk
          uiLibraries: {
            test: /[\\/]node_modules[\\/](@radix-ui|framer-motion|lucide-react)[\\/]/,
            name: 'ui-libraries',
            priority: 35,
            chunks: 'all',
            reuseExistingChunk: true,
          },
          // Data visualization chunk
          dataViz: {
            test: /[\\/]node_modules[\\/](uplot|d3-)[\\/]/,
            name: 'data-viz',
            priority: 30,
            chunks: 'all',
            reuseExistingChunk: true,
          },
          // State management chunk
          stateManagement: {
            test: /[\\/]node_modules[\\/](zustand|@tanstack\/react-query)[\\/]/,
            name: 'state-management',
            priority: 28,
            chunks: 'all',
            reuseExistingChunk: true,
          },
          // Utilities chunk
          utilities: {
            test: /[\\/]node_modules[\\/](date-fns|clsx|class-variance-authority)[\\/]/,
            name: 'utilities',
            priority: 25,
            chunks: 'all',
            reuseExistingChunk: true,
          },
          // Application UI components
          appUI: {
            test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
            name: 'app-ui',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Application features
          appFeatures: {
            test: /[\\/]src[\\/]components[\\/]features[\\/]/,
            name: 'app-features',
            priority: 18,
            reuseExistingChunk: true,
          },
          // Tennis-specific logic
          tennisCore: {
            test: /[\\/]src[\\/]lib[\\/]utils[\\/]tennis/,
            name: 'tennis-core',
            priority: 22,
            reuseExistingChunk: true,
          },
          // Default vendor chunk
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: 10,
            chunks: 'all',
            reuseExistingChunk: true,
          },
        },
      };
      
      // Advanced tree shaking optimizations
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      config.optimization.providedExports = true;
      config.optimization.mangleExports = 'size';
      config.optimization.concatenateModules = true;
      
      // Memory optimization
      config.optimization.mergeDuplicateChunks = true;
      config.optimization.flagIncludedChunks = true;
    }
    
    return config;
  },
  
  // Production compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Optimized image configuration for Appwrite
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fra.cloud.appwrite.io',
        port: '',
        pathname: '/v1/storage/buckets/**',
      },
      {
        protocol: 'https',
        hostname: 'cloud.appwrite.io',
        port: '',
        pathname: '/v1/storage/buckets/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Performance optimization
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    loader: 'default', // Ensures server-side processing
    unoptimized: false, // Force optimization on server
  },
  
  // Standalone output for optimal production deployment
  output: 'standalone',
  
  // Comprehensive security and performance-focused headers
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Build Content Security Policy for production security
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fra.cloud.appwrite.io https://cloud.appwrite.io https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://fra.cloud.appwrite.io https://cloud.appwrite.io https://vercel.com",
      "connect-src 'self' https://fra.cloud.appwrite.io https://cloud.appwrite.io https://vercel.live wss: ws:",
      "media-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "frame-src 'none'",
      "upgrade-insecure-requests"
    ].join('; ');
    
    return [
      // Comprehensive security headers for all routes
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy - XSS protection
          {
            key: 'Content-Security-Policy',
            value: isProduction ? csp : "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: *; connect-src *;",
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // XSS Protection (legacy browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer policy for privacy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // HSTS - Force HTTPS in production
          ...(isProduction ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          }] : []),
          // Permissions Policy - Limit browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          // Additional security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
        ],
      },
      // API routes security
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // API rate limiting headers
          {
            key: 'X-RateLimit-Limit',
            value: '100',
          },
          {
            key: 'X-RateLimit-Remaining',
            value: '100',
          },
        ],
      },
      // Aggressive static asset caching
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Icon caching with CDN optimization
      {
        source: '/icons/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000',
          },
        ],
      },
      // Service worker no-cache (important for updates)
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      // Manifest caching
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ]
  },
  
  // Service worker rewrites
  async rewrites() {
    return [
      {
        source: '/sw.js',
        destination: '/sw.js',
      },
    ]
  },
  
  // Build-time optimizations
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  
  // Output configuration
  // outputFileTracingRoot removed - not supported in Next.js 14
  
  // Performance monitoring
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default withNextIntl(nextConfig);