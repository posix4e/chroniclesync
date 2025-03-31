#!/usr/bin/env node

const { mkdir, rm, cp, readFile, writeFile } = require('fs/promises');
const { exec } = require('child_process');
const { promisify } = require('util');
const { join } = require('path');
const { existsSync } = require('fs');

const execAsync = promisify(exec);
const ROOT_DIR = join(__dirname, '..');  // Repository root directory
const EXTENSION_DIR = join(ROOT_DIR, 'extension');  // Chrome extension directory
const SAFARI_DIR = join(__dirname, 'ChronicleSync');  // Safari extension directory

/** @type {[string, string][]} File copy specifications [source, destination] */
const filesToCopy = [
  ['popup.html', 'popup.html'],
  ['popup.css', 'popup.css'],
  ['settings.html', 'settings.html'],
  ['settings.css', 'settings.css'],
  ['history.html', 'history.html'],
  ['history.css', 'history.css'],
  ['devtools.html', 'devtools.html'],
  ['devtools.css', 'devtools.css'],
  ['bip39-wordlist.js', 'bip39-wordlist.js']
];

async function main() {
  try {
    // Clean up any existing files
    if (existsSync(SAFARI_DIR)) {
      await rm(SAFARI_DIR, { recursive: true, force: true });
    }
    
    // Create Safari extension directory
    await mkdir(SAFARI_DIR, { recursive: true });
    
    // Install dependencies and build the Chrome extension
    console.log('Installing dependencies...');
    await execAsync('npm install', { cwd: EXTENSION_DIR });
    
    console.log('Building Chrome extension...');
    await execAsync('npm run build', { cwd: EXTENSION_DIR });
    
    // Copy static files
    console.log('Copying files...');
    for (const [src, dest] of filesToCopy) {
      await cp(
        join(EXTENSION_DIR, src),
        join(SAFARI_DIR, dest),
        { recursive: true }
      ).catch(err => {
        console.warn(`Warning: Could not copy ${src}: ${err.message}`);
      });
    }
    
    // Copy built JS files
    const distFiles = [
      'popup.js',
      'background.js',
      'settings.js',
      'history.js',
      'devtools.js',
      'devtools-page.js',
      'content-script.js'
    ];
    
    for (const file of distFiles) {
      await cp(
        join(EXTENSION_DIR, 'dist', file),
        join(SAFARI_DIR, file),
        { recursive: true }
      ).catch(err => {
        console.warn(`Warning: Could not copy ${file}: ${err.message}`);
      });
    }
    
    // Copy assets directory
    await cp(
      join(EXTENSION_DIR, 'dist', 'assets'),
      join(SAFARI_DIR, 'assets'),
      { recursive: true }
    ).catch(err => {
      console.warn(`Warning: Could not copy assets: ${err.message}`);
    });
    
    // Copy the Safari-specific manifest.json (already created)
    // This step is skipped as we've already created a custom manifest.json for Safari
    
    console.log('Safari extension files prepared successfully!');
    console.log('Next steps:');
    console.log('1. Create a new Safari App Extension project in Xcode');
    console.log('2. Copy the files from the safari-extension/ChronicleSync directory to your Xcode project');
    console.log('3. Configure the extension in Xcode and build for iOS');
    
  } catch (error) {
    console.error('Error building Safari extension:', error);
    process.exit(1);
  }
}

main();