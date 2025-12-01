#!/bin/sh

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy || echo "Migrations completed or database already initialized"

# Initialize admin user if it doesn't exist
echo "Checking for admin user..."
npx tsx scripts/init-admin.ts || echo "Admin user check completed"

# Start the application
echo "Starting Next.js application..."
exec npm start
