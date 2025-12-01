import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'prisma'],
  typescript: {
    ignoreBuildErrors: false,
  },
  // Disable Turbopack to use webpack which can handle TypeScript in require()
  // This is needed for Prisma 7's default directory structure
  experimental: {
    turbo: false,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle TypeScript files in require statements for Prisma client
      config.resolve.extensionAlias = {
        '.js': ['.ts', '.tsx', '.js', '.jsx'],
        '.jsx': ['.tsx', '.jsx'],
      };
      // Also add .ts to resolve extensions
      if (!config.resolve.extensions) {
        config.resolve.extensions = [];
      }
      if (!config.resolve.extensions.includes('.ts')) {
        config.resolve.extensions.unshift('.ts');
      }
      if (!config.resolve.extensions.includes('.tsx')) {
        config.resolve.extensions.unshift('.tsx');
      }
    }
    return config;
  },
};

export default nextConfig;
