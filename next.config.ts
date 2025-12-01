import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  // Mark native modules as external so they're not bundled
  // ssh2 is a native module with C++ bindings that bundlers can't process
  serverExternalPackages: [
    '@prisma/client',
    'prisma',
    'ssh2',
  ],
  typescript: {
    ignoreBuildErrors: false,
  },
  // Configure webpack to handle native modules properly
  // This will be used if Turbopack is disabled or falls back to webpack
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
