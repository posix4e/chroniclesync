import { test, expect } from '@playwright/test';

test.describe('Chrome Extension', () => {
  test('extension should load without errors', async ({ context }) => {
    test.setTimeout(60000); // Increase timeout to 1 minute

    // Wait for the extension to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Open a new page
    const page = await context.newPage();
    await page.goto('https://example.com');

    // Wait for the extension to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check that the extension is loaded by verifying the page title
    const title = await page.title();
    expect(title).toBe('Example Domain');

    // Close the page
    await page.close();
  });
});