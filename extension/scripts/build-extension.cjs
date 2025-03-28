/* eslint-disable no-console */
const { mkdir, rm, cp } = require('fs/promises');
const { exec } = require('child_process');
const { promisify } = require('util');
const { join } = require('path');
const glob = require('glob');
const fs = require('fs');

const execAsync = promisify(exec);
const ROOT_DIR = join(__dirname, '..');  // Extension root directory
const PACKAGE_DIR = join(ROOT_DIR, 'package');

/** @type {[string, string][]} File copy specifications [source, destination] */
const filesToCopy = [
  // HTML and CSS files
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
];

async function main() {
  try {
    // Clean up any existing package directory
    await rm(PACKAGE_DIR, { recursive: true, force: true });
    
    // Create package directory
    await mkdir(PACKAGE_DIR, { recursive: true });
    
    // Run the build
    console.log('Building extension...');
    await execAsync('npm run build', { cwd: ROOT_DIR });
    
    // Copy necessary files
    console.log('Copying static files...');
    for (const [src, dest] of filesToCopy) {
      const srcPath = join(ROOT_DIR, src);
      await cp(
        srcPath,
        join(PACKAGE_DIR, dest),
        { recursive: true }
      ).catch(err => {
        console.warn(`Warning: Could not copy ${src}: ${err.message}`);
      });
    }
    
    // Copy all files from dist directory
    console.log('Copying built files from dist directory...');
    const distDir = join(ROOT_DIR, 'dist');
    
    // First, copy all JS files from the root of dist
    const jsFiles = glob.sync(join(distDir, '*.js'));
    console.log(`Found ${jsFiles.length} JS files in dist root`);
    
    for (const file of jsFiles) {
      const fileName = file.split('/').pop();
      await cp(
        file,
        join(PACKAGE_DIR, fileName),
        { recursive: true }
      ).catch(err => {
        console.warn(`Warning: Could not copy ${file}: ${err.message}`);
      });
    }
    
    // Then copy the assets directory if it exists
    const assetsDir = join(distDir, 'assets');
    if (fs.existsSync(assetsDir)) {
      console.log('Copying assets directory...');
      await cp(
        assetsDir,
        join(PACKAGE_DIR, 'assets'),
        { recursive: true }
      ).catch(err => {
        console.warn(`Warning: Could not copy assets directory: ${err.message}`);
      });
    } else {
      console.log('No assets directory found, skipping...');
    }
    
    // Create Chrome zip file
    console.log('Creating Chrome extension zip file...');
    await execAsync(`cd "${PACKAGE_DIR}" && zip -r ../chrome-extension.zip ./*`);
    
    // Create Firefox XPI file with Firefox-specific modifications
    console.log('Creating Firefox extension XPI file...');
    
    // Read the manifest
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
    
    // Clean up
    await rm(PACKAGE_DIR, { recursive: true });
    
    console.log('Extension packages created: chrome-extension.zip and firefox-extension.xpi');
  } catch (error) {
    console.error('Error building extension:', error);
    process.exit(1);
  }
}

main();