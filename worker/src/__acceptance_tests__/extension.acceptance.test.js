import { chromium } from 'playwright';
import path from 'path';

describe('ChronicleSync Extension Acceptance Tests', () => {
  let browser;
  let context;
  let page;
  const stagingUrl = process.env.STAGING_URL || 'https://staging.chroniclesync.com';
  const extensionPath = path.resolve(__dirname, '../../../dist');

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`
      ]
    });
  });

  beforeEach(async () => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterEach(async () => {
    await context.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should successfully authenticate with the service', async () => {
    await page.goto(stagingUrl);
    
    // Test authentication flow
    const loginButton = await page.waitForSelector('[data-testid="login-button"]');
    await loginButton.click();
    
    // Wait for auth completion and verify success
    await page.waitForSelector('[data-testid="user-profile"]', { timeout: 30000 });
    const profileElement = await page.$('[data-testid="user-profile"]');
    expect(profileElement).toBeTruthy();
  });
});