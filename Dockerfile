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
    npm run build 2>&1; \
    BUILD_EXIT=$?; \
    echo "=== Build exit code: $BUILD_EXIT ===" && \
    echo "=== Checking diagnostics ===" && \
    if [ -f ".next/diagnostics/build-diagnostics.json" ]; then \
      echo "Build diagnostics:"; \
      cat .next/diagnostics/build-diagnostics.json; \
    fi && \
    if [ -f ".next/diagnostics/framework.json" ]; then \
      echo "Framework diagnostics:"; \
      cat .next/diagnostics/framework.json; \
    fi && \
    echo "=== Checking .next directory ===" && \
    ls -la .next/ && \
    echo "=== Checking for server directory ===" && \
    if [ ! -d ".next/server" ]; then \
      echo "✗ .next/server missing!"; \
      echo "Build exit code was: $BUILD_EXIT"; \
      if [ $BUILD_EXIT -ne 0 ]; then \
        echo "Build failed with exit code $BUILD_EXIT"; \
      else \
        echo "Build completed but server directory missing - checking for errors"; \
      fi; \
      echo "=== All files in .next ==="; \
      find .next -type f 2>/dev/null; \
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
