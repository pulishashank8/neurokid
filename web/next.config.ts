import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: Turbopack disabled via environment variable TURBOPACK=0
  // Next.js 16.1.2 has worker stability issues with Turbopack

  productionBrowserSourceMaps: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      jsdom: false,
      'isomorphic-dompurify': false,
    };
    return config;
  },

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
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
