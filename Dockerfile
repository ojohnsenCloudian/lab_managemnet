# Multi-stage build for production
# Supports ARM64 (Raspberry Pi 5) and AMD64 architectures
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Install build dependencies needed for native modules (ssh2, bcryptjs, etc.) on ARM64
RUN apk add --no-cache libc6-compat python3 make g++ git
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
# npm will automatically build native modules for the target architecture
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set DATABASE_URL for Prisma generation (required for Prisma 7)
ENV DATABASE_URL="file:./prisma/dev.db"

# Generate Prisma Client (must be done before build)
RUN npx prisma generate

# Run setup script to create default directory structure
# This creates index.js that uses tsx to load TypeScript files at runtime
RUN node scripts/setup-prisma-default.js

# Verify the default directory structure was created
RUN test -f node_modules/.prisma/client/default/index.js && \
    echo "Default directory structure created successfully" || \
    (echo "ERROR: Default directory structure not created properly" && exit 1)

# Verify Prisma Client was generated
RUN test -d node_modules/.prisma/client && echo "Prisma client directory exists" || (echo "ERROR: Prisma client directory not found" && exit 1)

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/scripts ./scripts

# Make startup script executable
RUN chmod +x /app/scripts/start.sh

USER nextjs

EXPOSE 8950

ENV PORT=8950
ENV HOSTNAME="0.0.0.0"

CMD ["/app/scripts/start.sh"]

