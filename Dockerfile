# Multi-stage Docker build for Raspberry Pi 5 (ARM64)
FROM node:20-alpine AS base

# Install dependencies stage
FROM base AS deps
# Install build dependencies for native modules (ssh2, bcryptjs) on ARM64
RUN apk add --no-cache libc6-compat python3 make g++ git
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set DATABASE_URL for Prisma generation
ENV DATABASE_URL="file:./prisma/dev.db"

# Generate Prisma Client
RUN npx prisma generate

# Build the application (using webpack for native module support)
RUN npm run build

# Verify build completed successfully
RUN test -d /app/.next && echo "✓ Build output exists" || (echo "✗ Build failed - .next directory not found" && exit 1)

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public

# Copy Next.js build output
# Standalone output should exist if output: 'standalone' is set in next.config
RUN if [ -d /app/.next/standalone ]; then
  COPY --from=builder /app/.next/standalone ./
  COPY --from=builder /app/.next/static ./.next/static
else
  # Fallback: copy full .next directory if standalone doesn't exist
  COPY --from=builder /app/.next ./.next
fi

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma

# Copy Prisma client (needed at runtime)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy native modules and their dependencies
# Standalone output might not include these
COPY --from=builder /app/node_modules/ssh2 ./node_modules/ssh2
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/node_modules/crypto-js ./node_modules/crypto-js
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx

# Copy package.json and scripts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts ./scripts

# Make startup script executable
RUN chmod +x /app/scripts/start.sh

USER nextjs

EXPOSE 8950

ENV PORT=8950
ENV HOSTNAME="0.0.0.0"

CMD ["/app/scripts/start.sh"]
