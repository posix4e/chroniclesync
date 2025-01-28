import { test, expect, BrowserContext, Page } from '@playwright/test';
import path from 'path';

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
  test('extension functionality', async ({ context }) => {
    // 1. Initial Setup and Screenshots
    console.log('Test started with browser context:', context.constructor.name);
    
    // Helper function to find the background service worker
    const findBackgroundWorker = () => {
      const workers = context.serviceWorkers();
      console.log('Current service workers:', workers.map(w => w.url()));
      return workers.find(w => w.url().includes('background'));
    };

    // Helper function to check extension status
    const checkExtensionStatus = async () => {
      const page = await context.newPage();
      try {
        // Try to access extension pages directly
        const pages = await context.pages();
        console.log('Current pages:', pages.map(p => p.url()));

        // Try to evaluate extension presence
        const extensions = await context.evaluate(() => {
          // @ts-ignore: chrome exists in extension context
          return chrome?.runtime?.id || 'No extension ID found';
        });
        console.log('Extension ID from runtime:', extensions);

        // Check background page
        const backgrounds = context.backgroundPages();
        console.log('Background pages:', backgrounds.map(p => p.url()));

        // List service workers
        console.log('Service workers:', context.serviceWorkers().map(w => w.url()));
      } catch (e) {
        console.log('Failed to check extension status:', e);
      } finally {
        await page.close();
      }
    };

    // Check initial extension status
    console.log('Checking initial extension status...');
    await checkExtensionStatus();

    // Try to trigger service worker registration
    console.log('Attempting to trigger service worker registration...');
    try {
      // Create a new page to trigger extension activation
      const page = await context.newPage();
      await page.goto('about:blank');
      await page.waitForTimeout(1000);
      await page.close();
    } catch (e) {
      console.log('Failed to trigger extension:', e);
    }

    // Now check for service worker with more detailed logging
    let worker = findBackgroundWorker();
    if (!worker) {
      console.log('Service worker not found after initial check, waiting...');
      try {
        // Wait for service worker registration with progress logging
        const result = await Promise.race([
          (async () => {
            console.log('Starting event listener for service worker...');
            const worker = await context.waitForEvent('serviceworker', {
              predicate: worker => {
                console.log('Service worker event received:', worker.url());
                return worker.url().includes('background');
              },
              timeout: 15000
            });
            console.log('Service worker event listener succeeded');
            return worker;
          })(),
          // Polling as a fallback with progress logging
          (async () => {
            for (let i = 0; i < 15; i++) {
              console.log(`Polling attempt ${i + 1}/15...`);
              worker = findBackgroundWorker();
              if (worker) {
                console.log('Found worker through polling');
                return worker;
              }
              // Check extension status every 5 seconds
              if (i % 5 === 0) {
                await checkExtensionStatus();
              }
              await new Promise(r => setTimeout(r, 1000));
            }
            throw new Error('Service worker not found after 15 seconds of polling');
          })()
        ]);
        worker = result;
      } catch (e) {
        const error = e as Error;
        console.error('Failed to detect service worker:', error);
        
        // Final extension status check
        console.log('Performing final extension status check...');
        await checkExtensionStatus();
        
        // One final check
        worker = findBackgroundWorker();
        if (!worker) {
          throw new Error(`Service worker not found after all attempts: ${error.message}`);
        }
      }
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