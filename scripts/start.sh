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
exec node server.js
