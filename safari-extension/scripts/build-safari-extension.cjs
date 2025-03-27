#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const srcDir = path.resolve(__dirname, '../src');
const distDir = path.resolve(__dirname, '../dist');
const resourcesDir = path.resolve(__dirname, '../ChronicleSync/ChronicleSync Extension/Resources');

// Create directories if they don't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Build the extension using Vite
console.log('Building Safari extension with Vite...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('Error building extension:', error);
  process.exit(1);
}

// Copy built files to the Safari extension resources directory
console.log('Copying built files to Safari extension resources...');
try {
  // Ensure the resources directory exists
  if (!fs.existsSync(resourcesDir)) {
    fs.mkdirSync(resourcesDir, { recursive: true });
  }

  // Copy all files from dist to resources
  execSync(`cp -R ${distDir}/* ${resourcesDir}/`, { stdio: 'inherit' });
  
  console.log('Safari extension resources updated successfully!');
} catch (error) {
  console.error('Error copying files:', error);
  process.exit(1);
}

console.log('Safari extension build completed successfully!');