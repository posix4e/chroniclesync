import { chromium } from 'playwright';
import path from 'path';

describe('ChronicleSync Extension Acceptance Tests', () => {
  let browser;
  let context;
  let page;
  const stagingUrl = process.env.STAGING_URL || 'https://staging.chroniclesync.xyz';
  const extensionPath = path.resolve(__dirname, '../../../pages/dist/extension');

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
      permissions: ['history'] // Request history permission
    });
    page = await context.newPage();
  });

  afterEach(async () => {
    await context.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('extension popup opens dashboard', async () => {
    // Get the extension background page
    const backgroundPage = await context.backgroundPages()[0];
    if (!backgroundPage) {
      await context.waitForEvent('backgroundpage');
    }

    // Open a new page and wait for extension to be ready
    const page = await context.newPage();
    await page.goto('about:blank'); // Any page to have extension active

    // Get extension popup
    const extensionPopup = await context.newPage();
    const extensionUrl = await context.evaluateHandle(() => {
      return browser.runtime.getURL('popup.html');
    });
    await extensionPopup.goto(extensionUrl.toString());

    // Verify popup content
    const title = await extensionPopup.$('h2');
    expect(await title.textContent()).toBe('OpenHands History Sync');

    // Click dashboard button
    const dashboardButton = await extensionPopup.$('#openDashboard');
    
    // Create a promise to wait for the new tab
    const newTabPromise = context.waitForEvent('page');
    
    // Click the button
    await dashboardButton.click();
    
    // Wait for the new tab and verify it loads the dashboard
    const newTab = await newTabPromise;
    await newTab.waitForLoadState('networkidle');
    
    // Verify we're on the dashboard
    expect(newTab.url()).toContain(stagingUrl);
  });
});