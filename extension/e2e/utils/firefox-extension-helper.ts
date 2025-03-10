/**
 * Helper functions for Firefox extension testing
 */
import { BrowserContext, firefox } from '@playwright/test';
import * as fs from 'fs';

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
  
  // Firefox requires the extension to be loaded differently than Chrome
  const context = await firefox.launchPersistentContext('', {
    headless: false,
    args: [
      '-wait-for-browser',
      '-foreground',
      '-profile',
      extensionPath,
    ],
    firefoxUserPrefs: {
      // Required for extension testing
      'extensions.autoDisableScopes': 0,
      'extensions.enableScopes': 15,
    },
  });

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