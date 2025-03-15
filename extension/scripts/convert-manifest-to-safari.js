import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.join(__dirname, '..');
const SAFARI_DIR = path.join(ROOT_DIR, 'safari');
const SAFARI_PROJECT_DIR = path.join(SAFARI_DIR, 'ChronicleSync');
const SAFARI_EXTENSION_DIR = path.join(SAFARI_PROJECT_DIR, 'ChronicleSync Extension');
const SAFARI_RESOURCES_DIR = path.join(SAFARI_EXTENSION_DIR, 'Resources');

// Read the manifest.json file
const manifestPath = path.join(SAFARI_RESOURCES_DIR, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

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