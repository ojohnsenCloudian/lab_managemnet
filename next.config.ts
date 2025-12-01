import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  // Mark native modules as external so they're not bundled
  serverExternalPackages: [
    '@prisma/client',
    'prisma',
    'ssh2',
  ],
  typescript: {
    ignoreBuildErrors: false,
  },
  // Configure webpack to handle native modules properly
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark ssh2 and all its submodules as external
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
