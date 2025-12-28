
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    allowedDevOrigins: [
      'https://6000-firebase-studio-1748751800187.cluster-jbb3mjctu5cbgsi6hwq6u4btwe.cloudworkstations.dev',
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
   async redirects() {
    return [
      // This is a temporary redirect for the Fitbit integration until a dedicated UI is built.
      // It redirects the user from the root to the Fitbit auth flow.
      // We can remove this later.
      // {
      //   source: '/connect-fitbit-redirect',
      //   destination: '/api/fitbit/auth',
      //   permanent: false,
      // },
    ]
  },
  webpack: (config, { isServer }) => {
    // Enable polling for file watching, which is necessary in some Docker/containerized environments
    if (!isServer) {
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 200, // delay before rebuilding
      };
    }
    return config;
  },
};

export default nextConfig;
