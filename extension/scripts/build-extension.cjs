/* eslint-disable no-console */
const { mkdir, rm, cp } = require('fs/promises');
const { exec } = require('child_process');
const { promisify } = require('util');
const { join } = require('path');

const execAsync = promisify(exec);
const ROOT_DIR = join(__dirname, '..');  // Extension root directory
const PACKAGE_DIR = join(ROOT_DIR, 'package');
const SAFARI_DIR = join(ROOT_DIR, '..', 'safari-ios');

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
    // Clean up any existing package directory
    await rm(PACKAGE_DIR, { recursive: true, force: true });
    
    // Create package directory
    await mkdir(PACKAGE_DIR, { recursive: true });
    
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
    
    // Create Safari iOS extension package
    console.log('Creating Safari iOS extension package...');
    
    // Create a Safari-specific manifest (Safari Web Extension manifest)
    const safariManifest = { ...manifest };
    
    // Safari doesn't support manifest v3 service workers the same way
    // Convert background service worker to background page if needed
    if (safariManifest.background && safariManifest.background.service_worker) {
      const serviceWorkerName = safariManifest.background.service_worker;
      safariManifest.background = {
        "page": "background-safari.html"
      };
      
      // Create a background HTML page that loads the service worker as a script
      const backgroundHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script type="module" src="${serviceWorkerName}"></script>
</head>
<body>
</body>
</html>`;
      
      fs.writeFileSync(join(PACKAGE_DIR, 'background-safari.html'), backgroundHtml);
    }
    
    // Safari iOS has some permission differences
    if (safariManifest.permissions) {
      // Filter out permissions not supported in Safari
      const supportedPermissions = [
        "activeTab", 
        "scripting", 
        "tabs", 
        "storage"
      ];
      
      safariManifest.permissions = safariManifest.permissions.filter(
        permission => supportedPermissions.includes(permission)
      );
    }
    
    // Write the Safari manifest
    fs.writeFileSync(
      join(PACKAGE_DIR, 'safari-manifest.json'), 
      JSON.stringify(safariManifest, null, 2)
    );
    
    // Create Safari extension zip for inclusion in Xcode project
    await execAsync(`cd "${PACKAGE_DIR}" && zip -r ../safari-extension.zip ./*`);
    
    // Copy the Safari extension zip to the Safari iOS directory
    await cp(
      join(ROOT_DIR, 'safari-extension.zip'),
      join(SAFARI_DIR, 'safari-extension.zip'),
      { recursive: true }
    ).catch(err => {
      console.warn(`Warning: Could not copy safari-extension.zip: ${err.message}`);
    });
    
    // Clean up
    await rm(PACKAGE_DIR, { recursive: true });
    
    console.log('Extension packages created: chrome-extension.zip, firefox-extension.xpi, and safari-extension.zip');
  } catch (error) {
    console.error('Error building extension:', error);
    process.exit(1);
  }
}

main();