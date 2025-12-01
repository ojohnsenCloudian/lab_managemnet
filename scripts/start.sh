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
  echo "Listing current directory contents:"
  ls -la
  echo "Checking for .next:"
  ls -la .next 2>&1 || echo ".next does not exist"
  echo ""
  echo "This usually means the Docker build failed. Please check the build logs:"
  echo "  docker build -t lab-management . 2>&1 | grep -A 20 'Build'"
  exit 1
fi

# Check for BUILD_ID file which Next.js requires
if [ ! -f ".next/BUILD_ID" ]; then
  echo "ERROR: .next/BUILD_ID not found! Build incomplete."
  echo "Contents of .next directory:"
  ls -la .next/ 2>&1 || echo ".next directory empty or missing"
  exit 1
fi

echo "✓ Build verified - BUILD_ID: $(cat .next/BUILD_ID)"
echo "✓ Starting Next.js server on ${HOSTNAME:-0.0.0.0}:${PORT:-8950}"

# Use next start directly
# Next.js 16 should bind to 0.0.0.0 by default, but we'll ensure it
export HOSTNAME=${HOSTNAME:-0.0.0.0}
export PORT=${PORT:-8950}
exec npx next start -p ${PORT}
