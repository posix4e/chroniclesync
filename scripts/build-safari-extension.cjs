#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const EXTENSION_DIR = path.join(__dirname, '..', 'extension');
const IOS_DIR = path.join(__dirname, '..', 'ios');
const SAFARI_RESOURCES_DIR = path.join(IOS_DIR, 'ChronicleSync', 'Extension', 'Resources');

// Ensure Safari resources directory exists
if (!fs.existsSync(SAFARI_RESOURCES_DIR)) {
  fs.mkdirSync(SAFARI_RESOURCES_DIR, { recursive: true });
}

// Build the extension with Vite
console.log('Building extension with Vite...');
execSync('npm run build', { cwd: EXTENSION_DIR, stdio: 'inherit' });

// Read the Chrome manifest
const manifestPath = path.join(EXTENSION_DIR, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Create Safari manifest.json (WebExtension format)
const safariManifest = {
  manifest_version: manifest.manifest_version,
  name: manifest.name,
  version: manifest.version,
  description: manifest.description,
  icons: manifest.icons,
  background: {
    scripts: ['background.js'],
    persistent: false
  },
  content_scripts: manifest.content_scripts,
  browser_action: {
    default_popup: 'popup.html',
    default_icon: manifest.icons
  },
  permissions: manifest.permissions.filter(p => p !== 'scripting'), // Safari doesn't support scripting API
  web_accessible_resources: manifest.web_accessible_resources
};

// Write Safari manifest
fs.writeFileSync(
  path.join(SAFARI_RESOURCES_DIR, 'manifest.json'),
  JSON.stringify(safariManifest, null, 2)
);

// Copy built files to Safari extension
console.log('Copying built files to Safari extension...');
const distDir = path.join(EXTENSION_DIR, 'dist');
const filesToCopy = [
  'background.js',
  'content-script.js',
  'popup.html',
  'popup.js',
  'popup.css',
  'settings.html',
  'settings.js',
  'settings.css',
  'history.html',
  'history.js',
  'history.css'
];

filesToCopy.forEach(file => {
  const sourcePath = path.join(distDir, file);
  const destPath = path.join(SAFARI_RESOURCES_DIR, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied ${file} to Safari extension`);
  } else {
    console.warn(`Warning: ${file} not found in dist directory`);
  }
});

// Create Info.plist for Safari extension
const infoPlistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>ChronicleSync</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>$(MARKETING_VERSION)</string>
    <key>CFBundleVersion</key>
    <string>$(CURRENT_PROJECT_VERSION)</string>
    <key>LSMinimumSystemVersion</key>
    <string>$(MACOSX_DEPLOYMENT_TARGET)</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.Safari.web-extension</string>
        <key>NSExtensionPrincipalClass</key>
        <string>$(PRODUCT_MODULE_NAME).SafariWebExtensionHandler</string>
    </dict>
</dict>
</plist>`;

fs.writeFileSync(
  path.join(IOS_DIR, 'ChronicleSync', 'Extension', 'Info.plist'),
  infoPlistContent
);

console.log('Safari extension build completed successfully!');