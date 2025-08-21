import createNextIntlPlugin from 'next-intl/plugin'

// This comment is added to force a new build on Vercel
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily disable ESLint during builds to check other issues
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons', 
      'lucide-react',
      'recharts',
      'framer-motion',
      'date-fns',
      '@tanstack/react-query',
      'zustand',
      'react-hook-form'
    ],
    serverActions: {
      bodySizeLimit: '12mb', // Increase limit for profile picture uploads (10MB + buffer)
    },
  },
  
  // Webpack optimizations for better tree shaking and splitting
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev && !isServer) {
      // Advanced tree shaking for Appwrite and other large packages
      config.resolve.alias = {
        ...config.resolve.alias,
        // Exclude full Appwrite SDK if using optimized version
        // 'appwrite': false,
        // 'node-appwrite': false,
      };

      // Production client-side optimizations
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          // Critical vendor chunk (smaller, for immediate loading)
          vendorCritical: {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'vendor-critical',
            priority: 30,
            chunks: 'all',
            enforce: true,
          },
          // UI frameworks chunk
          vendorUI: {
            test: /[\\/]node_modules[\\/](@radix-ui|framer-motion|lucide-react)[\\/]/,
            name: 'vendor-ui',
            priority: 25,
            chunks: 'all',
            reuseExistingChunk: true,
          },
          // Charts and visualization
          vendorCharts: {
            test: /[\\/]node_modules[\\/](recharts|d3-)[\\/]/,
            name: 'vendor-charts',
            priority: 24,
            chunks: 'all',
            reuseExistingChunk: true,
          },
          // Other vendor dependencies
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: 10,
            chunks: 'all',
            reuseExistingChunk: true,
          },
          // UI components chunk
          ui: {
            test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
            name: 'ui',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Features chunk
          features: {
            test: /[\\/]src[\\/]components[\\/]features[\\/]/,
            name: 'features',
            priority: 15,
            reuseExistingChunk: true,
          },
          // Tennis utilities chunk
          tennis: {
            test: /[\\/]src[\\/]lib[\\/]utils[\\/]tennis/,
            name: 'tennis',
            priority: 25,
            reuseExistingChunk: true,
          },
        },
      };
      
      // Advanced tree shaking optimizations
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      config.optimization.providedExports = true;
      
      // Minimize bundle size
      config.optimization.mangleExports = 'size';
      
      // Add module concatenation for better tree shaking
      config.optimization.concatenateModules = true;
    }
    
    return config;
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Image optimization configuration
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
    // This will help with CORS issues in some cases
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Generate static exports for better caching
  output: 'standalone',
  
  // Custom headers for caching and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        // Cache static assets for 1 year
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache icons and images for 1 month
        source: '/icons/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000',
          },
        ],
      },
      {
        // Service worker should never be cached
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        // Manifest can be cached for a day
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
  
  // Custom rewrites for service worker
  async rewrites() {
    return [
      {
        source: '/sw.js',
        destination: '/sw.js',
      },
    ]
  },
};

export default withNextIntl(nextConfig);