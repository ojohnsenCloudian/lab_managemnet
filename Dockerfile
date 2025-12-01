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
    npm run build 2>&1 || true && \
    echo "=== Build command finished ===" && \
    echo "=== Checking build diagnostics ===" && \
    if [ -f ".next/diagnostics/build-diagnostics.json" ]; then \
      echo "Build diagnostics:"; \
      cat .next/diagnostics/build-diagnostics.json; \
    fi && \
    echo "=== Checking .next directory ===" && \
    ls -la .next/ && \
    echo "=== Checking for server directory ===" && \
    if [ ! -d ".next/server" ]; then \
      echo "✗ .next/server missing!"; \
      echo "Checking for any error files:"; \
      find .next -name "*.log" -o -name "*error*" 2>/dev/null | head -10; \
      echo "Trying to see what Next.js actually built:"; \
      find .next -type f 2>/dev/null | head -30; \
      echo "Attempting to run Next.js build with debug:"; \
      DEBUG=* npm run build 2>&1 | head -100 || true; \
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
