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

// Create index.js - use a workaround that actually works
// The solution: create a JavaScript file that uses tsx to load TypeScript at runtime
const indexJs = `// Use tsx to load TypeScript files at runtime
// Register tsx loader first, then require the parent client
require('tsx/cjs/api').register();
module.exports = require('../client.ts');
`;
fs.writeFileSync(path.join(defaultPath, 'index.js'), indexJs);

// Copy all necessary files to default directory so they can be resolved
// This ensures Turbopack can find the files even if require() can't resolve .ts directly
if (fs.existsSync(path.join(prismaClientPath, 'client.ts'))) {
  // Copy TypeScript files
  ['client.ts', 'models.ts', 'enums.ts', 'commonInputTypes.ts', 'browser.ts'].forEach(file => {
    const src = path.join(prismaClientPath, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(defaultPath, file));
    }
  });
  
  // Copy directories recursively
  const copyDir = (srcDir, destDir) => {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const files = fs.readdirSync(srcDir);
    files.forEach(file => {
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(destDir, file);
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  };
  
  // Copy models and internal directories
  ['models', 'internal'].forEach(dir => {
    const srcDir = path.join(prismaClientPath, dir);
    if (fs.existsSync(srcDir)) {
      copyDir(srcDir, path.join(defaultPath, dir));
    }
  });
}

// Create a package.json in the default directory to help with module resolution
// This might help Next.js/Turbopack resolve the TypeScript files
const packageJson = {
  name: '.prisma-client-default',
  version: '1.0.0',
  type: 'commonjs',
  main: './index.js',
  types: './index.d.ts'
};
fs.writeFileSync(
  path.join(defaultPath, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

console.log('Prisma default directory structure created successfully');

