#!/usr/bin/env node
/* eslint-disable no-console */
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { verifyIpaFile } from './verify-ipa.js';
import { createIOSSimulator } from './create-ios-simulator.js';

const execAsync = promisify(exec);
const ROOT_DIR = process.cwd();

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

// If this script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const simulatorId = process.argv[2] || null;
  const ipaPath = process.argv[3] || null;
  testIpaInSimulator(simulatorId, ipaPath);
}

export { testIpaInSimulator };