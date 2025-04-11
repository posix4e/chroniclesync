import { BrowserContext } from '@playwright/test';

/**
 * Gets the extension ID for the ChronicleSync extension in a browser context
 */
export async function getExtensionId(context: BrowserContext): Promise<string> {
  // Open the extensions page
  const page = await context.newPage();
  await page.goto('chrome://extensions/');
  
  // Look for the extension ID in the page
  const extensionId = await page.evaluate(() => {
    const extensions = document.querySelectorAll('extensions-item');
    for (const extension of extensions) {
      const name = extension.querySelector('#name')?.textContent;
      if (name && name.includes('ChronicleSync')) {
        const idElement = extension.querySelector('#extension-id');
        return idElement ? idElement.textContent : null;
      }
    }
    return null;
  });
  
  await page.close();
  
  if (!extensionId) {
    throw new Error('Could not find ChronicleSync extension ID');
  }
  
  return extensionId;
}