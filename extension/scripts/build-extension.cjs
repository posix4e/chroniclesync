/* eslint-disable no-console */
const { mkdir, rm, cp } = require('fs/promises');
const { exec } = require('child_process');
const { promisify } = require('util');
const { join } = require('path');

const execAsync = promisify(exec);
const ROOT_DIR = join(__dirname, '..');  // Extension root directory
const PACKAGE_DIR = join(ROOT_DIR, 'package');
const IOS_PACKAGE_DIR = join(ROOT_DIR, 'package-ios');

/** @type {[string, string][]} File copy specifications [source, destination] */
const filesToCopy = [
  ['manifest.json', 'manifest.json'],
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

async function main() {
  try {
    // Clean up any existing package directories
    await rm(PACKAGE_DIR, { recursive: true, force: true });
    await rm(IOS_PACKAGE_DIR, { recursive: true, force: true });
    
    // Create package directories
    await mkdir(PACKAGE_DIR, { recursive: true });
    await mkdir(IOS_PACKAGE_DIR, { recursive: true });
    
    // Run the build
    console.log('Building extension...');
    await execAsync('npm run build', { cwd: ROOT_DIR });
    
    // Copy necessary files
    console.log('Copying files...');
    for (const [src, dest] of filesToCopy) {
      await cp(
        join(ROOT_DIR, src),
        join(PACKAGE_DIR, dest),
        { recursive: true }
      ).catch(err => {
        console.warn(`Warning: Could not copy ${src}: ${err.message}`);
      });
    }
    
    // Create Chrome zip file
    console.log('Creating Chrome extension zip file...');
    await execAsync(`cd "${PACKAGE_DIR}" && zip -r ../chrome-extension.zip ./*`);
    
    // Create Firefox XPI file with Firefox-specific modifications
    console.log('Creating Firefox extension XPI file...');
    
    // Read the manifest
    const fs = require('fs');
    const manifestPath = join(PACKAGE_DIR, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Add Firefox-specific settings
    manifest.browser_specific_settings = {
      "gecko": {
        "id": "chroniclesync@example.com",
        "strict_min_version": "109.0"
      }
    };
    
    // Write the updated manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    // Create the XPI file
    await execAsync(`cd "${PACKAGE_DIR}" && zip -r ../firefox-extension.xpi ./*`);
    
    // Create iOS Safari extension package
    console.log('Creating iOS Safari extension package...');
    
    // Copy files to iOS package directory
    for (const [src, dest] of filesToCopy) {
      await cp(
        join(ROOT_DIR, src),
        join(IOS_PACKAGE_DIR, dest),
        { recursive: true }
      ).catch(err => {
        console.warn(`Warning: Could not copy ${src} to iOS package: ${err.message}`);
      });
    }
    
    // Read the manifest for iOS modifications
    const iosManifestPath = join(IOS_PACKAGE_DIR, 'manifest.json');
    const iosManifest = JSON.parse(fs.readFileSync(iosManifestPath, 'utf8'));
    
    // Add iOS Safari specific settings
    iosManifest.browser_specific_settings = {
      "safari": {
        "id": "xyz.chroniclesync.extension",
        "strict_min_version": "16.0"
      }
    };
    
    // iOS Safari requires explicit content_security_policy
    iosManifest.content_security_policy = {
      "extension_pages": "script-src 'self'; object-src 'self'"
    };
    
    // Write the updated iOS manifest
    fs.writeFileSync(iosManifestPath, JSON.stringify(iosManifest, null, 2));
    
    // Create the iOS Safari extension zip file
    await execAsync(`cd "${IOS_PACKAGE_DIR}" && zip -r ../ios-safari-extension.zip ./*`);
    
    // Clean up
    await rm(PACKAGE_DIR, { recursive: true });
    await rm(IOS_PACKAGE_DIR, { recursive: true });
    
    console.log('Extension packages created: chrome-extension.zip, firefox-extension.xpi, and ios-safari-extension.zip');
  } catch (error) {
    console.error('Error building extension:', error);
    process.exit(1);
  }
}

main();