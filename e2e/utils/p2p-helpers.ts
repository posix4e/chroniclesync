import { Page, BrowserContext, expect } from '@playwright/test';

/**
 * Helper functions for p2p testing
 */

/**
 * Creates a new browser context and page for a specific p2p instance
 * @param context The browser context
 * @param port The port number for the p2p instance
 * @returns A new page connected to the specified p2p instance
 */
export async function createP2PInstancePage(context: BrowserContext, port: number): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`http://localhost:${port}`);
  
  // Wait for the application to load
  await page.waitForSelector('#root', { state: 'visible' });
  
  return page;
}

/**
 * Waits for a p2p connection to be established
 * @param page The page to check for p2p connection
 * @param timeout Maximum time to wait for connection in milliseconds
 */
export async function waitForP2PConnection(page: Page, timeout = 30000): Promise<void> {
  console.log('Waiting for p2p connection...');
  
  // Wait for the p2p connection indicator to show connected status
  await page.waitForSelector('[data-testid="p2p-status-connected"]', { 
    state: 'visible',
    timeout
  });
  
  console.log('P2P connection established');
}

/**
 * Generates a unique test identifier
 * @returns A unique string identifier for test data
 */
export function generateTestId(): string {
  return `test-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/**
 * Adds test data to a p2p instance
 * @param page The page to add data to
 * @param data The data to add
 */
export async function addTestData(page: Page, data: any): Promise<void> {
  // Use the page's evaluate function to call the app's API for adding data
  await page.evaluate((testData) => {
    // This assumes there's a window.addData function exposed by the application
    // You'll need to adjust this based on your actual application's API
    return window.addData(testData);
  }, data);
}

/**
 * Verifies that data has been synchronized between p2p instances
 * @param sourcePage The page that originated the data
 * @param targetPage The page that should receive the data via p2p
 * @param testId The unique identifier for the test data
 * @param timeout Maximum time to wait for synchronization in milliseconds
 */
export async function verifyDataSynchronized(
  sourcePage: Page, 
  targetPage: Page, 
  testId: string,
  timeout = 30000
): Promise<void> {
  console.log(`Verifying data synchronization for test ID: ${testId}`);
  
  // Wait for the data to appear in the target page
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    // Check if the data exists in the target page
    const dataExists = await targetPage.evaluate((id) => {
      // This assumes there's a window.checkDataExists function exposed by the application
      // You'll need to adjust this based on your actual application's API
      return window.checkDataExists(id);
    }, testId);
    
    if (dataExists) {
      console.log('Data successfully synchronized');
      return;
    }
    
    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error(`Data synchronization timed out after ${timeout}ms`);
}

/**
 * Disconnects a p2p instance from the network
 * @param page The page to disconnect
 */
export async function disconnectP2PInstance(page: Page): Promise<void> {
  // Use the page's evaluate function to call the app's API for disconnecting
  await page.evaluate(() => {
    // This assumes there's a window.disconnectP2P function exposed by the application
    // You'll need to adjust this based on your actual application's API
    return window.disconnectP2P();
  });
  
  // Wait for the disconnected status to appear
  await page.waitForSelector('[data-testid="p2p-status-disconnected"]', { 
    state: 'visible' 
  });
  
  console.log('P2P instance disconnected');
}

/**
 * Reconnects a p2p instance to the network
 * @param page The page to reconnect
 */
export async function reconnectP2PInstance(page: Page): Promise<void> {
  // Use the page's evaluate function to call the app's API for reconnecting
  await page.evaluate(() => {
    // This assumes there's a window.reconnectP2P function exposed by the application
    // You'll need to adjust this based on your actual application's API
    return window.reconnectP2P();
  });
  
  // Wait for the connected status to appear
  await page.waitForSelector('[data-testid="p2p-status-connected"]', { 
    state: 'visible' 
  });
  
  console.log('P2P instance reconnected');
}