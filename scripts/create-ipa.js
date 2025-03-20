const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// This script assumes it's being run from the root of the project
const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const extensionDir = path.join(rootDir, 'extension/ChronicleSync');
const artifactsDir = path.join(extensionDir, 'artifacts');

// Ensure the artifacts directory exists
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

// Function to copy webpack build output to the Xcode project
function copyWebpackBuildToXcode() {
  console.log('Copying webpack build to Xcode project...');
  
  // Target directory in the Xcode project
  const targetDir = path.join(extensionDir, 'Shared (Extension)/Resources');
  
  // Ensure the target directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Copy all files from dist to the target directory
  execSync(`cp -R ${distDir}/* "${targetDir}/"`);
  
  console.log('Webpack build copied to Xcode project successfully.');
}

// Main function to create the IPA
async function createIPA() {
  try {
    // First, copy the webpack build to the Xcode project
    copyWebpackBuildToXcode();
    
    console.log('Building IPA...');
    
    // Change to the extension directory
    process.chdir(extensionDir);
    
    // Find available iPhone simulator
    const availableSimulator = execSync('xcrun simctl list devices available | grep "iPhone" | grep -v "unavailable" | head -1').toString();
    const simulatorUDID = availableSimulator.match(/\(([A-F0-9-]+)\)/)[1];
    
    console.log(`Using simulator with UDID: ${simulatorUDID}`);
    
    // Build for iPhone simulator
    execSync(`xcodebuild -scheme "ChronicleSync (iOS)" -sdk iphonesimulator -destination "platform=iOS Simulator,id=${simulatorUDID}" -configuration Debug -derivedDataPath build clean build`);
    
    // Create Payload directory
    if (!fs.existsSync('Payload')) {
      fs.mkdirSync('Payload');
    }
    
    // Copy the app bundle
    execSync('cp -r build/Build/Products/Debug-iphonesimulator/ChronicleSync.app Payload/');
    
    // Create the IPA
    execSync('zip -r ChronicleSync-Simulator.ipa Payload');
    
    // Move to artifacts directory
    execSync(`mv ChronicleSync-Simulator.ipa ${artifactsDir}/`);
    
    console.log(`IPA created successfully at: ${path.join(artifactsDir, 'ChronicleSync-Simulator.ipa')}`);
    
  } catch (error) {
    console.error('Error creating IPA:', error.message);
    process.exit(1);
  }
}

// Run the main function
createIPA();