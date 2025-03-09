#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

// Configuration
const PLATFORMS = ['chrome', 'firefox'];
const BUILD_DIR = path.resolve(__dirname, '../build');
const DIST_DIR = path.resolve(__dirname, '../dist');
const SHARED_DIR = path.resolve(__dirname, '../shared');
const PLATFORMS_DIR = path.resolve(__dirname, '../platforms');

// Ensure build and dist directories exist
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Clean build directory
console.log('Cleaning build directory...');
fs.readdirSync(BUILD_DIR).forEach(file => {
  fs.rmSync(path.join(BUILD_DIR, file), { recursive: true, force: true });
});

// Build shared code
console.log('Building shared code...');
execSync('npm run build', { 
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit'
});

// Build each platform
PLATFORMS.forEach(platform => {
  console.log(`Building ${platform} extension...`);
  
  // Create platform build directory
  const platformBuildDir = path.join(BUILD_DIR, platform);
  fs.mkdirSync(platformBuildDir, { recursive: true });
  
  // Copy shared code to platform build directory
  copyDirectory(path.join(__dirname, '../dist/shared'), platformBuildDir);
  
  // Copy platform-specific files
  copyDirectory(path.join(PLATFORMS_DIR, platform), platformBuildDir);
  
  // Create zip file
  console.log(`Creating ${platform} extension zip...`);
  createZip(platformBuildDir, path.join(DIST_DIR, `chroniclesync-${platform}.zip`));
  
  console.log(`${platform} extension built successfully!`);
});

console.log('All extensions built successfully!');

// Helper functions
function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) {
    console.warn(`Source directory does not exist: ${source}`);
    return;
  }
  
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }
  
  const files = fs.readdirSync(source);
  
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}

function createZip(sourceDir, outputPath) {
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });
  
  archive.pipe(output);
  archive.directory(sourceDir, false);
  archive.finalize();
}