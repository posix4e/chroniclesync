/* eslint-disable no-console */
const { mkdir, rm, cp, writeFile, readFile } = require('fs/promises');
const { existsSync } = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const { join } = require('path');

const execAsync = promisify(exec);
const ROOT_DIR = join(__dirname, '..');  // Extension root directory
const PACKAGE_DIR = join(ROOT_DIR, 'package');
const SAFARI_DIR = join(ROOT_DIR, 'safari');
const SAFARI_APP_DIR = join(SAFARI_DIR, 'ChronicleSync');

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

async function createInfoPlist() {
  const manifestPath = join(PACKAGE_DIR, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  
  const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>${manifest.name}</string>
    <key>CFBundleIdentifier</key>
    <string>xyz.chroniclesync.safari-extension</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleVersion</key>
    <string>${manifest.version}</string>
    <key>CFBundleShortVersionString</key>
    <string>${manifest.version}</string>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2023 ChronicleSync. All rights reserved.</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.Safari.web-extension</string>
        <key>NSExtensionPrincipalClass</key>
        <string>$(PRODUCT_MODULE_NAME).SafariWebExtensionHandler</string>
    </dict>
</dict>
</plist>`;

  await writeFile(join(SAFARI_DIR, 'Info.plist'), infoPlist);
}

async function createSafariAppStructure() {
  // Create basic Xcode project structure for Safari App Extension
  await mkdir(SAFARI_APP_DIR, { recursive: true });
  await mkdir(join(SAFARI_APP_DIR, 'Resources'), { recursive: true });
  await mkdir(join(SAFARI_APP_DIR, 'Resources', 'WebExtension'), { recursive: true });
  
  // Copy extension files to WebExtension directory
  for (const [src, dest] of filesToCopy) {
    await cp(
      join(PACKAGE_DIR, dest),
      join(SAFARI_APP_DIR, 'Resources', 'WebExtension', dest),
      { recursive: true }
    ).catch(err => {
      console.warn(`Warning: Could not copy ${dest}: ${err.message}`);
    });
  }
  
  // Create Safari-specific manifest
  const manifestPath = join(PACKAGE_DIR, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  
  // Modify manifest for Safari
  manifest.browser_specific_settings = {
    "safari": {
      "strict_min_version": "14.0"
    }
  };
  
  // Write the updated manifest
  await writeFile(
    join(SAFARI_APP_DIR, 'Resources', 'WebExtension', 'manifest.json'), 
    JSON.stringify(manifest, null, 2)
  );
  
  // Create Info.plist for the Safari extension
  await createInfoPlist();
}

async function main() {
  try {
    // Clean up any existing package and safari directories
    await rm(PACKAGE_DIR, { recursive: true, force: true });
    await rm(SAFARI_DIR, { recursive: true, force: true });
    
    // Create package directory
    await mkdir(PACKAGE_DIR, { recursive: true });
    await mkdir(SAFARI_DIR, { recursive: true });
    
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
    
    // Create Safari extension structure
    console.log('Creating Safari extension structure...');
    await createSafariAppStructure();
    
    console.log('Safari extension structure created successfully');
  } catch (error) {
    console.error('Error building Safari extension:', error);
    process.exit(1);
  }
}

main();