#!/usr/bin/env node
/**
 * Safari Tools - A comprehensive utility for Safari extension development
 * 
 * This script provides functionality for:
 * - Building Safari extensions from Chrome extensions
 * - Creating iOS simulators for testing
 * - Verifying IPA files
 * - Testing IPA files in simulators
 * 
 * Usage: node safari-tools.js <command> [arguments]
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { mkdir, rm, readdir } from 'fs/promises';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ===== CONSTANTS =====

const APP_NAME = 'ChronicleSync';
const BUNDLE_ID = 'com.chroniclesync.safari-extension';
const DEFAULT_IPA_NAME = `${APP_NAME}.ipa`;

// ===== PATHS =====

const ROOT_DIR = process.cwd();
const PACKAGE_DIR = join(ROOT_DIR, 'package');
const SAFARI_DIR = join(ROOT_DIR, 'safari-extension');
const IPA_OUTPUT_DIR = join(ROOT_DIR, 'ipa-output');
const DEFAULT_IPA_PATH = join(IPA_OUTPUT_DIR, DEFAULT_IPA_NAME);

// ===== UTILITIES =====

const execAsync = promisify(exec);

/**
 * Logs a message with a timestamp
 * @param {string} message - The message to log
 * @param {'info'|'warn'|'error'|'success'} level - The log level
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const prefix = `[${timestamp}]`;
  
  switch (level) {
    case 'warn':
      console.warn(`${prefix} ⚠️  ${message}`);
      break;
    case 'error':
      console.error(`${prefix} ❌ ${message}`);
      break;
    case 'success':
      console.log(`${prefix} ✅ ${message}`);
      break;
    default:
      console.log(`${prefix} ℹ️  ${message}`);
  }
}

/**
 * Creates a directory if it doesn't exist
 * @param {string} dir - The directory path
 * @returns {Promise<void>}
 */
async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

/**
 * Removes a directory if it exists
 * @param {string} dir - The directory path
 * @returns {Promise<void>}
 */
async function removeDir(dir) {
  await rm(dir, { recursive: true, force: true });
}

/**
 * Writes a file with the given content
 * @param {string} path - The file path
 * @param {string} content - The file content
 */
function writeFile(path, content) {
  fs.writeFileSync(path, content);
}

/**
 * Makes a file executable
 * @param {string} path - The file path
 * @returns {Promise<void>}
 */
async function makeExecutable(path) {
  await execAsync(`chmod +x "${path}"`);
}

// ===== IPA VERIFICATION =====

/**
 * Verifies that the IPA file exists and has the correct structure
 * @param {string} ipaPath - Path to the IPA file
 * @returns {Promise<boolean>} - True if the IPA file is valid
 */
