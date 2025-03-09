/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, chromium, firefox, webkit, type BrowserContext, type BrowserType } from '@playwright/test';
import { paths } from '../../src/config';
import { resolve } from 'path';
import { existsSync } from 'fs';

export type TestFixtures = {
  context: BrowserContext;
  extensionId: string;
  browserName: string;
};

// Determine which extension package to use based on browser
function getExtensionPath(browserName: string): string {
  // Default to the dist directory for development
  let extensionPath = paths.extension;
  
  // Check if we have browser-specific packages available
  const chromePackage = resolve(__dirname, '../../package/chrome');
  const firefoxPackage = resolve(__dirname, '../../package/firefox');
  const safariPackage = resolve(__dirname, '../../package/safari');
  
  if (browserName === 'chromium' && existsSync(chromePackage)) {
    extensionPath = chromePackage;
  } else if (browserName === 'firefox' && existsSync(firefoxPackage)) {
    extensionPath = firefoxPackage;
  } else if (browserName === 'webkit' && existsSync(safariPackage)) {
    extensionPath = safariPackage;
  }
  
  console.log(`Using extension path for ${browserName}:`, extensionPath);
  return extensionPath;
}

export const test = base.extend<TestFixtures>({
  browserName: [({ browserName }, use) => use(browserName), { scope: 'worker' }],
  
  // eslint-disable-next-line no-empty-pattern
  context: async ({ browserName }, use) => {
    console.log(`Starting ${browserName} browser context creation...`);
    const extensionPath = getExtensionPath(browserName);
    console.log('Extension path:', extensionPath);
    
    let browser: BrowserType;
    let context: BrowserContext;
    
    try {
      // Select the appropriate browser
      switch (browserName) {
        case 'firefox':
          browser = firefox;
          break;
        case 'webkit':
          browser = webkit;
          break;
        case 'chromium':
        default:
          browser = chromium;
          break;
      }
      
      // Browser-specific launch options
      if (browserName === 'chromium') {
        context = await chromium.launchPersistentContext('', {
          headless: false,
          args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
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
      } else if (browserName === 'firefox') {
        // Firefox requires a different approach for loading extensions
        const firefoxOptions = {
          headless: false,
          firefoxUserPrefs: {
            'extensions.webextensions.uuids': '{"chroniclesync@chroniclesync.xyz": "test-extension-id"}',
            'xpinstall.signatures.required': false,
          },
        };
        
        context = await firefox.launchPersistentContext('', firefoxOptions);
        
        // For Firefox, we need to install the extension after context is created
        const extensionId = await context.evaluateHandle(async (extensionPath) => {
          // @ts-ignore - Firefox-specific API
          const addon = await browser.runtime.installTemporaryAddon(extensionPath);
          return addon.id;
        }, extensionPath);
        
        console.log('Firefox extension installed with ID:', await extensionId.jsonValue());
      } else {
        // For Safari/WebKit, we can only test the UI without extension functionality
        context = await webkit.launchPersistentContext('', {
          headless: false,
        });
      }

      console.log(`${browserName} browser context created successfully`);
      
      // Log browser and extension info
      const pages = context.pages();
      console.log(`Initial pages: ${pages.length}`);
      for (const page of pages) {
        console.log('Page URL:', page.url());
      }

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
      console.error(`Error in ${browserName} browser context:`, error);
      throw error;
    }
  },
  
  extensionId: async ({ context, browserName }, use) => {
    console.log(`Getting extension ID for ${browserName}...`);
    let extensionId = 'unknown-extension-id';
    
    try {
      // Open a page to trigger extension loading
      console.log('Opening new page...');
      const page = await context.newPage();
      
      console.log('Navigating to example.com...');
      await page.goto('https://example.com');
      
      console.log('Waiting for extension to load...');
      await page.waitForTimeout(2000); // Increased timeout

      // Browser-specific ways to get the extension ID
      if (browserName === 'chromium') {
        // Get extension ID from service worker for Chrome
        console.log('Getting service workers...');
        const workers = await context.serviceWorkers();
        console.log(`Found ${workers.length} service workers`);
        
        for (const worker of workers) {
          console.log('Worker URL:', worker.url());
        }

        extensionId = workers.length ? 
          workers[0].url().split('/')[2] : 
          'unknown-extension-id';
      } else if (browserName === 'firefox') {
        // For Firefox, we use a fixed ID from the manifest
        extensionId = 'chroniclesync@chroniclesync.xyz';
      } else if (browserName === 'webkit') {
        // For Safari, we use a placeholder ID for testing UI only
        extensionId = 'safari-extension-id';
      }
      
      console.log(`${browserName} extension ID:`, extensionId);

      // Additional debugging for Chrome
      if (browserName === 'chromium') {
        const backgroundPages = context.backgroundPages();
        console.log(`Found ${backgroundPages.length} background pages`);
        for (const bgPage of backgroundPages) {
          console.log('Background page URL:', bgPage.url());
        }
      }

      await use(extensionId);
      
      console.log('Closing test page...');
      await page.close();
      console.log('Test page closed');
    } catch (error) {
      console.error(`Error getting ${browserName} extension ID:`, error);
      throw error;
    }
  },
});

export const expect = test.expect;

export function getExtensionUrl(extensionId: string, path: string, browserName = 'chromium') {
  if (browserName === 'firefox') {
    return `moz-extension://${extensionId}/${path}`;
  } else if (browserName === 'webkit' || browserName === 'safari') {
    return `safari-web-extension://${extensionId}/${path}`;
  } else {
    return `chrome-extension://${extensionId}/${path}`;
  }
}