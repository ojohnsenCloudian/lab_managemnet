#!/bin/bash
# Build script for Raspberry Pi 5 (ARM64)

set -e

echo "Building Docker image for Raspberry Pi 5 (ARM64)..."

# Build for ARM64 architecture
docker build --platform linux/arm64 -t lab-management:arm64 .

echo "Build complete! Image: lab-management:arm64"
echo ""
echo "To run the container:"
echo "  docker run --platform linux/arm64 -p 8950:8950 \\"
echo "    -e DATABASE_URL=file:./prisma/dev.db \\"
echo "    -e NEXTAUTH_URL=http://localhost:8950 \\"
echo "    -e NEXTAUTH_SECRET=your-secret-key \\"
echo "    -e ENCRYPTION_KEY=your-encryption-key \\"
echo "    lab-management:arm64"

