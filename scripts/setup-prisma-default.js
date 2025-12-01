#!/usr/bin/env node
// Script to create the default directory structure for Prisma 7
const fs = require('fs');
const path = require('path');

const prismaClientPath = path.join(__dirname, '../node_modules/.prisma/client');
const defaultPath = path.join(prismaClientPath, 'default');

// Create default directory if it doesn't exist
if (!fs.existsSync(defaultPath)) {
  fs.mkdirSync(defaultPath, { recursive: true });
}

// Create index.d.ts
const indexDTs = `export * from '../client';
export * from '../models';
export * from '../enums';
`;
fs.writeFileSync(path.join(defaultPath, 'index.d.ts'), indexDTs);

// Create index.ts
const indexTs = `export * from '../client';
export * from '../models';
export * from '../enums';
`;
fs.writeFileSync(path.join(defaultPath, 'index.ts'), indexTs);

// Create index.js - re-export from parent directory
// The key is that Next.js/Turbopack will resolve TypeScript files during build
// Even though require() normally can't handle .ts files, Next.js's module system will
const indexJs = `module.exports = require('../client');
`;
fs.writeFileSync(path.join(defaultPath, 'index.js'), indexJs);

console.log('Prisma default directory structure created successfully');