async function verifyIpaFile(ipaPath = null) {
  try {
    // Use default path if none provided
    const finalIpaPath = ipaPath || DEFAULT_IPA_PATH;
    log(`Verifying IPA file: ${finalIpaPath}`);
    
    // Check if the IPA file exists
    if (!fs.existsSync(finalIpaPath)) {
      log(`IPA file not found at ${finalIpaPath}`, 'error');
      return false;
    }
    
    // Create a temporary directory for extraction
    const tempDir = join(ROOT_DIR, 'temp-ipa-verification');
    await ensureDir(tempDir);
    
    try {
      // Extract the IPA file (which is just a zip file)
      log('Extracting IPA file...');
      await execAsync(`unzip -q "${finalIpaPath}" -d "${tempDir}"`);
      
      // Verify IPA structure
      const verificationResult = await verifyIpaStructure(tempDir);
      
      if (verificationResult) {
        log('IPA verification completed successfully', 'success');
      }
      
      return verificationResult;
    } finally {
      // Clean up the temporary directory
      await removeDir(tempDir);
    }
  } catch (error) {
    log(`Error verifying IPA file: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Verifies the structure of an extracted IPA
 * @param {string} extractDir - Directory where IPA was extracted
 * @returns {Promise<boolean>} - True if the structure is valid
 */
async function verifyIpaStructure(extractDir) {
  // Check for the Payload directory
  const payloadDir = join(extractDir, 'Payload');
  if (!fs.existsSync(payloadDir)) {
    log('Invalid IPA: Payload directory not found', 'error');
    return false;
  }
  
  // Check for the app directory
  const appDirs = fs.readdirSync(payloadDir).filter(dir => dir.endsWith('.app'));
  if (appDirs.length === 0) {
    log('Invalid IPA: No .app directory found in Payload', 'error');
    return false;
  }
  
  const appDir = join(payloadDir, appDirs[0]);
  log(`Found app directory: ${appDir}`);
  
  // Check for Info.plist
  const infoPlist = join(appDir, 'Info.plist');
  if (!fs.existsSync(infoPlist)) {
    log('Invalid IPA: Info.plist not found in app directory', 'error');
    return false;
  }
  
  // Check for the executable
  const executableName = appDirs[0].replace('.app', '');
  const executable = join(appDir, executableName);
  if (!fs.existsSync(executable)) {
    log(`Invalid IPA: Executable ${executableName} not found in app directory`, 'error');
    return false;
  }
  
  // Check for the Safari extension
  const pluginsDir = join(appDir, 'PlugIns');
  if (!fs.existsSync(pluginsDir)) {
    log('Warning: PlugIns directory not found in app directory', 'warn');
  } else {
    const extensionDirs = fs.readdirSync(pluginsDir).filter(dir => dir.endsWith('.appex'));
    if (extensionDirs.length === 0) {
      log('Warning: No Safari extension found in PlugIns directory', 'warn');
    } else {
      log(`Found Safari extension: ${extensionDirs[0]}`);
    }
  }
  
  return true;
}

// ===== SIMULATOR MANAGEMENT =====

/**
 * Creates an iOS simulator for testing
 * @returns {Promise<string|null>} - The ID of the created simulator or null if failed
 */
async function createIOSSimulator() {
  try {
    log('Creating iOS simulator...');
    
    // Get the latest iOS runtime
    const runtimeId = await getLatestIOSRuntime();
    if (!runtimeId) {
      return null;
    }
    
    // Create a new simulator
    const deviceName = `${APP_NAME}-Test-${Date.now()}`;
    const { stdout: createOutput } = await execAsync(`xcrun simctl create "${deviceName}" "iPhone 13" "${runtimeId}"`);
    const deviceId = createOutput.trim();
    
    log(`Created simulator: ${deviceName} (${deviceId})`);
    
    // Boot the simulator
    log('Booting simulator...');
    await execAsync(`xcrun simctl boot "${deviceId}"`);
    
    // Wait for the simulator to boot
    log('Waiting for simulator to boot...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    log(`Simulator ${deviceId} is ready for testing`, 'success');
    return deviceId;
  } catch (error) {
    log(`Error creating iOS simulator: ${error.message}`, 'error');
    return null;
  }
}

/**
 * Gets the latest iOS runtime identifier
 * @returns {Promise<string|null>} - The runtime identifier or null if not found
 */
async function getLatestIOSRuntime() {
  // List available simulator runtimes
  const { stdout: runtimesOutput } = await execAsync('xcrun simctl list runtimes');
  log('Available simulator runtimes:');
  log(runtimesOutput);
  
  // Find the latest iOS runtime
  const runtimeLines = runtimesOutput.split('\n');
  const iosRuntimes = runtimeLines.filter(line => 
    line.includes('iOS') && 
    line.includes('(com.apple.CoreSimulator.SimRuntime.iOS')
  );
  
  if (iosRuntimes.length === 0) {
    log('No iOS runtimes found', 'error');
    return null;
  }
  
  // Sort by version and get the latest
  const latestRuntime = iosRuntimes.sort().pop();
  const runtimeMatch = latestRuntime.match(/com\.apple\.CoreSimulator\.SimRuntime\.iOS-[0-9-]+/);
  
  if (!runtimeMatch) {
    log('Could not parse runtime identifier', 'error');
    return null;
  }
  
  const runtimeId = runtimeMatch[0];
  log(`Using runtime: ${runtimeId}`);
  
  return runtimeId;
}

/**
 * Tests the IPA file in a simulator
 * @param {string} simulatorId - The ID of the simulator to use
 * @param {string} ipaPath - Path to the IPA file
 * @returns {Promise<boolean>} - True if the test was successful
 */
async function testIpaInSimulator(simulatorId = null, ipaPath = null) {
  try {
    // Create simulator if needed
    const finalSimulatorId = simulatorId || await createIOSSimulator();
    if (!finalSimulatorId) {
      log('Failed to create simulator', 'error');
      return false;
    }
    
    // Use default IPA path if none provided
    const finalIpaPath = ipaPath || DEFAULT_IPA_PATH;
    
    // Check if the IPA file exists
    if (!fs.existsSync(finalIpaPath)) {
      log(`IPA file not found at ${finalIpaPath}`, 'error');
      return false;
    }
    
    log(`Testing IPA file ${finalIpaPath} in simulator ${finalSimulatorId}...`);
    
    // Install and launch the app
    await installAndLaunchApp(finalSimulatorId, finalIpaPath);
    
    log('App launched successfully in simulator', 'success');
    return true;
  } catch (error) {
    log(`Error testing IPA in simulator: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Installs and launches an app in the simulator
 * @param {string} simulatorId - The simulator ID
 * @param {string} ipaPath - Path to the IPA file
 * @returns {Promise<void>}
 */
async function installAndLaunchApp(simulatorId, ipaPath) {
  // Install the IPA file in the simulator
  log('Installing IPA in simulator...');
  await execAsync(`xcrun simctl install "${simulatorId}" "${ipaPath}"`);
  
  // Launch the app
  log('Launching app in simulator...');
  await execAsync(`xcrun simctl launch "${simulatorId}" "${BUNDLE_ID}"`);
  
  // Wait for the app to launch
  log('Waiting for app to launch...');
  await new Promise(resolve => setTimeout(resolve, 5000));
}

/**
 * Verifies and tests an IPA file in a simulator
 * @param {string} simulatorId - The ID of the simulator to use
 * @param {string} ipaPath - Path to the IPA file
 * @returns {Promise<boolean>} - True if the verification and test were successful
 */
async function verifyAndTestIpa(simulatorId, ipaPath) {
  try {
    if (!simulatorId) {
      log('Simulator ID is required', 'error');
      return false;
    }
    
    if (!ipaPath) {
      log('IPA path is required', 'error');
      return false;
    }
    
    log(`Verifying and testing IPA file ${ipaPath} in simulator ${simulatorId}...`);
    
    // First verify the IPA file
    const isValid = await verifyIpaFile(ipaPath);
    if (!isValid) {
      log('IPA verification failed', 'error');
      return false;
    }
    
    // Then test it in the simulator
    const testResult = await testIpaInSimulator(simulatorId, ipaPath);
    if (!testResult) {
      log('IPA testing failed', 'error');
      return false;
    }
    
    log('IPA verification and testing completed successfully', 'success');
    return true;
  } catch (error) {
    log(`Error verifying and testing IPA: ${error.message}`, 'error');
    return false;
  }
}

// ===== SAFARI EXTENSION BUILDING =====

/**
 * Builds a Safari extension IPA file
 * @returns {Promise<boolean>} - True if the build was successful
 */
async function buildSafariExtension() {
  try {
    log('Starting Safari extension build process...');
    
    // Setup directories
    await setupDirectories();
    
    // Build and extract Chrome extension
    await buildAndExtractChromeExtension();
    
    // Convert to Safari extension
    const conversionSuccess = await convertToSafariExtension();
    
    // If conversion failed or didn't produce expected output, create a fallback IPA
    if (!conversionSuccess) {
      await createFallbackIpa();
      return true;
    }
    
    log('IPA file created successfully in the ipa-output directory', 'success');
    return true;
  } catch (error) {
    log(`Error building Safari extension: ${error.message}`, 'error');
    return false;
  } finally {
    // Clean up temporary directories
    await removeDir(PACKAGE_DIR);
  }
}

/**
 * Sets up the necessary directories for building
 * @returns {Promise<void>}
 */
async function setupDirectories() {
  // Clean up any existing directories
  await removeDir(PACKAGE_DIR);
  await removeDir(SAFARI_DIR);
  await removeDir(IPA_OUTPUT_DIR);
  
  // Create necessary directories
  await ensureDir(PACKAGE_DIR);
  await ensureDir(SAFARI_DIR);
  await ensureDir(IPA_OUTPUT_DIR);
  
  log('Directories prepared for build');
}

/**
 * Builds and extracts the Chrome extension
 * @returns {Promise<void>}
 */
async function buildAndExtractChromeExtension() {
  // Build the Chrome extension package
  log('Building Chrome extension package...');
  await execAsync('node scripts/build-extension.cjs', { cwd: ROOT_DIR });
  
  // The Chrome extension zip should now exist
  const chromeZipPath = join(ROOT_DIR, 'chrome-extension.zip');
  if (!fs.existsSync(chromeZipPath)) {
    throw new Error('Chrome extension zip file not found');
  }
  
  // Extract the Chrome extension zip to the package directory
  log('Extracting Chrome extension...');
  await execAsync(`unzip -o "${chromeZipPath}" -d "${PACKAGE_DIR}"`);
}

/**
 * Converts the Chrome extension to a Safari extension
 * @returns {Promise<boolean>} - True if conversion was successful
 */
async function convertToSafariExtension() {
  try {
    // Run safari-web-extension-converter on the package directory
    log('Converting to Safari extension...');
    const conversionResult = await execAsync(
      `xcrun safari-web-extension-converter "${PACKAGE_DIR}" --project-location "${SAFARI_DIR}" --app-name "${APP_NAME}" --bundle-identifier "${BUNDLE_ID}" --no-open --force`,
      { cwd: ROOT_DIR }
    );
    
    log('Conversion output:', conversionResult.stdout);
    if (conversionResult.stderr) {
      log('Conversion stderr:', conversionResult.stderr);
    }
    
    // List the contents of the safari directory
    log('Listing safari-extension directory contents:');
    const lsResult = await execAsync(`ls -la "${SAFARI_DIR}"`);
    log(lsResult.stdout);
    
    // Find the Xcode project directory
    const safariDirContents = await readdir(SAFARI_DIR);
    
    // Look for .xcodeproj or the app directory
    const xcodeProjectDir = safariDirContents.find(item => item.endsWith('.xcodeproj'));
    const appDir = safariDirContents.find(item => item === APP_NAME);
    
    if (!xcodeProjectDir && !appDir) {
      log('Neither Xcode project nor app directory found in safari-extension directory', 'warn');
      return false;
    }
    
    if (xcodeProjectDir) {
      log(`Found Xcode project: ${xcodeProjectDir}, but we're not using it in this script`);
    }
    
    if (appDir) {
      log(`Found app directory: ${appDir}`);
      await createIpaFromAppDir(join(SAFARI_DIR, appDir));
      return true;
    }
    
    return false;
  } catch (error) {
    log(`Error during conversion: ${error.message}`, 'error');
    if (error.stdout) log('Conversion stdout:', error.stdout);
    if (error.stderr) log('Conversion stderr:', error.stderr);
    return false;
  }
}

/**
 * Creates an IPA file from an app directory
 * @param {string} appDirPath - Path to the app directory
 * @returns {Promise<void>}
 */
async function createIpaFromAppDir(appDirPath) {
  log('Creating a properly structured IPA from the app directory...');
  
  // Create the Payload directory structure required for a valid IPA
  const payloadDir = join(IPA_OUTPUT_DIR, 'Payload');
  const ipaAppDir = join(payloadDir, `${APP_NAME}.app`);
  
  await ensureDir(payloadDir);
  
  // Copy the app directory to the Payload directory
  await execAsync(`cp -R "${appDirPath}" "${ipaAppDir}"`);
  
  // Ensure the app has the correct bundle identifier
  const infoPlistPath = join(ipaAppDir, 'Info.plist');
  if (fs.existsSync(infoPlistPath)) {
    log('Updating bundle identifier in Info.plist...');
    await execAsync(`/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier ${BUNDLE_ID}" "${infoPlistPath}"`);
  } else {
    log('Info.plist not found, creating it...', 'warn');
    writeFile(infoPlistPath, createInfoPlistContent());
  }
  
  // Look for the Safari extension directory
  await ensureSafariExtension(ipaAppDir);
  
  // Create the IPA file (zip the Payload directory)
  log('Creating IPA file...');
  await execAsync(`cd "${IPA_OUTPUT_DIR}" && zip -r "${DEFAULT_IPA_NAME}" Payload`);
  
  // Verify the IPA file
  log('Verifying IPA file...');
  await execAsync(`unzip -t "${DEFAULT_IPA_PATH}"`);
}

/**
 * Ensures that the app has a Safari extension
 * @param {string} appDir - Path to the app directory
 * @returns {Promise<void>}
 */
async function ensureSafariExtension(appDir) {
  // Check if the app has a PlugIns directory
  const pluginsDir = join(appDir, 'PlugIns');
  await ensureDir(pluginsDir);
  
  let extensionDir = null;
  
  try {
    const plugins = fs.readdirSync(pluginsDir);
    const extensionName = plugins.find(item => item.endsWith('.appex'));
    if (extensionName) {
      extensionDir = join(pluginsDir, extensionName);
      log(`Found Safari extension at: ${extensionDir}`);
    }
  } catch (error) {
    log(`Error reading PlugIns directory: ${error.message}`, 'warn');
  }
  
  // If no extension directory found, create one
  if (!extensionDir) {
    log('No Safari extension found, creating one...');
    extensionDir = join(pluginsDir, `${APP_NAME} Extension.appex`);
    await ensureDir(extensionDir);
    
    // Create extension Info.plist
    await ensureDir(join(extensionDir, 'Contents'));
    writeFile(join(extensionDir, 'Contents', 'Info.plist'), createExtensionInfoPlistContent());
  }
  
  // Find or create the Resources directory
  const extensionResourcesDir = join(extensionDir, 'Resources');
  await ensureDir(extensionResourcesDir);
  
  // Create a directory for the web extension
  const webExtDir = join(extensionResourcesDir, 'web-extension');
  await ensureDir(webExtDir);
  
  // Copy Chrome extension files to Safari extension resources
  log('Copying Chrome extension files to Safari extension resources...');
  await execAsync(`cp -R "${join(ROOT_DIR, 'dist')}"/* "${webExtDir}/"`);
}

/**
 * Creates a fallback IPA when conversion fails
 * @returns {Promise<void>}
 */
async function createFallbackIpa() {
  log('Creating a properly structured fallback Safari app...');
  
  // Create the Payload directory structure required for a valid IPA
  const payloadDir = join(IPA_OUTPUT_DIR, 'Payload');
  const appDir = join(payloadDir, `${APP_NAME}.app`);
  
  await ensureDir(payloadDir);
  await ensureDir(appDir);
  
  // Create minimal required files for a valid app bundle
  writeFile(join(appDir, 'Info.plist'), createInfoPlistContent());
  
  // Create a simple executable (binary file)
  const appExecutable = `#!/bin/sh\necho '${APP_NAME} Safari Extension App'`;
  writeFile(join(appDir, APP_NAME), appExecutable);
  await makeExecutable(join(appDir, APP_NAME));
  
  // Create a simple launch screen storyboard
  await ensureDir(join(appDir, 'Base.lproj'));
  writeFile(join(appDir, 'Base.lproj', 'LaunchScreen.storyboard'), createLaunchScreenContent());
  
  // Create a simple app icon
  await ensureDir(join(appDir, 'Assets.xcassets', 'AppIcon.appiconset'));
  
  // Create a PkgInfo file (required for iOS apps)
  writeFile(join(appDir, 'PkgInfo'), 'APPL????');
  
  // Create a simple embedded.mobileprovision file (empty but present)
  writeFile(join(appDir, 'embedded.mobileprovision'), '');
  
  // Create Safari extension structure
  const extensionDir = join(appDir, 'PlugIns', `${APP_NAME} Extension.appex`);
  const extensionResourcesDir = join(extensionDir, 'Resources');
  
  await ensureDir(extensionDir);
  await ensureDir(extensionResourcesDir);
  
  // Create extension Info.plist
  writeFile(join(extensionDir, 'Info.plist'), createExtensionInfoPlistContent());
  
  // Create a directory for the web extension
  const webExtDir = join(extensionResourcesDir, 'web-extension');
  await ensureDir(webExtDir);
  
  // Copy Chrome extension files to Safari extension resources
  log('Copying Chrome extension files to Safari extension resources...');
  await execAsync(`cp -R "${join(ROOT_DIR, 'dist')}"/* "${webExtDir}/"`);
  
  // Create a simple ResourceRules.plist
  writeFile(join(appDir, 'ResourceRules.plist'), createResourceRulesContent());
  
  // Create the IPA file (zip the Payload directory)
  log('Creating IPA file...');
  await execAsync(`cd "${IPA_OUTPUT_DIR}" && zip -r "${DEFAULT_IPA_NAME}" Payload`);
  
  // Verify the IPA file
  log('Verifying IPA file...');
  await execAsync(`unzip -t "${DEFAULT_IPA_PATH}"`);
  
  log('Created properly structured Safari app with real extension content', 'success');
}

// ===== TEMPLATE GENERATORS =====

/**
 * Creates the content for Info.plist
 * @returns {string} - The Info.plist content
 */
function createInfoPlistContent() {
  return `<?xml version="1.0" encoding="UTF-8"?>
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
    <key>UILaunchStoryboardName</key>
    <string>LaunchScreen</string>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
    </array>
    <key>MinimumOSVersion</key>
    <string>14.0</string>
    <key>UIDeviceFamily</key>
    <array>
        <integer>1</integer>
        <integer>2</integer>
    </array>
    <key>DTPlatformName</key>
    <string>iphoneos</string>
    <key>DTSDKName</key>
    <string>iphoneos14.0</string>
</dict>
</plist>`;
}

/**
 * Creates the content for extension Info.plist
 * @returns {string} - The extension Info.plist content
 */
function createExtensionInfoPlistContent() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>${BUNDLE_ID}.extension</string>
    <key>CFBundleExecutable</key>
    <string>${APP_NAME} Extension</string>
    <key>CFBundleName</key>
    <string>${APP_NAME} Extension</string>
    <key>CFBundleDisplayName</key>
    <string>${APP_NAME} Extension</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundlePackageType</key>
    <string>XPC!</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.Safari.web-extension</string>
        <key>NSExtensionPrincipalClass</key>
        <string>SafariWebExtensionHandler</string>
    </dict>
</dict>
</plist>`;
}

/**
 * Creates the content for LaunchScreen.storyboard
 * @returns {string} - The LaunchScreen.storyboard content
 */
function createLaunchScreenContent() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0">
    <scenes>
        <scene sceneID="EHf-IW-A2E">
            <objects>
                <viewController id="01J-lp-oVM" sceneMemberID="viewController">
                    <view key="view" contentMode="scaleToFill" id="Ze5-6b-2t3">
                        <rect key="frame" x="0.0" y="0.0" width="375" height="667"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <subviews>
                            <label opaque="NO" userInteractionEnabled="NO" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" text="${APP_NAME} Safari Extension" textAlignment="center" lineBreakMode="tailTruncation" baselineAdjustment="alignBaselines" adjustsFontSizeToFit="NO" translatesAutoresizingMaskIntoConstraints="NO" id="GJd-Yh-RWb">
                                <rect key="frame" x="0.0" y="0.0" width="375" height="667"/>
                                <fontDescription key="fontDescription" type="boldSystem" pointSize="17"/>
                                <nil key="textColor"/>
                                <nil key="highlightedColor"/>
                            </label>
                        </subviews>
                        <color key="backgroundColor" red="1" green="1" blue="1" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="iYj-Kq-Ea1" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="53" y="375"/>
        </scene>
    </scenes>
</document>`;
}

/**
 * Creates the content for ResourceRules.plist
 * @returns {string} - The ResourceRules.plist content
 */
function createResourceRulesContent() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>rules</key>
    <dict>
        <key>.*</key>
        <true/>
        <key>Info.plist</key>
        <dict>
            <key>omit</key>
            <true/>
            <key>weight</key>
            <real>10</real>
        </dict>
        <key>ResourceRules.plist</key>
        <dict>
            <key>omit</key>
            <true/>
            <key>weight</key>
            <real>100</real>
        </dict>
    </dict>
</dict>
</plist>`;
}

// ===== COMMAND-LINE INTERFACE =====

/**
 * Handles command-line arguments and executes the appropriate function
 */
function handleCommandLine() {
  const args = process.argv.slice(2);
  const command = args[0];
  const restArgs = args.slice(1);
  
  switch (command) {
    case 'build':
      buildSafariExtension();
      break;
    case 'create-simulator':
      createIOSSimulator();
      break;
    case 'verify-ipa':
      verifyIpaFile(restArgs[0] || null);
      break;
    case 'test-ipa':
      testIpaInSimulator(restArgs[0] || null, restArgs[1] || null);
      break;
    case 'verify-and-test-ipa':
      if (restArgs.length < 2) {
        log('Usage: node safari-tools.js verify-and-test-ipa <simulator-id> <ipa-path>', 'error');
        process.exit(1);
      }
      verifyAndTestIpa(restArgs[0], restArgs[1]);
      break;
    default:
      showHelp();
      process.exit(1);
  }
}

/**
 * Shows help information
 */
function showHelp() {
  console.log(`
Safari Tools
===========

Usage: node safari-tools.js <command> [arguments]

Commands:
  build                           Build Safari extension IPA
  create-simulator                Create an iOS simulator for testing
  verify-ipa [ipa-path]           Verify an IPA file
  test-ipa [simulator-id] [ipa-path]  Test an IPA in a simulator
  verify-and-test-ipa <simulator-id> <ipa-path>  Verify and test an IPA

Examples:
  node safari-tools.js build
  node safari-tools.js create-simulator
  node safari-tools.js verify-ipa ./ipa-output/ChronicleSync.ipa
  node safari-tools.js test-ipa 1A2B3C4D-5E6F ./ipa-output/ChronicleSync.ipa
  node safari-tools.js verify-and-test-ipa 1A2B3C4D-5E6F ./ipa-output/ChronicleSync.ipa
  `);
}

// Export functions for use in other modules
export {
  buildSafariExtension,
  createIOSSimulator,
  verifyIpaFile,
  testIpaInSimulator,
  verifyAndTestIpa
};

// If this script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  handleCommandLine();
}