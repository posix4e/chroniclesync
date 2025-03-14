import { test, expect } from '@playwright/test';
import { server } from './test-config';

// Safari extension testing on iOS
test.describe('iOS Safari Extension', () => {
  // Since we can't directly test the extension in iOS Safari through Playwright,
  // we'll test the web functionality that the extension would interact with
  
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

    // Navigate to a test page
    await page.goto('https://example.com');
    
    // Check that the page loaded correctly
    await expect(page).toHaveTitle('Example Domain');
    
    // Test responsive design for mobile Safari
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThan(500); // Should be mobile viewport
    
    // Wait a bit to catch any immediate errors
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });

  test('API health check should be successful', async ({ page }) => {
    // Generate a test client ID
    const testClientId = `test-ios-${Date.now()}`;
    
    // Store the client ID in localStorage (simulating what the extension would do)
    await page.goto('https://example.com');
    await page.evaluate((clientId) => {
      localStorage.setItem('chroniclesync_client_id', clientId);
    }, testClientId);
    
    // Now test the API health endpoint with the client ID
    const apiUrl = process.env.API_URL || server.apiUrl;
    console.log('Testing API health at:', `${apiUrl}/health`);
    
    const healthResponse = await page.request.get(`${apiUrl}/health`, {
      headers: {
        'X-Client-Id': testClientId
      }
    });
    console.log('Health check status:', healthResponse.status());
    
    let responseBody;
    try {
      responseBody = await healthResponse.json();
    } catch (error) {
      const responseText = await healthResponse.text();
      console.log('Health check response text:', responseText);
      if (responseText === 'Client ID required') {
        throw new Error('Client ID was not properly set in the request headers');
      }
      throw error;
    }
    console.log('Health check response:', responseBody);
    
    expect(healthResponse.ok()).toBeTruthy();
    expect(responseBody.healthy).toBeTruthy();
  });

  test('should handle touch interactions on iOS', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Test touch-specific interactions
    await page.touchscreen.tap(100, 100);
    
    // Test scrolling with touch
    await page.mouse.wheel(0, 500);
    
    // Verify we've scrolled down
    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBeGreaterThan(0);
  });
  
  test('should work with iOS Safari user agent', async ({ page }) => {
    await page.goto('https://www.whatismybrowser.com/detect/what-is-my-user-agent/');
    
    // Check that we're identified as an iOS device
    const content = await page.textContent('body');
    expect(content).toContain('iPhone');
    expect(content).toContain('Safari');
  });
  
  test('web app should load React components correctly', async ({ page }) => {
    // Navigate to the web app (simulating what would be loaded in the extension)
    const webAppUrl = process.env.WEB_APP_URL || server.webUrl;
    await page.goto(webAppUrl);
    
    // Wait for the root element to be visible
    const rootElement = await page.locator('#root');
    await expect(rootElement).toBeVisible();
    
    // Wait for React to mount and render content
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Give React a moment to hydrate
    
    // Check for React-specific attributes and content
    const reactRoot = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root?.hasAttribute('data-reactroot') ||
             (root?.children.length ?? 0) > 0;
    });
    expect(reactRoot).toBeTruthy();
    
    // Check for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
    
    // Take a screenshot of the web app
    await page.screenshot({
      path: 'test-results/ios-safari/web-app.png',
      fullPage: true
    });
  });
  
  test('content script functionality simulation', async ({ page }) => {
    // Navigate to a test page
    await page.goto('https://example.com');
    
    // Simulate content script functionality by injecting and executing JavaScript
    await page.evaluate(() => {
      // Create a mock history entry (simulating what the content script would do)
      const historyEntry = {
        url: window.location.href,
        title: document.title,
        timestamp: Date.now(),
        visitCount: 1
      };
      
      // Store in localStorage (simulating extension storage)
      const history = JSON.parse(localStorage.getItem('chroniclesync_history') || '[]');
      history.push(historyEntry);
      localStorage.setItem('chroniclesync_history', JSON.stringify(history));
      
      // Add a visual indicator that the "content script" ran
      const indicator = document.createElement('div');
      indicator.id = 'chroniclesync-indicator';
      indicator.textContent = 'ChronicleSync Active';
      indicator.style.position = 'fixed';
      indicator.style.top = '10px';
      indicator.style.right = '10px';
      indicator.style.backgroundColor = 'rgba(0, 128, 255, 0.8)';
      indicator.style.color = 'white';
      indicator.style.padding = '5px 10px';
      indicator.style.borderRadius = '5px';
      indicator.style.zIndex = '9999';
      document.body.appendChild(indicator);
    });
    
    // Verify the history entry was created
    const historyEntries = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('chroniclesync_history') || '[]');
    });
    
    expect(historyEntries.length).toBeGreaterThan(0);
    expect(historyEntries[0].url).toBe('https://example.com/');
    expect(historyEntries[0].title).toBe('Example Domain');
    
    // Verify the indicator is visible
    await expect(page.locator('#chroniclesync-indicator')).toBeVisible();
    await expect(page.locator('#chroniclesync-indicator')).toHaveText('ChronicleSync Active');
  });
  
  test('history sync simulation', async ({ page, context }) => {
    // First page visit
    await page.goto('https://example.com');
    await page.evaluate(() => {
      const historyEntry = {
        url: window.location.href,
        title: document.title,
        timestamp: Date.now(),
        visitCount: 1
      };
      const history = JSON.parse(localStorage.getItem('chroniclesync_history') || '[]');
      history.push(historyEntry);
      localStorage.setItem('chroniclesync_history', JSON.stringify(history));
    });
    
    // Second page visit
    await page.goto('https://playwright.dev');
    await page.evaluate(() => {
      const historyEntry = {
        url: window.location.href,
        title: document.title,
        timestamp: Date.now(),
        visitCount: 1
      };
      const history = JSON.parse(localStorage.getItem('chroniclesync_history') || '[]');
      history.push(historyEntry);
      localStorage.setItem('chroniclesync_history', JSON.stringify(history));
    });
    
    // Simulate sync by opening a new page
    const syncPage = await context.newPage();
    await syncPage.goto('https://example.com');
    
    // Transfer history from first page to second (simulating sync)
    const history = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('chroniclesync_history') || '[]');
    });
    
    await syncPage.evaluate((historyData) => {
      localStorage.setItem('chroniclesync_history', JSON.stringify(historyData));
    }, history);
    
    // Verify history was synced
    const syncedHistory = await syncPage.evaluate(() => {
      return JSON.parse(localStorage.getItem('chroniclesync_history') || '[]');
    });
    
    expect(syncedHistory.length).toBe(2);
    expect(syncedHistory[0].url).toBe('https://example.com/');
    expect(syncedHistory[1].url).toBe('https://playwright.dev/');
  });
});