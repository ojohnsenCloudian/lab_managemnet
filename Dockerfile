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
RUN echo "Starting build..." && \
    npm run build && \
    echo "Build completed. Verifying output..." && \
    echo "Contents of .next:" && \
    ls -la .next/ && \
    echo "Checking for server directory:" && \
    ls -la .next/server/ 2>&1 || echo "WARNING: .next/server not found" && \
    echo "Checking for static directory:" && \
    ls -la .next/static/ 2>&1 || echo "WARNING: .next/static not found" && \
    echo "Looking for BUILD_ID:" && \
    find .next -name "BUILD_ID" -type f 2>/dev/null && \
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
