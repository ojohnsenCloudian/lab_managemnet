import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily disable reactCompiler to see if it's causing issues
  // reactCompiler: true,
  serverExternalPackages: [
    '@prisma/client',
    'prisma',
    'ssh2',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  // Empty turbopack config to silence error when using webpack
  turbopack: {},
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
