#!/usr/bin/env node
/* eslint-disable no-console */
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import fs from 'fs';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const ROOT_DIR = process.cwd();
const IPA_OUTPUT_DIR = join(ROOT_DIR, 'ipa-output');

/**
 * Creates an iOS simulator for testing
 * @returns {Promise<string>} - ID of the created simulator
 */
async function createIOSSimulator() {
  try {
    // List available runtimes and devices for debugging
    console.log('Available iOS runtimes:');
    const runtimesResult = await execAsync('xcrun simctl list runtimes | grep iOS');
    console.log(runtimesResult.stdout);
    
    console.log('Available device types:');
    const deviceTypesResult = await execAsync('xcrun simctl list devicetypes | grep iPhone');
    console.log(deviceTypesResult.stdout);
    
    // Use iOS 18.2 specifically (or fall back to latest if not available)
    let iosVersion;
    const ios182Check = await execAsync('xcrun simctl list runtimes | grep -q "iOS 18.2" && echo "found" || echo "not found"');
    
    if (ios182Check.stdout.trim() === 'found') {
      iosVersion = 'com.apple.CoreSimulator.SimRuntime.iOS-18-2';
      console.log('Using iOS version 18.2');
    } else {
      // Get the latest runtime identifier instead of just the version number
      const latestIOSResult = await execAsync('xcrun simctl list runtimes | grep iOS | tail -1 | awk \'{print $NF}\' | tr -d \'()\'');
      iosVersion = latestIOSResult.stdout.trim();
      console.log(`iOS 18.2 not available, using latest runtime: ${iosVersion}`);
    }
    
    // Create a new simulator (use iPhone 16 if available, otherwise fall back to iPhone 14)
    const simulatorName = 'ChronicleSync-Test-Simulator';
    let deviceType;
    
    const iphone16Check = await execAsync('xcrun simctl list devicetypes | grep -q "iPhone 16" && echo "found" || echo "not found"');
    
    if (iphone16Check.stdout.trim() === 'found') {
      deviceType = 'com.apple.CoreSimulator.SimDeviceType.iPhone-16';
    } else {
      deviceType = 'com.apple.CoreSimulator.SimDeviceType.iPhone-14';
      console.log('iPhone 16 not available, using iPhone 14 instead');
    }
    
    // Create the simulator
    const createResult = await execAsync(`xcrun simctl create "${simulatorName}" "${deviceType}" ${iosVersion}`);
    const deviceId = createResult.stdout.trim();
    
    console.log(`Created simulator with ID: ${deviceId} using ${deviceType} with iOS ${iosVersion}`);
    
    // Boot the simulator
    await execAsync(`xcrun simctl boot "${deviceId}"`);
    console.log(`Booted simulator ${deviceId}`);
    
    return deviceId;
  } catch (error) {
    console.error('Error creating iOS simulator:', error);
    process.exit(1);
  }
}

/**
 * Verifies the generated IPA file
 * @param {string} ipaPath - Path to the IPA file (optional, will find it if not provided)
 * @returns {Promise<string>} - Path to the verified IPA file
 */
