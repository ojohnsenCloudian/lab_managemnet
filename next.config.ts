import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'prisma'],
  typescript: {
    // Temporarily ignore build errors to allow build to complete
    // Remove this after fixing Prisma Client import issues
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
