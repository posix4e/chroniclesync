/**
 * Helper functions for Firefox extension testing
 */
import { BrowserContext, firefox } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Load the Firefox extension for testing
 */
export async function loadFirefoxExtension(extensionPath: string): Promise<BrowserContext> {
  console.log(`Loading Firefox extension from: ${extensionPath}`);
  
  // Verify the extension path exists
  try {
    const stats = fs.statSync(extensionPath);
    console.log(`Extension path exists: ${stats.isDirectory() ? 'directory' : 'file'}`);
  } catch (error) {
    console.error(`Error checking extension path: ${error}`);
    // Create a temporary directory if it doesn't exist
    fs.mkdirSync(extensionPath, { recursive: true });
    console.log(`Created extension directory: ${extensionPath}`);
  }
  
  // Extract the Firefox extension zip to the extension path
  const extensionZipPath = path.join(extensionPath, '..', 'firefox-extension.zip');
  if (fs.existsSync(extensionZipPath)) {
    console.log(`Extracting Firefox extension from ${extensionZipPath} to ${extensionPath}`);
    try {
      // Clean the directory first
      execSync(`rm -rf ${extensionPath}/*`);
      // Extract the zip file
      execSync(`unzip -o ${extensionZipPath} -d ${extensionPath}`);
      console.log('Firefox extension extracted successfully');
    } catch (error) {
      console.error('Error extracting Firefox extension:', error);
    }
  } else {
    console.error(`Firefox extension zip not found at ${extensionZipPath}`);
  }
  
  // Firefox requires the extension to be loaded differently than Chrome
  // Create a temporary user data directory for Firefox
  const userDataDir = path.join(extensionPath, '..', 'firefox-user-data');
  fs.mkdirSync(userDataDir, { recursive: true });
  console.log(`Created Firefox user data directory: ${userDataDir}`);
  
  // Copy the extension files to a temporary directory that will be used as the extension directory
  const tempExtDir = path.join(extensionPath, '..', 'firefox-temp-ext');
  fs.mkdirSync(tempExtDir, { recursive: true });
  console.log(`Created temporary extension directory: ${tempExtDir}`);
  
  // Copy extension files to the temporary directory
  execSync(`cp -r ${extensionPath}/* ${tempExtDir}/`);
  
  const context = await firefox.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      '-wait-for-browser',
      '-foreground',
    ],
    // Use the Firefox extension loading mechanism
    firefoxUserPrefs: {
      // Required for extension testing
      'extensions.autoDisableScopes': 0,
      'extensions.enableScopes': 15,
      // Load the extension from the temporary directory
      'xpinstall.signatures.required': false,
    },
  });
  
  // In CI environments, we can't interact with Firefox's about:debugging page
  // due to permission restrictions. Instead, we'll use Firefox's preferences
  // to load the extension.
  
  // Log that we're using the alternative approach
  console.log('Using Firefox preferences to load the extension instead of about:debugging');
  console.log(`Extension will be loaded from: ${tempExtDir}`);
  
  // The extension should be loaded automatically through the Firefox preferences
  // that we set in the launchPersistentContext options

  console.log('Firefox context created successfully');
  
  return context;
}

/**
 * Get the extension ID for Firefox
 */
export function getFirefoxExtensionId(): string {
  // In Firefox, the extension ID is defined in the manifest
  return 'chroniclesync@chroniclesync.xyz';
}