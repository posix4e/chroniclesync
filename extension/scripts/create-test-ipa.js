#!/usr/bin/env node

/**
 * Script to create a test IPA file for iOS simulator testing
 * This script creates a properly structured iOS app bundle that can be installed in a simulator
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const APP_NAME = 'ChronicleSync';
const BUNDLE_ID = 'com.chroniclesync.safari-extension';
const OUTPUT_DIR = path.join(process.cwd(), 'ipa-output');
const APP_BUNDLE_PATH = path.join(OUTPUT_DIR, 'Payload', `${APP_NAME}.app`);

// Create directory structure
console.log('Creating directory structure...');
fs.mkdirSync(path.join(OUTPUT_DIR, 'Payload', `${APP_NAME}.app`), { recursive: true });

// Create Info.plist
console.log('Creating Info.plist...');
const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>${BUNDLE_ID}</string>
    <key>CFBundleExecutable</key>
    <string>${APP_NAME}</string>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleDisplayName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>MinimumOSVersion</key>
    <string>14.0</string>
    <key>UIDeviceFamily</key>
    <array>
        <integer>1</integer>
        <integer>2</integer>
    </array>
</dict>
</plist>`;

fs.writeFileSync(path.join(APP_BUNDLE_PATH, 'Info.plist'), infoPlist);

// Create executable
console.log('Creating executable...');
const executableContent = `#!/bin/sh
echo "${APP_NAME} Safari Extension Dummy App"
`;
fs.writeFileSync(path.join(APP_BUNDLE_PATH, APP_NAME), executableContent);
fs.chmodSync(path.join(APP_BUNDLE_PATH, APP_NAME), '755'); // Make executable

// Create PkgInfo
console.log('Creating PkgInfo...');
fs.writeFileSync(path.join(APP_BUNDLE_PATH, 'PkgInfo'), 'APPL????');

// Create empty embedded.mobileprovision
console.log('Creating placeholder embedded.mobileprovision...');
fs.writeFileSync(path.join(APP_BUNDLE_PATH, 'embedded.mobileprovision'), '');

// Create ResourceRules.plist
console.log('Creating ResourceRules.plist...');
const resourceRulesPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>rules</key>
    <dict>
        <key>.*</key>
        <true/>
        <key>Info.plist</key>
        <false/>
        <key>ResourceRules.plist</key>
        <false/>
    </dict>
</dict>
</plist>`;
fs.writeFileSync(path.join(APP_BUNDLE_PATH, 'ResourceRules.plist'), resourceRulesPlist);

// Create a simple UI structure
console.log('Creating basic UI resources...');
fs.mkdirSync(path.join(APP_BUNDLE_PATH, 'Base.lproj'), { recursive: true });
fs.writeFileSync(path.join(APP_BUNDLE_PATH, 'Base.lproj', 'LaunchScreen.storyboard'), '<storyboard/>');

// Create Assets.xcassets directory with placeholder
fs.mkdirSync(path.join(APP_BUNDLE_PATH, 'Assets.xcassets'), { recursive: true });
fs.writeFileSync(path.join(APP_BUNDLE_PATH, 'Assets.xcassets', 'Contents.json'), '{}');

// Create the IPA file
console.log('Creating IPA file...');
const currentDir = process.cwd();
process.chdir(OUTPUT_DIR);
execSync('zip -r ChronicleSync.ipa Payload');
process.chdir(currentDir);

// Verify the IPA structure
console.log('Verifying IPA structure...');
try {
  // Create a temporary directory for verification
  const verifyDir = path.join(OUTPUT_DIR, 'verify');
  fs.mkdirSync(verifyDir, { recursive: true });
  
  // Unzip the IPA
  execSync(`unzip -q -o "${path.join(OUTPUT_DIR, 'ChronicleSync.ipa')}" -d "${verifyDir}"`);
  
  // Check for Payload directory
  if (!fs.existsSync(path.join(verifyDir, 'Payload'))) {
    throw new Error('Generated IPA file does not contain a Payload directory');
  }
  
  // Check for app bundle
  const appBundles = fs.readdirSync(path.join(verifyDir, 'Payload'))
    .filter(file => file.endsWith('.app'));
  
  if (appBundles.length === 0) {
    throw new Error('No .app bundle found in the IPA file');
  }
  
  // Check for Info.plist
  if (!fs.existsSync(path.join(verifyDir, 'Payload', appBundles[0], 'Info.plist'))) {
    throw new Error('No Info.plist found in the app bundle');
  }
  
  // Check for executable
  if (!fs.existsSync(path.join(verifyDir, 'Payload', appBundles[0], APP_NAME))) {
    throw new Error(`No executable '${APP_NAME}' found in the app bundle`);
  }
  
  console.log('IPA verification passed. App bundle structure is valid.');
  
  // Clean up verification directory
  execSync(`rm -rf "${verifyDir}"`);
} catch (error) {
  console.error('IPA verification failed:', error.message);
  process.exit(1);
}

console.log(`Successfully created test IPA at: ${path.join(OUTPUT_DIR, 'ChronicleSync.ipa')}`);