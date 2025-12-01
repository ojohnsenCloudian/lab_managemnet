import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: [
    '@prisma/client',
    'prisma',
    'ssh2',
  ],
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore to see if this is the issue
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore ESLint errors
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const originalExternals = config.externals;
      config.externals = [
        ...(Array.isArray(originalExternals) ? originalExternals : [originalExternals]),
        ({ request }: { request?: string }) => {
          if (request && (request === 'ssh2' || request.startsWith('ssh2/'))) {
            return `commonjs ${request}`;
          }
        },
      ];
    }
    return config;
  },
};

export default nextConfig;
