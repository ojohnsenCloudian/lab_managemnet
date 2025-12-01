#!/bin/sh

# Run Prisma migrations to ensure database is up to date
echo "Running Prisma migrations..."
npx prisma migrate deploy || echo "Migrations may have failed, continuing..."

# Initialize admin user if it doesn't exist
if [ ! -f /app/.admin-initialized ]; then
  echo "Initializing admin user..."
  npx tsx scripts/init-admin.ts || echo "Admin user may already exist"
  touch /app/.admin-initialized
fi

# Start the application
# With standalone output, server.js is in the root
if [ -f server.js ]; then
  exec node server.js
else
  # Fallback to next start if standalone wasn't created
  exec node_modules/.bin/next start -p 8950
fi
