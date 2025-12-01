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
    echo "Build completed. Checking .next directory..." && \
    ls -la .next/ && \
    test -d .next && \
    test -f .next/BUILD_ID && \
    echo "✓ Build successful - .next directory and BUILD_ID exist" || \
    (echo "✗ Build failed - .next directory or BUILD_ID missing!" && \
     echo "Contents of current directory:" && \
     ls -la && \
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
