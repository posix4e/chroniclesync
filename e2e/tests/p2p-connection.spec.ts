import { test, expect } from '@playwright/test';
import { 
  createP2PInstancePage, 
  waitForP2PConnection 
} from '../utils/p2p-helpers';

test.describe('P2P Connection', () => {
  test('should establish p2p connection between two instances', async ({ browser }) => {
    // Create two separate contexts for the two instances
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    // Create pages for both instances
    const page1 = await createP2PInstancePage(context1, 12000);
    const page2 = await createP2PInstancePage(context2, 12001);
    
    // Wait for both instances to establish p2p connections
    await waitForP2PConnection(page1);
    await waitForP2PConnection(page2);
    
    // Verify connection status indicators
    await expect(page1.locator('[data-testid="p2p-status-connected"]')).toBeVisible();
    await expect(page2.locator('[data-testid="p2p-status-connected"]')).toBeVisible();
    
    // Verify peer count (should be at least 1)
    const peerCount1 = await page1.locator('[data-testid="peer-count"]').textContent();
    const peerCount2 = await page2.locator('[data-testid="peer-count"]').textContent();
    
    expect(Number(peerCount1)).toBeGreaterThanOrEqual(1);
    expect(Number(peerCount2)).toBeGreaterThanOrEqual(1);
    
    // Clean up
    await page1.close();
    await page2.close();
    await context1.close();
    await context2.close();
  });
  
  test('should reconnect after temporary disconnection', async ({ browser }) => {
    // Create two separate contexts for the two instances
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    // Create pages for both instances
    const page1 = await createP2PInstancePage(context1, 12000);
    const page2 = await createP2PInstancePage(context2, 12001);
    
    // Wait for both instances to establish p2p connections
    await waitForP2PConnection(page1);
    await waitForP2PConnection(page2);
    
    // Disconnect instance 1 by simulating network disconnection
    await page1.evaluate(() => {
      // This assumes there's a window.disconnectP2P function exposed by the application
      return window.disconnectP2P();
    });
    
    // Wait for disconnected status
    await page1.waitForSelector('[data-testid="p2p-status-disconnected"]', { 
      state: 'visible' 
    });
    
    // Verify instance 1 is disconnected
    await expect(page1.locator('[data-testid="p2p-status-disconnected"]')).toBeVisible();
    
    // Reconnect instance 1
    await page1.evaluate(() => {
      // This assumes there's a window.reconnectP2P function exposed by the application
      return window.reconnectP2P();
    });
    
    // Wait for reconnection
    await waitForP2PConnection(page1, 60000); // Longer timeout for reconnection
    
    // Verify both instances are connected again
    await expect(page1.locator('[data-testid="p2p-status-connected"]')).toBeVisible();
    await expect(page2.locator('[data-testid="p2p-status-connected"]')).toBeVisible();
    
    // Clean up
    await page1.close();
    await page2.close();
    await context1.close();
    await context2.close();
  });
});