#!/bin/sh

# Initialize admin user if it doesn't exist
if [ ! -f /app/.admin-initialized ]; then
  echo "Initializing admin user..."
  npx tsx scripts/init-admin.ts || echo "Admin user may already exist"
  touch /app/.admin-initialized
fi

# Start the application
exec node server.js

