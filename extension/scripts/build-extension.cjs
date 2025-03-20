/* eslint-disable no-console */
const { mkdir, rm, cp, readFile, writeFile } = require('fs/promises');
const { exec } = require('child_process');
const { promisify } = require('util');
const { join, resolve } = require('path');
const fs = require('fs');

const execAsync = promisify(exec);
const ROOT_DIR = join(__dirname, '..');  // Extension root directory
const DIST_DIR = join(ROOT_DIR, 'dist');
const PACKAGE_DIR = join(ROOT_DIR, 'package');

// Get browser target from environment variable (defaults to chrome)
const browserTarget = process.env.BROWSER || 'chrome';

// Define browser-specific configurations
const browserConfigs = {
  chrome: {
    outputDir: join(DIST_DIR, 'chrome'),
    packageDir: join(PACKAGE_DIR, 'chrome'),
    manifestPath: join(ROOT_DIR, 'manifest.json'),
    // Chrome-specific settings if needed
  },
  firefox: {
    outputDir: join(DIST_DIR, 'firefox'),
    packageDir: join(PACKAGE_DIR, 'firefox'),
    manifestPath: join(ROOT_DIR, 'manifest.json'),
    // Firefox-specific settings
    manifestTransform: (manifest) => {
      // Add Firefox-specific settings
      manifest.browser_specific_settings = {
        "gecko": {
          "id": "chroniclesync@example.com",
          "strict_min_version": "109.0"
        }
      };
      return manifest;
    }
  },
  safari: {
    outputDir: join(DIST_DIR, 'safari'),
    packageDir: join(PACKAGE_DIR, 'safari'),
    manifestPath: join(ROOT_DIR, 'manifest.json'),
    // Safari-specific settings
    safariExtensionDir: join(ROOT_DIR, 'ChronicleSync', 'Shared (Extension)', 'Resources')
  }
};

// Get config for the current browser target
const currentBrowserConfig = browserConfigs[browserTarget] || browserConfigs.chrome;

