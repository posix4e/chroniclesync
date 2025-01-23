import { test, expect } from './utils/extension';

test.describe('Chrome Extension', () => {
  test('should load without errors', async ({ page, context }) => {
    // Check for any console errors
    const errors: string[] = [];
    context.on('weberror', error => {
      errors.push(error.error().message);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit to catch any immediate errors
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });

  test('background script should be healthy', async ({ context }) => {
    // Service worker should already be available from the context setup
    const workers = context.serviceWorkers();
    expect(workers.length).toBeGreaterThan(0, 'No service workers found');
    
    const backgroundWorker = workers[0];
    expect(backgroundWorker.url()).toContain('chrome-extension://', 'Invalid service worker URL');
    
    // Create a page to test background script communication
    const page = await context.newPage();
    await page.goto('about:blank');
    
    // Add the extension background script to the page
    await page.addScriptTag({
      content: `
        window.sendMessage = async (type) => {
          return new Promise((resolve) => {
            chrome.runtime.sendMessage({ type }, response => {
              resolve(response);
            });
          });
        }
      `
    });

    // Test the health check
    const health = await page.evaluate(async () => {
      type HealthCheck = { status: string; timestamp: number };
      type ExtendedWindow = Window & {
        // eslint-disable-next-line no-unused-vars
        sendMessage: (message: 'health_check') => Promise<HealthCheck>;
      };
      return (window as ExtendedWindow).sendMessage('health_check');
    });

    expect(health).toBeDefined();
    expect(health.status).toBe('healthy');
    expect(typeof health.timestamp).toBe('number');
    await page.close();
  });

  test('should have valid extension ID', async ({ context }) => {
    // Service worker should already be available from the context setup
    const workers = context.serviceWorkers();
    expect(workers.length).toBeGreaterThan(0, 'No service workers found');
    
    const backgroundWorker = workers[0];
    const url = backgroundWorker.url();
    expect(url).toBeTruthy('Service worker URL is empty');
    expect(url).toContain('chrome-extension://');
    
    // Extract extension ID from URL
    const match = url.match(/chrome-extension:\/\/([^/]+)/);
    expect(match).toBeTruthy();
    if (!match) {
      throw new Error('Failed to extract extension ID from URL');
    }
    const extensionId = match[1];
    
    // Open popup and verify it loads with the correct extension ID
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Verify the popup loads correctly with this ID
    const rootElement = await popupPage.locator('#root');
    await expect(rootElement).toBeVisible();
  });

  test('popup should load React app correctly', async ({ context }) => {
    // Open extension popup directly from extension directory
    const popupPage = await context.newPage();
    await popupPage.goto(`file://${process.cwd()}/../extension/popup.html`);

    // Wait for the root element to be visible
    const rootElement = await popupPage.locator('#root');
    await expect(rootElement).toBeVisible();

    // Wait for React to mount and render content
    await popupPage.waitForLoadState('networkidle');
    await popupPage.waitForTimeout(1000); // Give React a moment to hydrate

    // Check for specific app content
    await expect(popupPage.locator('h1')).toHaveText('ChronicleSync');
    await expect(popupPage.locator('#adminLogin h2')).toHaveText('Admin Login');
    await expect(popupPage.locator('#adminLogin')).toBeVisible();

    // Check for React-specific attributes and content
    const reactRoot = await popupPage.evaluate(() => {
      const root = document.getElementById('root');
      return root?.hasAttribute('data-reactroot') ||
             (root?.children.length ?? 0) > 0;
    });
    expect(reactRoot).toBeTruthy();

    // Check for console errors
    const errors: string[] = [];
    popupPage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await popupPage.waitForTimeout(1000);
    expect(errors).toEqual([]);

    // Take a screenshot of the popup
    await popupPage.screenshot({
      path: 'test-results/extension-popup.png',
      fullPage: true
    });
  });
});