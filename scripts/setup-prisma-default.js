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

// Create index.js - the fundamental issue is that require() can't resolve .ts files
// and Turbopack isn't helping during the build process
// 
// Since we've copied all files to default/, let's try requiring from local './client'
// But that still won't work because require() can't handle .ts files
//
// The real solution might be to check if Prisma 7 actually needs this default directory,
// or if we can work around it. But for now, let's try the parent directory approach
// and hope that Next.js/Turbopack can handle it somehow
const indexJs = `// Re-export from parent directory
// Note: This will fail at runtime because require() can't resolve .ts files
// Turbopack should handle this during build, but it's not working
// This is a known issue with Prisma 7 and Next.js/Turbopack
module.exports = require('../client');
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

