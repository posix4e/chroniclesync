import { Page } from '@playwright/test';

/**
 * Waits for history sync to complete by checking the sync status
 */
export async function waitForHistorySync(page: Page, timeout = 5000): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const syncStatus = await page.evaluate(() => {
      const statusElement = document.querySelector('#syncStatus');
      return statusElement ? statusElement.textContent : null;
    });
    
    if (syncStatus && syncStatus.includes('Sync complete')) {
      return;
    }
    
    await page.waitForTimeout(500);
  }
  
  throw new Error(`Sync did not complete within ${timeout}ms`);
}