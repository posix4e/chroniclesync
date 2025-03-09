#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PLATFORMS = ['chrome', 'firefox'];
const EXTENSION_DIR = path.resolve(__dirname, '../extension');
const DIST_DIR = path.resolve(__dirname, '../dist');
const SHARED_DIR = path.resolve(__dirname, '../shared');
const PLATFORMS_DIR = path.resolve(__dirname, '../platforms');

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Clean dist directory
console.log('Cleaning dist directory...');
if (fs.existsSync(DIST_DIR)) {
  PLATFORMS.forEach(platform => {
    const platformDir = path.join(DIST_DIR, platform);
    if (fs.existsSync(platformDir)) {
      fs.rmSync(platformDir, { recursive: true, force: true });
    }
    fs.mkdirSync(platformDir, { recursive: true });
  });
}

// Build extension
console.log('Building extension...');
try {
  execSync('npm run build', { 
    cwd: EXTENSION_DIR,
    stdio: 'inherit'
  });
  console.log('Extension built successfully!');
} catch (error) {
  console.error('Error building extension:', error);
  process.exit(1);
}

// Build each platform
PLATFORMS.forEach(platform => {
  console.log(`Building ${platform} extension...`);
  
  // Create platform dist directory
  const platformDistDir = path.join(DIST_DIR, platform);
  
  // Copy built extension files to platform directory
  console.log(`Copying extension files to ${platform} directory...`);
  copyDirectory(path.join(EXTENSION_DIR, 'dist'), platformDistDir);
  
  // Copy shared code to platform directory
  if (fs.existsSync(SHARED_DIR)) {
    console.log(`Copying shared code to ${platform} directory...`);
    copyDirectory(SHARED_DIR, path.join(platformDistDir, 'shared'));
  }
  
  // Copy platform-specific files
  const platformSpecificDir = path.join(PLATFORMS_DIR, platform);
  if (fs.existsSync(platformSpecificDir)) {
    console.log(`Copying ${platform}-specific files...`);
    
    // Special handling for manifest.json
    const manifestPath = path.join(platformSpecificDir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      console.log(`Using ${platform}-specific manifest.json`);
      fs.copyFileSync(manifestPath, path.join(platformDistDir, 'manifest.json'));
    }
    
    // Copy other platform-specific files
    const files = fs.readdirSync(platformSpecificDir);
    files.forEach(file => {
      if (file !== 'manifest.json') {
        const sourcePath = path.join(platformSpecificDir, file);
        const destPath = path.join(platformDistDir, file);
        
        if (fs.statSync(sourcePath).isDirectory()) {
          copyDirectory(sourcePath, destPath);
        } else {
          fs.copyFileSync(sourcePath, destPath);
        }
      }
    });
  }
  
  // Create zip file
  console.log(`Creating ${platform} extension zip...`);
  createZip(platformDistDir, path.join(DIST_DIR, `chroniclesync-${platform}.zip`));
  
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
  try {
    execSync(`cd "${sourceDir}" && zip -r "${outputPath}" *`, {
      stdio: 'inherit'
    });
    console.log(`Created zip file: ${outputPath}`);
  } catch (error) {
    console.error('Error creating zip file:', error);
  }
}