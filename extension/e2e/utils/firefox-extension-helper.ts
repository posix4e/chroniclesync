/**
 * Helper functions for Firefox extension testing
 */
import { BrowserContext, chromium, firefox } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Load the Firefox extension for testing
 */
export async function loadFirefoxExtension(extensionPath: string): Promise<BrowserContext> {
  // Firefox requires the extension to be loaded differently than Chrome
  const context = await firefox.launchPersistentContext('', {
    headless: false,
    args: [
      '-wait-for-browser',
      '-foreground',
    ],
    firefoxUserPrefs: {
      // Required for extension testing
      'extensions.autoDisableScopes': 0,
      'extensions.enableScopes': 15,
    },
  });

  // In a real implementation, you would use Firefox's web-ext tool
  // to load and test the extension
  
  return context;
}

/**
 * Get the extension ID for Firefox
 */
export function getFirefoxExtensionId(): string {
  // In Firefox, the extension ID is defined in the manifest
  return 'chroniclesync@chroniclesync.xyz';
}