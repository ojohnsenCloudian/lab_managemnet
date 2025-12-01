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
# Use NODE_ENV=production explicitly and capture full output
RUN echo "=== Starting Next.js build ===" && \
    NODE_ENV=production npm run build 2>&1 | tee /tmp/build-full.log && \
    BUILD_EXIT=$? && \
    echo "=== Build exit code: $BUILD_EXIT ===" && \
    echo "=== Full build output (last 200 lines) ===" && \
    tail -200 /tmp/build-full.log && \
    echo "=== Checking for compilation errors ===" && \
    grep -i "error\|failed\|fail\|warn" /tmp/build-full.log | tail -30 || echo "No errors found in log" && \
    echo "=== Checking .next directory ===" && \
    ls -la .next/ && \
    echo "=== Checking for server directory ===" && \
    if [ ! -d ".next/server" ]; then \
      echo "✗ .next/server missing!"; \
      echo "This suggests Next.js didn't actually compile. Checking if pages exist:"; \
      find app -name "*.tsx" -o -name "*.ts" | head -20; \
      echo "Trying to manually verify Next.js can see the app:"; \
      node -e "const fs=require('fs'); console.log('app/layout.tsx exists:', fs.existsSync('app/layout.tsx')); console.log('app/page.tsx exists:', fs.existsSync('app/page.tsx'));" && \
      exit 1; \
    fi && \
    echo "✓ Build successful - .next/server exists"

# Expose port
EXPOSE 8950

# Set port environment variable
ENV PORT=8950
ENV HOSTNAME="0.0.0.0"

# Make startup script executable
RUN chmod +x /app/scripts/start.sh

# Start the application using the startup script
CMD ["/app/scripts/start.sh"]
