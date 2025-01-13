import { chromium } from 'playwright';
import path from 'path';

describe('ChronicleSync Extension Acceptance Tests', () => {
  let browser;
  let context;
  let page;
  const stagingUrl = process.env.STAGING_URL || 'https://staging.chroniclesync.com';
  const extensionPath = path.resolve(__dirname, '../../../dist');

  beforeAll(async () => {
    // Launch browser with the actual extension loaded
    browser = await chromium.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`
      ]
    });
  });

  beforeEach(async () => {
    // Create a fresh context for each test
    context = await browser.newContext({
      permissions: ['bookmarks'] // Request bookmarks permission
    });
    page = await context.newPage();
  });

  afterEach(async () => {
    await context.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('complete authentication flow', async () => {
    // Navigate to staging environment
    await page.goto(stagingUrl);
    
    // Click the extension icon to open popup
    const extensionButton = await page.waitForSelector('[data-testid="chroniclesync-extension-button"]');
    await extensionButton.click();
    
    // Click login and complete OAuth flow
    const loginButton = await page.waitForSelector('[data-testid="login-button"]');
    await loginButton.click();
    
    // Wait for OAuth redirect and completion
    await page.waitForURL((url) => url.href.includes('oauth/callback'));
    
    // Verify we're authenticated by checking for user profile
    await page.waitForSelector('[data-testid="user-profile"]', { timeout: 30000 });
    
    // Verify extension is ready for sync
    const syncButton = await page.waitForSelector('[data-testid="sync-button"]');
    expect(await syncButton.isEnabled()).toBe(true);
  });
});