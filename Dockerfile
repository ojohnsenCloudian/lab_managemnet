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
    npm run build && \
    echo "=== Build completed, checking output ===" && \
    ls -la .next/ && \
    if [ ! -d ".next/server" ]; then \
      echo "✗ ERROR: .next/server missing!"; \
      echo "Build failed - server directory not created"; \
      exit 1; \
    fi && \
    echo "✓ Build successful - .next/server exists" && \
    ls -la .next/server/ | head -10

# Expose port
EXPOSE 8950

# Set port environment variable
ENV PORT=8950
ENV HOSTNAME="0.0.0.0"

# Make startup script executable
RUN chmod +x /app/scripts/start.sh

# Start the application using the startup script
CMD ["/app/scripts/start.sh"]
