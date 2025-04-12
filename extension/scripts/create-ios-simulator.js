#!/usr/bin/env node
/* eslint-disable no-console */
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

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

// If this script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createIOSSimulator();
}

export { createIOSSimulator };