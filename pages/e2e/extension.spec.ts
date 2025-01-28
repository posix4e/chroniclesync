import { test, expect, BrowserContext, Page, Worker } from '@playwright/test';
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { rm } from 'fs/promises';
import { paths } from '../config';

// Ensure tests run sequentially and stop on first failure
test.describe.configure({ mode: 'serial', retries: 0 });

/**
 * Helper function to get the extension popup page
 */
async function getExtensionPopup(context: BrowserContext): Promise<{ extensionId: string, popup: Page }> {
  // Get all service workers and find the extension worker
  const workers = context.serviceWorkers();
  console.log('Current service workers:', workers.map(w => w.url()));
  
  const worker = workers.find(w => w.url().includes('background'));
  if (!worker) {
    throw new Error('Extension service worker not found. Available workers: ' + 
      workers.map(w => w.url()).join(', '));
  }
  
  // Extract extension ID from service worker URL
  const extensionId = worker.url().split('/')[2];
  console.log('Found extension ID:', extensionId);
  
  // Create and return the popup with retries
  let lastError: Error | null = null;
  for (let i = 0; i < 3; i++) {
    try {
      const popup = await context.newPage();
      await popup.goto(`chrome-extension://${extensionId}/popup.html`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
      return { extensionId, popup };
    } catch (e) {
      const error = e as Error;
      lastError = error;
      console.log(`Attempt ${i + 1}/3 failed:`, error.message);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error(`Failed to load extension popup after 3 attempts: ${lastError?.message}`);
}

test.describe('Chrome Extension', () => {
  test.afterEach(async () => {
    const userDataDir = `/tmp/playwright-test-profile-${Date.now()}`;

    try {
    // Add delay to ensure all processes have terminated
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (fs.existsSync(userDataDir)) {
        await rm(userDataDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.error('Error during cleanup:', err);
    }
  });
  test('extension functionality', async () => {
    // Create a persistent context for extension testing
    const userDataDir = '/tmp/playwright-test-profile';
    const context = await chromium.launchPersistentContext(userDataDir, {
      args: [
        `--disable-extensions-except=${paths.extensionDist}`,
        `--load-extension=${paths.extensionDist}`,
      ],
    });
    // 1. Initial Setup and Screenshots
    console.log('Test started with browser context:', context.constructor.name);
    
    // Debug extension loading path
    console.log('Extension path:', paths.extensionDist);
    console.log('Extension directory exists:', fs.existsSync(paths.extensionDist));
    if (fs.existsSync(paths.extensionDist)) {
      console.log('Extension directory contents:', fs.readdirSync(paths.extensionDist));
    }
    
    // Helper function to find the background service worker with retries
    const findBackgroundWorker = async (maxAttempts = 30, interval = 1000) => {
      let activationPage: Page | null = null;
      
      try {
        for (let i = 0; i < maxAttempts; i++) {
          console.log(`Checking for service worker (attempt ${i + 1}/${maxAttempts})...`);
          
          // List all pages and service workers
          const pages = context.pages();
          const workers = context.serviceWorkers();
          const backgrounds = context.backgroundPages();
          
          console.log('Current pages:', pages.map((p: Page) => p.url()));
          console.log('Background pages:', backgrounds.map((p: Page) => p.url()));
          console.log('Service workers:', workers.map((w: Worker) => w.url()));
          
          // Check for background service worker
          const worker = workers.find((w: Worker) => w.url().includes('background'));
          if (worker) {
            console.log('Found background service worker:', worker.url());
            return worker;
          }
          
          // Try to trigger extension activation if no worker found
          if (i % 5 === 0) { // Every 5 attempts
            try {
              console.log('Attempting to trigger extension activation...');
              
              // Close previous activation page if it exists
              if (activationPage) {
                await activationPage.close().catch(() => {/* ignore close errors */});
                activationPage = null;
              }
              
              try {
                // Create new activation page
                activationPage = await context.newPage();
                if (activationPage) {
                  await activationPage.goto('about:blank');
                  await activationPage.waitForTimeout(1000);
                  
                  // Try to access chrome://extensions (this might fail, but that's okay)
                  await activationPage.goto('chrome://extensions').catch(() => {/* ignore navigation errors */});
                  await activationPage.waitForTimeout(1000);
                }
              } catch (e) {
                console.log('Failed to create activation page:', e);
              }
            } catch (e) {
              console.log('Failed to trigger extension:', e);
            }
          }
          
          // Wait before next attempt
          if (i < maxAttempts - 1) {
            await new Promise(r => setTimeout(r, interval));
          }
        }
      } finally {
        // Clean up activation page
        if (activationPage) {
          await activationPage.close().catch(() => {/* ignore close errors */});
        }
      }
      return null;
    };

    // Wait for service worker with increased timeout and better error handling
    console.log('Waiting for service worker registration...');
    const worker = await findBackgroundWorker();
    if (!worker) {
      throw new Error('Service worker not found after maximum attempts. Extension may not be properly loaded.');
    }
    
    // At this point worker must be defined because we would have thrown an error otherwise
    console.log('Service worker found:', worker!.url());
    
    // Get the extension popup
    const { extensionId, popup } = await getExtensionPopup(context);
    console.log('Extension loaded with ID:', extensionId);
    
    // Take screenshot of initial state
    await popup.screenshot({ 
      path: path.join('test-results', '01-initial-popup.png'),
      fullPage: true 
    });
    
    // 2. Verify Initial UI State
    await expect(popup.locator('h2')).toHaveText('ChronicleSync');
    await expect(popup.locator('text=Last sync: Never')).toBeVisible();
    await expect(popup.locator('text=Status: idle')).toBeVisible();
    await expect(popup.locator('button:has-text("Sync Now")')).toBeVisible();
    
    // 3. Generate Test History
    console.log('Generating test history entries...');
    const testPages = [
      'https://example.com/page1',
      'https://example.com/page2',
      'https://example.com/page3'
    ];
    
    for (const url of testPages) {
      const page = await context.newPage();
      await page.goto(url);
      await page.waitForLoadState('domcontentloaded');
      await page.close();
    }
    
    // Take screenshot after history generation
    await popup.screenshot({ 
      path: path.join('test-results', '02-after-history.png'),
      fullPage: true 
    });
    
    // 4. Test Sync Functionality
    console.log('Testing sync functionality...');
    const syncButton = popup.locator('button:has-text("Sync Now")');
    await syncButton.click();
    
    // Wait for sync to complete (button should be re-enabled)
    await popup.waitForSelector('button:has-text("Sync Now"):not([disabled])', { 
      timeout: 5000 
    });
    
    // Take final screenshot
    await popup.screenshot({ 
      path: path.join('test-results', '03-after-sync.png'),
      fullPage: true 
    });
    
    // 5. Verify Sync Status
    await expect(popup.locator('text=Status: idle')).toBeVisible();
    const lastSyncText = await popup.locator('text=Last sync:').textContent();
    expect(lastSyncText).toBeTruthy();
    expect(lastSyncText).not.toContain('Never');
  });
});
