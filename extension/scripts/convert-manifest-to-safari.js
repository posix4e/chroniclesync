import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const SAFARI_DIR = path.join(ROOT_DIR, 'safari');
const SAFARI_PROJECT_DIR = path.join(SAFARI_DIR, 'ChronicleSync');
const SAFARI_EXTENSION_DIR = path.join(SAFARI_PROJECT_DIR, 'ChronicleSync Extension');
const SAFARI_RESOURCES_DIR = path.join(SAFARI_EXTENSION_DIR, 'Resources');

// Create directories if they don't exist
if (!fs.existsSync(SAFARI_DIR)) {
  fs.mkdirSync(SAFARI_DIR, { recursive: true });
}
if (!fs.existsSync(SAFARI_PROJECT_DIR)) {
  fs.mkdirSync(SAFARI_PROJECT_DIR, { recursive: true });
}
if (!fs.existsSync(SAFARI_EXTENSION_DIR)) {
  fs.mkdirSync(SAFARI_EXTENSION_DIR, { recursive: true });
}
if (!fs.existsSync(SAFARI_RESOURCES_DIR)) {
  fs.mkdirSync(SAFARI_RESOURCES_DIR, { recursive: true });
}

// Check if manifest.json exists, if not create a placeholder
const manifestPath = path.join(SAFARI_RESOURCES_DIR, 'manifest.json');
let manifest;

if (fs.existsSync(manifestPath)) {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} else {
  // Create a placeholder manifest.json
  manifest = {
    'manifest_version': 3,
    'name': 'ChronicleSync Extension',
    'version': '1.0',
    'description': 'ChronicleSync Safari Extension',
    'action': {
      'default_popup': 'popup.html'
    },
    'permissions': [
      'activeTab',
      'scripting',
      'tabs',
      'history',
      'storage',
      'unlimitedStorage'
    ]
  };
  
  // Write the placeholder manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  // eslint-disable-next-line no-console
  console.log('Created placeholder manifest.json');
}

// Convert manifest to Safari format
// Safari requires a different format for some properties
const safariManifest = {
  ...manifest,
  // Safari specific changes
  'browser_specific_settings': {
    'safari': {
      'strict_min_version': '15.0'
    }
  }
};

// Remove properties not supported by Safari
delete safariManifest.devtools_page;

// Write the updated manifest
fs.writeFileSync(manifestPath, JSON.stringify(safariManifest, null, 2));

// eslint-disable-next-line no-console
console.log('Manifest converted to Safari format');

// Create Info.plist for the Safari extension
const infoPlistPath = path.join(SAFARI_RESOURCES_DIR, 'Info.plist');
const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDisplayName</key>
  <string>${manifest.name}</string>
  <key>CFBundleIdentifier</key>
  <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>${manifest.name}</string>
  <key>CFBundleShortVersionString</key>
  <string>${manifest.version}</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>NSExtension</key>
  <dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.Safari.web-extension</string>
  </dict>
</dict>
</plist>`;

fs.writeFileSync(infoPlistPath, infoPlist);
// eslint-disable-next-line no-console
console.log('Info.plist created for Safari extension');