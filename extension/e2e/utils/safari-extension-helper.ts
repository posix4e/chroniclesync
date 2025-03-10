/**
 * Helper functions for Safari extension testing
 */
import { BrowserContext, webkit } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Define Safari extension types for TypeScript
interface SafariExtension {
  baseURI: string;
  dispatchMessage: (name: string, data: any) => void;
}

interface SafariGlobal {
  extension: SafariExtension;
}

// Extend Window interface to include Safari
declare global {
  interface Window {
    safari?: SafariGlobal;
  }
}

/**
 * Load the Safari extension for testing
 * Note: WebKit in Playwright doesn't directly support extensions
 * This is a workaround for testing purposes
 */
export async function loadSafariExtension(extensionPath: string): Promise<BrowserContext> {
  console.log(`Loading Safari extension from: ${extensionPath}`);
  
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
  
  // For Safari/WebKit, we need a different approach since Playwright doesn't directly support extensions
  // In a real implementation, you would:
  // 1. Use Appium with XCUITest driver for iOS automation
  // 2. Configure Playwright to connect to the Appium server
  // 3. Run tests against the Safari browser with the extension installed
  
  // For now, we'll create a WebKit context with specific configurations
  // that will allow us to test the basic functionality
  const context = await webkit.launchPersistentContext('', {
    headless: false,
    viewport: { width: 1280, height: 720 },
    // Set user agent to Safari on macOS
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
    // Enable permissions that would be granted to the extension
    permissions: ['geolocation', 'notifications'],
    // Set up a mock server to simulate extension behavior if needed
    // This would be implemented in a real-world scenario
  });
  
  console.log('Safari/WebKit context created successfully');
  
  // Create a mock extension environment
  // In a real implementation, this would be more sophisticated
  const page = await context.newPage();
  await page.addInitScript(() => {
    // Mock extension API for testing
    window.safari = {
      extension: {
        baseURI: 'safari-extension://xyz.chroniclesync.extension/',
        dispatchMessage: (name: string, data: any) => {
          console.log(`Extension message dispatched: ${name}`, data);
        }
      }
    };
  });
  
  await page.close();
  
  return context;
}

/**
 * Get the extension ID for Safari
 */
export function getSafariExtensionId(): string {
  // In Safari, the extension ID is defined in the Info.plist file
  return 'xyz.chroniclesync.extension';
}