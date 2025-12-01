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
# Use NODE_OPTIONS to get more verbose output
RUN echo "=== Starting Next.js build ===" && \
    NODE_OPTIONS="--trace-warnings" npm run build 2>&1 && \
    echo "=== Build command finished ===" && \
    echo "=== Checking .next directory ===" && \
    ls -la .next/ && \
    echo "=== Checking for server directory ===" && \
    (test -d ".next/server" && echo "✓ .next/server exists" || (echo "✗ .next/server missing!" && find .next -type f 2>/dev/null | head -20 && exit 1)) && \
    echo "✓ Build verification complete"

# Expose port
EXPOSE 8950

# Set port environment variable
ENV PORT=8950
ENV HOSTNAME="0.0.0.0"

# Make startup script executable
RUN chmod +x /app/scripts/start.sh

# Start the application using the startup script
CMD ["/app/scripts/start.sh"]
