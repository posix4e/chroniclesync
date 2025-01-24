const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function getExtensionId(userDataDir) {
  // Chrome stores extension info in Preferences file
  const preferencesPath = path.join(userDataDir, 'Default', 'Preferences');
  const preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf8'));
  const extensions = preferences.extensions.settings;
  
  // Find our extension by manifest name
  for (const [id, ext] of Object.entries(extensions)) {
    if (ext.manifest?.name === 'URL Logger') {
      return id;
    }
  }
  return null;
}

test('extension logs visited URLs', async ({ context, browser }) => {
  // Get the extension ID
  const userDataDir = browser.userDataDir;
  const extensionId = await getExtensionId(userDataDir);
  console.log('Extension ID:', extensionId);
  
  // Array to store console logs
  const logs = [];
  
  // Create a page and listen for console messages
  const page = await context.newPage();
  page.on('console', msg => {
    const text = msg.text();
    console.log('Console log:', text);
    if (text.startsWith('Page visited:')) {
      logs.push(text);
    }
  });

  // Visit a few test pages
  await page.goto('https://example.com');
  await page.waitForTimeout(500); // Wait for logs
  await page.goto('https://playwright.dev');
  await page.waitForTimeout(500); // Wait for logs
  
  // Visit the extension's background page
  if (extensionId) {
    const backgroundPage = await context.newPage();
    await backgroundPage.goto(`chrome-extension://${extensionId}/_generated_background_page.html`);
    console.log('Background page loaded');
  }
  
  // Verify logs contain the visited URLs
  expect(logs.length).toBeGreaterThan(0);
  expect(logs.some(log => log.includes('example.com'))).toBeTruthy();
  expect(logs.some(log => log.includes('playwright.dev'))).toBeTruthy();
});