async function verifyIpaFile(ipaPath = null) {
  try {
    // Find the IPA file if not provided
    if (!ipaPath) {
      const findResult = await execAsync(`find ${IPA_OUTPUT_DIR} -name "*.ipa" | head -1`);
      ipaPath = findResult.stdout.trim();
    }

    if (!ipaPath || !fs.existsSync(ipaPath)) {
      console.error('Error: No IPA file was found');
      process.exit(1);
    }

    console.log(`Verifying generated IPA file: ${ipaPath}`);
    
    // Create verification directory
    const verifyDir = join(ROOT_DIR, 'ipa-verify');
    await mkdir(verifyDir, { recursive: true });
    
    // Unzip the IPA file
    try {
      await execAsync(`unzip -q -o "${ipaPath}" -d ${verifyDir}`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (unzipError) {
      console.error('Error: Failed to unzip IPA file. The file may be corrupted or not a valid IPA.');
      console.log(`IPA file details: ${(await execAsync(`ls -la "${ipaPath}"`)).stdout}`);
      console.log(`File type: ${(await execAsync(`file "${ipaPath}"`)).stdout}`);
      process.exit(1);
    }
    
    // Check for Payload directory
    if (!fs.existsSync(join(verifyDir, 'Payload'))) {
      console.error('Error: Generated IPA file does not contain a Payload directory.');
      console.log(`IPA contents: ${(await execAsync(`ls -la ${verifyDir}`)).stdout}`);
      process.exit(1);
    }
    
    // List the contents of the Payload directory
    console.log('Generated IPA contents:');
    console.log((await execAsync(`ls -la ${verifyDir}/Payload/`)).stdout);
    
    console.log('IPA verification passed.');
    return ipaPath;
  } catch (error) {
    console.error('Error verifying IPA file:', error);
    process.exit(1);
  }
}

/**
 * Installs and tests the IPA file in a simulator
 * @param {string} simulatorId - ID of the simulator to use (optional, will create one if not provided)
 * @param {string} ipaPath - Path to the IPA file (optional, will find it if not provided)
 */
async function testIpaInSimulator(simulatorId = null, ipaPath = null) {
  try {
    // Create simulator if not provided
    if (!simulatorId) {
      simulatorId = await createIOSSimulator();
    }
    
    // Find and verify IPA file if not provided
    if (!ipaPath) {
      ipaPath = await verifyIpaFile();
    }
    
    // Wait for simulator to be ready
    console.log('Waiting for simulator to be ready...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Verify the IPA file structure
    console.log('Verifying IPA file structure...');
    const ipaContentsDir = join(ROOT_DIR, 'ipa-contents');
    await mkdir(ipaContentsDir, { recursive: true });
    
    try {
      await execAsync(`unzip -q -o "${ipaPath}" -d ${ipaContentsDir}`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (unzipError) {
      console.error('Error: Failed to unzip IPA file. The file may be corrupted or not a valid IPA.');
      console.log(`IPA file details: ${(await execAsync(`ls -la "${ipaPath}"`)).stdout}`);
      console.log(`File type: ${(await execAsync(`file "${ipaPath}"`)).stdout}`);
      process.exit(1);
    }
    
    // List the contents of the extracted IPA
    console.log('IPA contents:');
    console.log((await execAsync(`ls -la ${ipaContentsDir}/`)).stdout);
    
    // Check for app bundle - either directly or in Payload directory
    let appDir = '';
    let appCount = 0;
    let hasPayloadDir = fs.existsSync(join(ipaContentsDir, 'Payload'));
    
    if (hasPayloadDir) {
      // Standard IPA structure with Payload directory
      const appDirsResult = await execAsync(`find ${ipaContentsDir}/Payload -name "*.app" -type d | wc -l`);
      appCount = parseInt(appDirsResult.stdout.trim(), 10);
      
      if (appCount > 0) {
        const appDirResult = await execAsync(`find ${ipaContentsDir}/Payload -name "*.app" -type d | head -1`);
        appDir = appDirResult.stdout.trim();
      }
    } else {
      // Non-standard IPA structure, look for .app directly
      const appDirsResult = await execAsync(`find ${ipaContentsDir} -name "*.app" -type d | wc -l`);
      appCount = parseInt(appDirsResult.stdout.trim(), 10);
      
      if (appCount > 0) {
        const appDirResult = await execAsync(`find ${ipaContentsDir} -name "*.app" -type d | head -1`);
        appDir = appDirResult.stdout.trim();
      }
    }
    
    if (appCount === 0) {
      console.error('Error: No .app bundle found in the IPA file.');
      process.exit(1);
    }
    
    // Check for Info.plist in the app bundle
    if (!fs.existsSync(join(appDir, 'Info.plist'))) {
      console.error('Error: Info.plist not found in the app bundle.');
      console.log(`App bundle contents: ${(await execAsync(`ls -la "${appDir}"`)).stdout}`);
      process.exit(1);
    }
    
    // Create a temporary directory for the output
    const ipaOutputDir = join(ROOT_DIR, 'ipa-output-temp');
    await mkdir(ipaOutputDir, { recursive: true });
    
    // Create a new IPA file path in the temporary directory
    const newIpaPath = join(ipaOutputDir, 'ChronicleSync.ipa');
    
    // Repackage the IPA with any fixes if needed
    if (!hasPayloadDir) {
      console.log('Restructuring IPA to standard format with Payload directory...');
      // Create Payload directory
      const payloadDir = join(ipaContentsDir, 'Payload');
      await mkdir(payloadDir, { recursive: true });
      
      // Move the .app to the Payload directory if it's not already there
      if (!appDir.includes('/Payload/')) {
        const appName = appDir.split('/').pop();
        await execAsync(`mv "${appDir}" "${payloadDir}/"`);
        appDir = join(payloadDir, appName);
      }
    }
    
    // Create the new IPA file
    console.log(`Creating new IPA file at: ${newIpaPath}`);
    try {
      // Make sure the parent directory exists
      await mkdir(join(newIpaPath, '..'), { recursive: true });
      
      // Remove the old IPA if it exists
      if (fs.existsSync(newIpaPath)) {
        await execAsync(`rm -f "${newIpaPath}"`);
      }
      
      // Create the new IPA
      await execAsync(`cd "${ipaContentsDir}" && zip -r "${newIpaPath}" Payload`);
      
      // Replace the original IPA with the new one
      await execAsync(`cp "${newIpaPath}" "${ipaPath}"`);
      console.log(`IPA verification and fixes completed. Found ${appCount} app bundle(s).`);
    } catch (error) {
      console.error('Error creating new IPA file:', error);
      console.log('Continuing with the original IPA file...');
    }
    
    // Install the IPA
    console.log('Installing IPA to simulator...');
    await execAsync(`xcrun simctl install "${simulatorId}" "${ipaPath}"`);
    
    // Get the bundle ID from the IPA
    let bundleId;
    try {
      const bundleIdResult = await execAsync(`defaults read "${appDir}/Info.plist" CFBundleIdentifier 2>/dev/null`);
      bundleId = bundleIdResult.stdout.trim();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      bundleId = 'com.chroniclesync.safari-extension';
    }
    console.log(`Using bundle ID: ${bundleId}`);
    
    // Launch the app
    console.log(`Launching app with bundle ID: ${bundleId}`);
    try {
      await execAsync(`xcrun simctl launch "${simulatorId}" "${bundleId}"`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (launchError) {
      console.error('Failed to launch app. Trying to debug...');
      await execAsync(`xcrun simctl diagnose "${simulatorId}" --all`);
      await execAsync(`xcrun simctl list_apps "${simulatorId}"`);
      process.exit(1);
    }
    
    // Wait for app to load
    console.log('Waiting for app to load...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Take a screenshot of the app
    console.log('Taking screenshot of the app...');
    await execAsync(`xcrun simctl io "${simulatorId}" screenshot "app-screenshot-1.png"`);
    
    // Navigate through the app (if possible)
    console.log('Attempting to navigate through the app...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Tap in the middle of the screen to interact with the app
    await execAsync(`xcrun simctl io "${simulatorId}" input tap 200 400`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await execAsync(`xcrun simctl io "${simulatorId}" screenshot "app-screenshot-2.png"`);
    
    // Another interaction
    await execAsync(`xcrun simctl io "${simulatorId}" input tap 200 600`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await execAsync(`xcrun simctl io "${simulatorId}" screenshot "app-screenshot-3.png"`);
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error testing IPA in simulator:', error);
    process.exit(1);
  }
}

/**
 * Verifies and tests an IPA file in a simulator.
 * This function combines the functionality of verify-and-test-ipa.js
 * @param {string} simulatorId - ID of the simulator to use
 * @param {string} ipaPath - Path to the IPA file
 */
async function verifyAndTestIpa(simulatorId, ipaPath) {
  try {
    // Verify the IPA file exists
    if (!ipaPath || !fs.existsSync(ipaPath)) {
      console.error(`Error: IPA file does not exist at path: ${ipaPath}`);
      process.exit(1);
    }

    // Check file size
    const stats = fs.statSync(ipaPath);
    console.log(`IPA file size: ${stats.size} bytes`);

    if (stats.size < 1000) {
      console.warn(`Warning: IPA file is suspiciously small (${stats.size} bytes)`);
    }

    console.log(`Found IPA file: ${ipaPath}`);

    // Test IPA in simulator
    console.log('Testing IPA in simulator...');
    try {
      await testIpaInSimulator(simulatorId, ipaPath);
    } catch (error) {
      console.error('Error testing IPA in simulator:', error.message);
      
      // Collect diagnostic information
      console.log('Test failed, collecting diagnostic information...');
      
      try {
        // Create diagnostics directory
        const diagnosticsDir = join(process.cwd(), 'simulator-diagnostics');
        if (!fs.existsSync(diagnosticsDir)) {
          fs.mkdirSync(diagnosticsDir, { recursive: true });
        }
        
        // Try to get simulator diagnostics
        try {
          await execAsync(`xcrun simctl diagnose "${simulatorId}" --output-dir "${diagnosticsDir}"`);
        } catch (diagError) {
          console.error('Error collecting simulator diagnostics:', diagError.message);
        }
        
        // List installed apps
        try {
          await execAsync(`xcrun simctl list_apps "${simulatorId}" > simulator-apps.txt`);
        } catch (listError) {
          console.error('Error listing simulator apps:', listError.message);
        }
        
        // Get IPA details
        try {
          await execAsync(`ls -la "${ipaPath}" > ipa-details.txt && file "${ipaPath}" >> ipa-details.txt`);
        } catch (detailsError) {
          console.error('Error getting IPA details:', detailsError.message);
        }
      } catch (diagCollectionError) {
        console.error('Error collecting diagnostics:', diagCollectionError.message);
      }
    }
    
    // Copy screenshots to the root directory for artifact upload
    try {
      await execAsync('cp app-screenshot-*.png ../ 2>/dev/null || true');
    } catch (copyError) {
      console.error('Error copying screenshots:', copyError.message);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
    process.exit(1);
  }
}

// Command-line interface
function handleCommandLine() {
  const scriptName = fileURLToPath(import.meta.url).split('/').pop();
  const args = process.argv.slice(2);
  
  switch (scriptName) {
    case 'create-ios-simulator.js':
      createIOSSimulator();
      break;
    case 'verify-ipa.js':
      verifyIpaFile(args[0] || null);
      break;
    case 'test-ipa-in-simulator.js':
      testIpaInSimulator(args[0] || null, args[1] || null);
      break;
    case 'verify-and-test-ipa.js':
    case 'safari-ipa-utils.js':
      if (args.length < 2) {
        console.error('Usage: node safari-ipa-utils.js <simulator-id> <ipa-path>');
        process.exit(1);
      }
      verifyAndTestIpa(args[0], args[1]);
      break;
    default:
      console.error(`Unknown script name: ${scriptName}`);
      console.error('Usage: node safari-ipa-utils.js <simulator-id> <ipa-path>');
      process.exit(1);
  }
}

// If this script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  handleCommandLine();
}

export {
  createIOSSimulator,
  verifyIpaFile,
  testIpaInSimulator,
  verifyAndTestIpa
};