/** @type {[string, string][]} Common file copy specifications [source, destination] */
const commonFilesToCopy = [
  ['manifest.json', 'manifest.json'],
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

// Define browser-specific file copy specifications
const browserSpecificFilesToCopy = {
  chrome: [
    ...commonFilesToCopy,
    [join('dist', 'chrome', 'popup.js'), 'popup.js'],
    [join('dist', 'chrome', 'background.js'), 'background.js'],
    [join('dist', 'chrome', 'settings.js'), 'settings.js'],
    [join('dist', 'chrome', 'history.js'), 'history.js'],
    [join('dist', 'chrome', 'devtools.js'), 'devtools.js'],
    [join('dist', 'chrome', 'devtools-page.js'), 'devtools-page.js'],
    [join('dist', 'chrome', 'content-script.js'), 'content-script.js'],
    [join('dist', 'chrome', 'assets'), 'assets']
  ],
  firefox: [
    ...commonFilesToCopy,
    [join('dist', 'firefox', 'popup.js'), 'popup.js'],
    [join('dist', 'firefox', 'background.js'), 'background.js'],
    [join('dist', 'firefox', 'settings.js'), 'settings.js'],
    [join('dist', 'firefox', 'history.js'), 'history.js'],
    [join('dist', 'firefox', 'devtools.js'), 'devtools.js'],
    [join('dist', 'firefox', 'devtools-page.js'), 'devtools-page.js'],
    [join('dist', 'firefox', 'content-script.js'), 'content-script.js'],
    [join('dist', 'firefox', 'assets'), 'assets']
  ],
  safari: [
    ...commonFilesToCopy,
    [join('dist', 'safari', 'popup.js'), 'popup.js'],
    [join('dist', 'safari', 'background.js'), 'background.js'],
    [join('dist', 'safari', 'settings.js'), 'settings.js'],
    [join('dist', 'safari', 'history.js'), 'history.js'],
    [join('dist', 'safari', 'devtools.js'), 'devtools.js'],
    [join('dist', 'safari', 'devtools-page.js'), 'devtools-page.js'],
    [join('dist', 'safari', 'content-script.js'), 'content-script.js'],
    [join('dist', 'safari', 'assets'), 'assets']
  ]
};

// Get the file copy specifications for the current browser target
const filesToCopy = browserSpecificFilesToCopy[browserTarget] || browserSpecificFilesToCopy.chrome;

async function main() {
  try {
    // Clean up any existing package directory for the current browser
    await rm(currentBrowserConfig.packageDir, { recursive: true, force: true });
    
    // Create package directory
    await mkdir(currentBrowserConfig.packageDir, { recursive: true });
    
    // Run the build with the current browser target
    console.log(`Building extension for ${browserTarget}...`);
    await execAsync(`BROWSER=${browserTarget} npm run build`, { cwd: ROOT_DIR });
    
    // Copy necessary files
    console.log('Copying files...');
    for (const [src, dest] of filesToCopy) {
      await cp(
        join(ROOT_DIR, src),
        join(currentBrowserConfig.packageDir, dest),
        { recursive: true }
      ).catch(err => {
        console.warn(`Warning: Could not copy ${src}: ${err.message}`);
      });
    }
    
    // Read the manifest
    const manifestPath = join(currentBrowserConfig.packageDir, 'manifest.json');
    const manifestContent = await readFile(currentBrowserConfig.manifestPath, 'utf8');
    let manifest = JSON.parse(manifestContent);
    
    // Apply browser-specific manifest transformations if needed
    if (currentBrowserConfig.manifestTransform) {
      manifest = currentBrowserConfig.manifestTransform(manifest);
    }
    
    // Write the updated manifest
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    // Handle browser-specific packaging
    if (browserTarget === 'chrome') {
      // Create Chrome zip file
      console.log('Creating Chrome extension zip file...');
      await execAsync(`cd "${currentBrowserConfig.packageDir}" && zip -r ../../chrome-extension.zip ./*`);
      console.log('Chrome extension package created: chrome-extension.zip');
    } 
    else if (browserTarget === 'firefox') {
      // Create Firefox XPI file
      console.log('Creating Firefox extension XPI file...');
      await execAsync(`cd "${currentBrowserConfig.packageDir}" && zip -r ../../firefox-extension.xpi ./*`);
      console.log('Firefox extension package created: firefox-extension.xpi');
    } 
    else if (browserTarget === 'safari') {
      // Copy files to Safari extension directory if it exists
      if (currentBrowserConfig.safariExtensionDir && fs.existsSync(currentBrowserConfig.safariExtensionDir)) {
        console.log('Copying files to Safari extension directory...');
        
        // Ensure the Safari extension directory exists
        await mkdir(currentBrowserConfig.safariExtensionDir, { recursive: true });
        
        // Copy all files from the package directory to the Safari extension directory
        for (const file of await fs.promises.readdir(currentBrowserConfig.packageDir, { withFileTypes: true })) {
          const srcPath = join(currentBrowserConfig.packageDir, file.name);
          const destPath = join(currentBrowserConfig.safariExtensionDir, file.name);
          
          if (file.isDirectory()) {
            await cp(srcPath, destPath, { recursive: true }).catch(err => {
              console.warn(`Warning: Could not copy directory ${file.name}: ${err.message}`);
            });
          } else {
            await cp(srcPath, destPath).catch(err => {
              console.warn(`Warning: Could not copy file ${file.name}: ${err.message}`);
            });
          }
        }
        
        console.log('Files copied to Safari extension directory');
      } else {
        console.warn('Safari extension directory not found, skipping copy to Safari extension');
      }
    }
    
    console.log(`Extension build for ${browserTarget} completed successfully`);
  } catch (error) {
    console.error(`Error building extension for ${browserTarget}:`, error);
    process.exit(1);
  }
}

main();