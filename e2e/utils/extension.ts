/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, chromium, firefox, type BrowserContext, type BrowserType } from '@playwright/test';
import path from 'path';

// Define paths for extension builds
const CHROME_EXTENSION_PATH = process.env.CHROME_EXTENSION_PATH || 
  path.join(__dirname, '../../dist/chrome');
const FIREFOX_EXTENSION_PATH = process.env.FIREFOX_EXTENSION_PATH || 
  path.join(__dirname, '../../dist/firefox');
const FIREFOX_PROFILE_PATH = path.join(__dirname, '../firefox-profile');

export type TestFixtures = {
  context: BrowserContext;
  extensionId: string;
  browserName: string;
};

export const test = base.extend<TestFixtures>({
  browserName: ['chromium', { option: true }],
  
  // eslint-disable-next-line no-empty-pattern
  context: async ({ browserName }, use) => {
    console.log(`Starting ${browserName} browser context creation...`);
    let context: BrowserContext;
    let browser: BrowserType;
    
    try {
      if (browserName === 'firefox') {
        browser = firefox;
        context = await firefox.launchPersistentContext(FIREFOX_PROFILE_PATH, {
          headless: false,
          firefoxUserPrefs: {
            // Firefox-specific preferences for extension testing
            'extensions.autoDisableScopes': 0,
            'extensions.enableScopes': 15,
          },
          args: [
            '-profile',
            FIREFOX_PROFILE_PATH,
            '-no-remote',
          ],
          logger: {
            isEnabled: () => true,
            log: (name, severity, message) => console.log(`[${severity}] ${name}: ${message}`),
          },
        });
      } else {
        // Default to Chrome/Chromium
        browser = chromium;
        context = await chromium.launchPersistentContext('', {
          headless: false,
          args: [
            `--disable-extensions-except=${CHROME_EXTENSION_PATH}`,
            `--load-extension=${CHROME_EXTENSION_PATH}`,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--enable-logging=stderr',
            '--v=1',
            '--allow-insecure-localhost',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
          ],
          logger: {
            isEnabled: () => true,
            log: (name, severity, message) => console.log(`[${severity}] ${name}: ${message}`),
          },
        });
      }

      console.log('Browser context created successfully');
      
      // Log browser and extension info
      const pages = context.pages();
      console.log(`Initial pages: ${pages.length}`);
      for (const page of pages) {
        console.log('Page URL:', page.url());
      }

      await use(context);
      
      console.log('Test completed, closing context...');
      await context.close();
      console.log('Context closed successfully');
    } catch (error) {
      console.error('Error in browser context:', error);
      throw error;
    }
  },
  
  extensionId: async ({ context, browserName }, use) => {
    console.log('Getting extension ID...');
    try {
      // Open a page to trigger extension loading
      console.log('Opening new page...');
      const page = await context.newPage();
      
      console.log('Navigating to example.com...');
      await page.goto('https://example.com');
      
      console.log('Waiting for extension to load...');
      await page.waitForTimeout(2000); // Increased timeout

      let extensionId = 'unknown-extension-id';
      
      if (browserName === 'firefox') {
        // For Firefox, we use a fixed extension ID defined in the manifest
        extensionId = 'extension@chroniclesync.xyz';
      } else {
        // For Chrome, get extension ID from service worker or background page
        const workers = await context.serviceWorkers();
        console.log(`Found ${workers.length} service workers`);
        
        for (const worker of workers) {
          console.log('Service worker URL:', worker.url());
        }

        if (workers.length) {
          extensionId = workers[0].url().split('/')[2];
        } else {
          // Try to get from background pages
          const backgroundPages = context.backgroundPages();
          console.log(`Found ${backgroundPages.length} background pages`);
          for (const bgPage of backgroundPages) {
            console.log('Background page URL:', bgPage.url());
            if (bgPage.url().includes('chrome-extension://')) {
              extensionId = bgPage.url().split('/')[2];
              break;
            }
          }
        }
      }
      
      console.log('Extension ID:', extensionId);
      await use(extensionId);
      
      console.log('Closing test page...');
      await page.close();
      console.log('Test page closed');
    } catch (error) {
      console.error('Error getting extension ID:', error);
      throw error;
    }
  },
});

export const expect = test.expect;

export function getExtensionUrl(extensionId: string, path: string, browserName: string = 'chromium') {
  if (browserName === 'firefox') {
    return `moz-extension://${extensionId}/${path}`;
  }
  return `chrome-extension://${extensionId}/${path}`;
}