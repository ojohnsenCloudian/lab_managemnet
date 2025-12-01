# Multi-stage build for production
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
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

# Create default directory structure that @prisma/client expects
# Prisma 7 requires a 'default' subdirectory
# Copy all files to default directory (they will be used by Next.js during build)
RUN mkdir -p node_modules/.prisma/client/default && \
    cp -r node_modules/.prisma/client/* node_modules/.prisma/client/default/ 2>/dev/null || true && \
    rm -rf node_modules/.prisma/client/default/default 2>/dev/null || true
# Create index files - TypeScript index for Next.js build-time resolution
RUN echo "export * from '../client';" > node_modules/.prisma/client/default/index.d.ts && \
    echo "export * from '../models';" >> node_modules/.prisma/client/default/index.d.ts && \
    echo "export * from '../enums';" >> node_modules/.prisma/client/default/index.d.ts && \
    echo "export * from '../client';" > node_modules/.prisma/client/default/index.ts && \
    echo "export * from '../models';" >> node_modules/.prisma/client/default/index.ts && \
    echo "export * from '../enums';" >> node_modules/.prisma/client/default/index.ts
# Create JS index - since all files are copied to default/, reference local client.ts
# Next.js/Turbopack will handle TypeScript compilation during build
# The require will be resolved by Next.js's module system which handles .ts files
RUN echo "module.exports = require('./client');" > node_modules/.prisma/client/default/index.js

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

