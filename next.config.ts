import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    allowedDevOrigins: [
      'https://6000-firebase-studio-1748751800187.cluster-jbb3mjctu5cbgsi6hwq6u4btwe.cloudworkstations.dev',
      'localhost:9002',
      '192.168.100.188:9002', // Current IP
      '172.20.10.2:9002', // New Local IP
      '0.0.0.0:9002',
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: [
    '@capacitor/browser',
    '@capacitor/haptics',
    '@capacitor/core',
    '@capacitor/app',
    'capacitor-plugin-app-tracking-transparency',
  ],
};

export default nextConfig;
