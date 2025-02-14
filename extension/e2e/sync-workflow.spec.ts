import { test, expect, chromium } from '@playwright/test';
import { paths } from '../src/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Extension sync workflow', async () => {
  const TEST_CLIENT_ID = 'test_client_123';
  
  // Launch browser with the extension
  const userDataDir = path.join(__dirname, '..', 'test-user-data-dir');
  const extensionPath = path.join('/workspace/chroniclesync/extension/dist');
  
  // Launch browser with the extension
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--enable-logging',
      '--v=1',
    ],
  });
  
  const [page] = context.pages();
  console.log('Browser launched');
  
  // Wait for extension to be loaded
  await page.waitForTimeout(2000);
  
  // Try to find the extension ID by checking all pages
  let extensionId = null;
  
  // Function to check for extension ID
  const checkForExtensionId = async () => {
    // Check background pages
    const backgroundPages = context.backgroundPages();
    console.log('Background pages:', backgroundPages.length);
    for (const bgPage of backgroundPages) {
      const url = bgPage.url();
      console.log('Background page URL:', url);
      if (url.startsWith('chrome-extension://')) {
        return url.split('/')[2];
      }
    }
    
    // Check service workers
    const serviceWorkers = context.serviceWorkers();
    console.log('Service workers:', serviceWorkers.length);
    for (const worker of serviceWorkers) {
      const url = worker.url();
      console.log('Service worker URL:', url);
      if (url.startsWith('chrome-extension://')) {
        return url.split('/')[2];
      }
    }
    
    // Check all pages
    const pages = context.pages();
    console.log('Pages:', pages.length);
    for (const p of pages) {
      const url = p.url();
      console.log('Page URL:', url);
      if (url.startsWith('chrome-extension://')) {
        return url.split('/')[2];
      }
    }
    
    // Try to get the extension ID from the manifest
    try {
      const manifestPath = path.join(extensionPath, 'manifest.json');
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      console.log('Manifest:', manifest);
      if (manifest.key) {
        return manifest.key;
      }
    } catch (e) {
      console.log('Error reading manifest:', e);
    }
    
    return null;
  };
  
  // Try multiple times to get the extension ID
  for (let i = 0; i < 10; i++) {
    extensionId = await checkForExtensionId();
    if (extensionId) break;
    await page.waitForTimeout(500);
  }
  
  if (!extensionId) {
    throw new Error('Could not find extension ID after multiple attempts');
  }
  
  // Wait for extension to be loaded
  await page.waitForTimeout(2000);
  
  console.log('Found extension ID:', extensionId);
  
  // Create some browser history
  await page.goto('https://example.com');
  await page.waitForTimeout(1000);
  await page.goto('https://google.com');
  await page.waitForTimeout(1000);
  await page.goto('https://github.com');
  await page.waitForTimeout(1000);
  console.log('Created test browser history');
  
  // Wait for extension to be loaded
  await page.waitForTimeout(2000);
  
  // Create a new page for the popup
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  console.log('Opened popup page');
  
  // Wait for React app to load
  await popup.waitForTimeout(2000);
  console.log('React app loaded');
  
  // Take screenshot of initial state
  await popup.screenshot({ path: 'test-results/01-initial-state.png' });
  
  // Enter client ID
  const clientIdInput = await popup.locator('#clientId');
  await clientIdInput.fill(TEST_CLIENT_ID);
  await popup.screenshot({ path: 'test-results/02-entered-client-id.png' });
  console.log('Entered client ID:', TEST_CLIENT_ID);
  
  // Click Initialize button
  const initButton = await popup.getByRole('button', { name: 'Initialize' });
  await initButton.click();
  await popup.waitForTimeout(1000); // Wait for initialization
  await popup.screenshot({ path: 'test-results/03-after-initialize.png' });
  console.log('Clicked Initialize button');
  
  // Click Sync with Server button
  const syncButton = await popup.getByRole('button', { name: 'Sync with Server' });
  await syncButton.click();
  console.log('Clicked Sync with Server button');
  
  // Wait for sync to complete and take screenshot
  await popup.waitForTimeout(2000); // Give time for sync to complete
  await popup.screenshot({ path: 'test-results/04-after-sync.png' });
  
  // Verify last sync time is updated
  const lastSyncText = await popup.locator('.sync-status').textContent();
  console.log('Last sync text:', lastSyncText);
  expect(lastSyncText).not.toContain('Never');
  
  // Take final screenshot
  await popup.screenshot({ path: 'test-results/05-final-state.png' });
  
  // Open settings page
  const settingsButton = await popup.getByRole('button', { name: 'Settings' });
  await settingsButton.click();
  
  // Wait for the settings page to open
  await page.waitForTimeout(1000);
  const pages = context.pages();
  const settingsPage = pages[pages.length - 1];
  await settingsPage.waitForLoadState();
  await settingsPage.screenshot({ path: 'test-results/06-settings-page.png' });
  console.log('Opened settings page');
  
  // Clean up
  await context.close();
});