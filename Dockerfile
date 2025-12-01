# Simple Docker build for Raspberry Pi 5 (ARM64)
FROM node:20-alpine

# Install build dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++ git

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Set environment variables
ENV DATABASE_URL="file:./prisma/dev.db"
ENV NODE_ENV=production

# Generate Prisma Client
RUN npx prisma generate

# Build the application (migrations will be applied at runtime)
RUN echo "=== Starting Next.js build ===" && \
    echo "=== Checking critical files ===" && \
    test -f "app/layout.tsx" && echo "✓ app/layout.tsx exists" || echo "✗ app/layout.tsx missing" && \
    test -f "app/page.tsx" && echo "✓ app/page.tsx exists" || echo "✗ app/page.tsx missing" && \
    test -f "next.config.ts" && echo "✓ next.config.ts exists" || echo "✗ next.config.ts missing" && \
    test -f "tsconfig.json" && echo "✓ tsconfig.json exists" || echo "✗ tsconfig.json missing" && \
    echo "=== Running Next.js build with timeout ===" && \
    timeout 60 npm run build || (echo "Build timed out or failed" && exit 1) && \
    echo "=== Build completed, checking .next ===" && \
    ls -la .next/ && \
    echo "=== Checking for server directory ===" && \
    (test -d ".next/server" && echo "✓ .next/server exists" && ls -la .next/server/ | head -10) || \
    (echo "✗ .next/server missing!" && \
     echo "=== Checking what was built ===" && \
     find .next -type f 2>/dev/null | head -30 && \
     echo "=== Checking for any log files ===" && \
     find .next -name "*.log" 2>/dev/null && \
     exit 1)

# Expose port
EXPOSE 8950

# Set port environment variable
ENV PORT=8950
ENV HOSTNAME="0.0.0.0"

# Make startup script executable
RUN chmod +x /app/scripts/start.sh

# Start the application using the startup script
CMD ["/app/scripts/start.sh"]
