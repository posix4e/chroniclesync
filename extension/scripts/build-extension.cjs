/* eslint-disable no-console */
const { mkdir, rm, cp, readFile, writeFile } = require('fs/promises');
const { exec } = require('child_process');
const { promisify } = require('util');
const { join } = require('path');

const execAsync = promisify(exec);
const ROOT_DIR = join(__dirname, '..');  // Extension root directory
const PACKAGE_DIR = join(ROOT_DIR, 'package');

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
  ['bip39-wordlist.js', 'bip39-wordlist.js'],
  [join('dist', 'popup.js'), 'popup.js'],
  [join('dist', 'background.js'), 'background.js'],
  [join('dist', 'settings.js'), 'settings.js'],
  [join('dist', 'history.js'), 'history.js'],
  [join('dist', 'devtools.js'), 'devtools.js'],
  [join('dist', 'devtools-page.js'), 'devtools-page.js'],
  [join('dist', 'content-script.js'), 'content-script.js'],
  [join('dist', 'assets'), 'assets']
];

/**
 * Build extension for a specific platform
 * @param {string} platform - 'chrome', 'firefox', or 'safari'
 */
async function buildForPlatform(platform) {
  const packageDir = join(PACKAGE_DIR, platform);
  
  try {
    // Create platform-specific package directory
    await mkdir(packageDir, { recursive: true });
    
    // Copy necessary files
    console.log(`Copying files for ${platform}...`);
    for (const [src, dest] of filesToCopy) {
      await cp(
        join(ROOT_DIR, src),
        join(packageDir, dest),
        { recursive: true }
      ).catch(err => {
        console.warn(`Warning: Could not copy ${src}: ${err.message}`);
      });
    }
    
    // Copy platform-specific manifest
    const manifestSource = platform === 'chrome' 
      ? 'manifest.json' 
      : `manifest.${platform}.json`;
    
    await cp(
      join(ROOT_DIR, manifestSource),
      join(packageDir, 'manifest.json')
    ).catch(err => {
      console.error(`Error copying manifest for ${platform}: ${err.message}`);
      throw err;
    });
    
    // Create zip file
    console.log(`Creating zip file for ${platform}...`);
    await execAsync(`cd "${packageDir}" && zip -r ../../${platform}-extension.zip ./*`);
    
    console.log(`Extension package created: ${platform}-extension.zip`);
  } catch (error) {
    console.error(`Error building extension for ${platform}:`, error);
    throw error;
  }
}

async function main() {
  try {
    // Clean up any existing package directory
    await rm(PACKAGE_DIR, { recursive: true, force: true });
    
    // Create package directory
    await mkdir(PACKAGE_DIR, { recursive: true });
    
    // Run the build
    console.log('Building extension...');
    await execAsync('npm run build', { cwd: ROOT_DIR });
    
    // Build for each platform
    const platforms = ['chrome', 'firefox', 'safari'];
    const platform = process.argv[2];
    
    if (platform && platforms.includes(platform)) {
      await buildForPlatform(platform);
    } else {
      // Build for all platforms
      for (const platform of platforms) {
        await buildForPlatform(platform);
      }
    }
    
    // For backward compatibility, create a copy of chrome-extension.zip
    await execAsync(`cp "${ROOT_DIR}/chrome-extension.zip" "${ROOT_DIR}/extension.zip"`);
    
    // Clean up
    await rm(PACKAGE_DIR, { recursive: true });
    
    console.log('All extension packages created successfully!');
  } catch (error) {
    console.error('Error building extensions:', error);
    process.exit(1);
  }
}

main();