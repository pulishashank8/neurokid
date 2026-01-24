import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: Turbopack disabled via environment variable TURBOPACK=0
  // Next.js 16.1.2 has worker stability issues with Turbopack

  productionBrowserSourceMaps: true,
  webpack: (config, { webpack }) => {
    // Completely ignore jsdom/canvas imports on server
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(jsdom|canvas|bufferutil|utf-8-validate)$/,
      })
    );
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
  // @ts-expect-error
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
