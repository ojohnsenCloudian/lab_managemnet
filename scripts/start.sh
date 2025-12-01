#!/bin/sh

# Run Prisma migrations
echo "Running Prisma migrations..."
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "Applying existing migrations..."
  npx prisma migrate deploy || echo "Migration deploy completed or database already initialized"
else
  echo "No migrations found, creating initial migration..."
  npx prisma migrate dev --name init || echo "Migration creation completed"
fi

# Initialize admin user if it doesn't exist
echo "Checking for admin user..."
npx tsx scripts/init-admin.ts || echo "Admin user check completed"

# Start the application
echo "Starting Next.js application on 0.0.0.0:8950..."

# Verify .next directory exists
echo "Checking for .next directory..."
if [ ! -d ".next" ]; then
  echo "ERROR: .next directory not found! Build may have failed."
  echo "Current working directory: $(pwd)"
  ls -la
  exit 1
fi

# Check for server directory (required for production)
if [ ! -d ".next/server" ]; then
  echo "ERROR: .next/server directory not found! Build incomplete."
  echo "Contents of .next directory:"
  ls -la .next/ 2>&1
  echo ""
  echo "This usually means the Docker build failed. Please check the build logs."
  exit 1
fi

# Check for BUILD_ID (preferred but not always required)
if [ -f ".next/BUILD_ID" ]; then
  echo "✓ Build verified - BUILD_ID: $(cat .next/BUILD_ID)"
else
  echo "⚠ BUILD_ID not found, but server directory exists - proceeding anyway"
  echo "Contents of .next:"
  ls -la .next/ | head -20
fi

echo "✓ Starting Next.js server on ${HOSTNAME:-0.0.0.0}:${PORT:-8950}"

# Use next start directly
# Next.js 16 should bind to 0.0.0.0 by default
export HOSTNAME=${HOSTNAME:-0.0.0.0}
export PORT=${PORT:-8950}
exec npx next start -p ${PORT}
