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
    (npm run build 2>&1 | tee /tmp/build.log) && \
    echo "=== Build command completed ===" && \
    echo "=== Checking .next directory ===" && \
    ls -la .next/ && \
    echo "=== Checking for server directory ===" && \
    if [ ! -d ".next/server" ]; then \
      echo "✗ .next/server missing!"; \
      echo "=== Last 100 lines of build log ==="; \
      tail -100 /tmp/build.log; \
      echo "=== Checking for error patterns ==="; \
      grep -i "error\|failed\|fail" /tmp/build.log | tail -20 || echo "No obvious errors found"; \
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
