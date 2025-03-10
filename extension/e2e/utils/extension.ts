/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, chromium, type BrowserContext } from '@playwright/test';
import { paths } from '../../src/config';
import path from 'path';
import { loadFirefoxExtension, getFirefoxExtensionId } from './firefox-extension-helper';
import { loadSafariExtension, getSafariExtensionId } from './safari-extension-helper';

// Define paths for each platform's extension
const extensionPaths = {
  chrome: paths.extension,
  firefox: path.join(paths.extension, '..', 'firefox-extension'),
  safari: path.join(paths.extension, '..', 'safari-extension'),
};

export type TestFixtures = {
  context: BrowserContext;
  extensionId: string;
};

export const test = base.extend<TestFixtures>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    console.log('Starting browser context creation...');
    
    // Determine which browser to use based on environment variable or default to chromium
    const browserName = process.env.BROWSER || 'chromium';
    console.log(`Using browser: ${browserName}`);
    
    let context: BrowserContext;
    
    try {
      if (browserName === 'firefox') {
        console.log('Extension path for Firefox:', extensionPaths.firefox);
        context = await loadFirefoxExtension(extensionPaths.firefox);
      } else if (browserName === 'webkit') {
        console.log('Extension path for Safari:', extensionPaths.safari);
        context = await loadSafariExtension(extensionPaths.safari);
      } else {
        // Default to Chrome/Chromium
        console.log('Extension path for Chrome:', extensionPaths.chrome);
        context = await chromium.launchPersistentContext('', {
          headless: false,
          args: [
            `--disable-extensions-except=${extensionPaths.chrome}`,
            `--load-extension=${extensionPaths.chrome}`,
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

      // Service workers are only available in Chromium
      if (browserName === 'chromium') {
        const workers = await context.serviceWorkers();
        console.log(`Service workers: ${workers.length}`);
        for (const worker of workers) {
          console.log('Worker URL:', worker.url());
        }
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
  extensionId: async ({ context }, use) => {
    console.log('Getting extension ID...');
    
    // Determine which browser to use based on environment variable or default to chromium
    const browserName = process.env.BROWSER || 'chromium';
    
    try {
      let extensionId: string;
      
      if (browserName === 'firefox') {
        // For Firefox, use the predefined extension ID
        extensionId = getFirefoxExtensionId();
      } else if (browserName === 'webkit') {
        // For Safari/WebKit, use the predefined extension ID
        extensionId = getSafariExtensionId();
      } else {
        // For Chrome/Chromium, get the extension ID dynamically
        // Open a page to trigger extension loading
        console.log('Opening new page...');
        const page = await context.newPage();
        
        console.log('Navigating to example.com...');
        await page.goto('https://example.com');
        
        console.log('Waiting for extension to load...');
        await page.waitForTimeout(2000); // Increased timeout

        // Get extension ID from service worker
        console.log('Getting service workers...');
        const workers = await context.serviceWorkers();
        console.log(`Found ${workers.length} service workers`);
        
        for (const worker of workers) {
          console.log('Service worker URL:', worker.url());
        }

        extensionId = workers.length ? 
          workers[0].url().split('/')[2] : 
          'unknown-extension-id';
          
        // Additional debugging: check background page
        const backgroundPages = context.backgroundPages();
        console.log(`Found ${backgroundPages.length} background pages`);
        for (const bgPage of backgroundPages) {
          console.log('Background page URL:', bgPage.url());
        }
        
        console.log('Closing test page...');
        await page.close();
      }
      
      console.log('Extension ID:', extensionId);
      await use(extensionId);
    } catch (error) {
      console.error('Error getting extension ID:', error);
      throw error;
    }
  },
});

export const expect = test.expect;

export function getExtensionUrl(extensionId: string, path: string) {
  // Determine which browser to use based on environment variable or default to chromium
  const browserName = process.env.BROWSER || 'chromium';
  
  if (browserName === 'firefox') {
    return `moz-extension://${extensionId}/${path}`;
  } else if (browserName === 'webkit') {
    // For Safari, we'd use a different URL format, but for testing purposes
    // we'll just use a mock URL since WebKit in Playwright doesn't support extensions directly
    return `safari-web-extension://${extensionId}/${path}`;
  } else {
    // Default to Chrome/Chromium
    return `chrome-extension://${extensionId}/${path}`;
  }
}