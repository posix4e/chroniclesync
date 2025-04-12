#!/usr/bin/env node

/**
 * This script verifies and tests an IPA file in a simulator.
 * It replaces the complicated shell commands in the GitHub Actions workflow.
 * 
 * Usage: node verify-and-test-ipa.js <simulator-id> <ipa-path>
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get command line arguments
const simulatorId = process.argv[2];
const ipaPath = process.argv[3];

if (!simulatorId || !ipaPath) {
  console.error('Usage: node verify-and-test-ipa.js <simulator-id> <ipa-path>');
  process.exit(1);
}

// Main function
async function main() {
  try {
    // Verify the IPA file exists
    if (!fs.existsSync(ipaPath)) {
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
      const testResult = execSync(
        `NODE_OPTIONS="--experimental-vm-modules --no-warnings" node ${path.join(__dirname, 'test-ipa-in-simulator.js')} "${simulatorId}" "${ipaPath}"`,
        { stdio: 'inherit' }
      );
    } catch (error) {
      console.error('Error testing IPA in simulator:', error.message);
      
      // Collect diagnostic information
      console.log('Test failed, collecting diagnostic information...');
      
      try {
        // Create diagnostics directory
        const diagnosticsDir = path.join(process.cwd(), 'simulator-diagnostics');
        if (!fs.existsSync(diagnosticsDir)) {
          fs.mkdirSync(diagnosticsDir, { recursive: true });
        }
        
        // Try to get simulator diagnostics
        try {
          execSync(`xcrun simctl diagnose "${simulatorId}" --output-dir "${diagnosticsDir}"`, { stdio: 'inherit' });
        } catch (diagError) {
          console.error('Error collecting simulator diagnostics:', diagError.message);
        }
        
        // List installed apps
        try {
          execSync(`xcrun simctl list_apps "${simulatorId}" > simulator-apps.txt`, { stdio: 'inherit' });
        } catch (listError) {
          console.error('Error listing simulator apps:', listError.message);
        }
        
        // Get IPA details
        try {
          execSync(`ls -la "${ipaPath}" > ipa-details.txt && file "${ipaPath}" >> ipa-details.txt`, { stdio: 'inherit' });
        } catch (detailsError) {
          console.error('Error getting IPA details:', detailsError.message);
        }
      } catch (diagCollectionError) {
        console.error('Error collecting diagnostics:', diagCollectionError.message);
      }
    }
    
    // Copy screenshots to the root directory for artifact upload
    try {
      execSync('cp app-screenshot-*.png ../ 2>/dev/null || true', { stdio: 'inherit' });
    } catch (copyError) {
      console.error('Error copying screenshots:', copyError.message);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});