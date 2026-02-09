import { withSentryConfig } from "@sentry/nextjs";
import withBundleAnalyzer from "@next/bundle-analyzer";

// Bundle analyzer - run with ANALYZE=true npm run build
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable turbopack to silence webpack warning
  // turbopack: {},
  experimental: {
    serverComponentsExternalPackages: ['ioredis'],
  },
  allowedDevOrigins: [
    'https://*.replit.dev',
    'https://*.janeway.replit.dev',
    'https://*.kirk.replit.dev',
    'https://*.spock.replit.dev',
    '127.0.0.1',
    'localhost',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    // NEVER ignore build errors in production
    // This ensures type safety is enforced
    ignoreBuildErrors: false,
  },

  // Increase static generation timeout for complex pages
  staticPageGenerationTimeout: 120,
  // Production performance optimizations
  productionBrowserSourceMaps: false,
  poweredByHeader: false,

  // Security headers - applied to all routes including static files
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), accelerometer=(), gyroscope=(), magnetometer=(), payment=(), usb=(), vr=()',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-site',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Origin-Agent-Cluster',
            value: '?1',
          },
        ],
      },
      // PHI endpoints - no caching
      {
        source: '/api/:path*(therapy-sessions|emergency-cards)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },

  // Webpack optimizations for code splitting
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Split large libraries into separate chunks
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Large npm packages
          zipcodes: {
            test: /[\\/]node_modules[\\/]zipcodes/,
            name: 'zipcodes',
            chunks: 'all',
            priority: 20,
          },
          // Other heavy libraries
          heavy: {
            test: /[\\/]node_modules[\\/](jspdf|html2canvas|recharts|framer-motion)[\\/]/,
            name: 'heavy-vendors',
            chunks: 'all',
            priority: 10,
          },
          // Default vendor chunk
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 1,
          },
        },
      };
    }
    return config;
  },
};

// Sentry configuration - only wrap if DSN is set
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,

  org: process.env.SENTRY_ORG || undefined,
  project: process.env.SENTRY_PROJECT || undefined,

  // Upload source maps
  sourcemaps: {
    assets: "./.next/static/**/*",
    ignore: ["./node_modules/**/*"],
  },

  // Auth token for source map upload (set in CI/CD)
  authToken: process.env.SENTRY_AUTH_TOKEN || undefined,
};

// Sentry options for Next.js SDK
const sentryOptions = {
  // Upload additional client files (increases upload size)
  widenClientFileUpload: true,

  // Transpile SDK to be compatible with Edge Runtime
  transpileClientSDK: true,

  // Route browser requests to Sentry through a Next.js rewrite (avoids ad-blockers)
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors
  automaticVercelMonitors: true,
};

// Apply bundle analyzer first
const withAnalyzer = bundleAnalyzer(nextConfig);

// Export with Sentry if DSN is configured, otherwise plain config with analyzer
export default process.env.SENTRY_DSN
  ? withSentryConfig(withAnalyzer, sentryWebpackPluginOptions, sentryOptions)
  : withAnalyzer;
