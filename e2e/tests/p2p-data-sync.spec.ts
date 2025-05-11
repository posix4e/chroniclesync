import { test, expect } from '@playwright/test';
import { 
  createP2PInstancePage, 
  waitForP2PConnection,
  generateTestId,
  addTestData,
  verifyDataSynchronized
} from '../utils/p2p-helpers';

test.describe('P2P Data Synchronization', () => {
  test('should synchronize data between two instances', async ({ browser }) => {
    // Create two separate contexts for the two instances
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    // Create pages for both instances
    const page1 = await createP2PInstancePage(context1, 12000);
    const page2 = await createP2PInstancePage(context2, 12001);
    
    // Wait for both instances to establish p2p connections
    await waitForP2PConnection(page1);
    await waitForP2PConnection(page2);
    
    // Generate test data with unique identifier
    const testId = generateTestId();
    const testData = {
      id: testId,
      title: 'Test Data',
      content: 'This is test data for p2p synchronization',
      timestamp: Date.now()
    };
    
    // Add test data to instance 1
    await addTestData(page1, testData);
    
    // Verify data was added to instance 1
    const dataExistsInSource = await page1.evaluate((id) => {
      return window.checkDataExists(id);
    }, testId);
    
    expect(dataExistsInSource).toBeTruthy();
    
    // Verify data is synchronized to instance 2
    await verifyDataSynchronized(page1, page2, testId);
    
    // Verify the data content is identical in both instances
    const dataFromSource = await page1.evaluate((id) => {
      return window.getData(id);
    }, testId);
    
    const dataFromTarget = await page2.evaluate((id) => {
      return window.getData(id);
    }, testId);
    
    expect(dataFromTarget).toEqual(dataFromSource);
    
    // Clean up
    await page1.close();
    await page2.close();
    await context1.close();
    await context2.close();
  });
  
  test('should synchronize data after reconnection', async ({ browser }) => {
    // Create two separate contexts for the two instances
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    // Create pages for both instances
    const page1 = await createP2PInstancePage(context1, 12000);
    const page2 = await createP2PInstancePage(context2, 12001);
    
    // Wait for both instances to establish p2p connections
    await waitForP2PConnection(page1);
    await waitForP2PConnection(page2);
    
    // Disconnect instance 2
    await page2.evaluate(() => {
      return window.disconnectP2P();
    });
    
    // Wait for disconnected status
    await page2.waitForSelector('[data-testid="p2p-status-disconnected"]', { 
      state: 'visible' 
    });
    
    // Generate test data with unique identifier
    const testId = generateTestId();
    const testData = {
      id: testId,
      title: 'Offline Test Data',
      content: 'This data was created while peer was offline',
      timestamp: Date.now()
    };
    
    // Add test data to instance 1 while instance 2 is disconnected
    await addTestData(page1, testData);
    
    // Verify data was added to instance 1
    const dataExistsInSource = await page1.evaluate((id) => {
      return window.checkDataExists(id);
    }, testId);
    
    expect(dataExistsInSource).toBeTruthy();
    
    // Reconnect instance 2
    await page2.evaluate(() => {
      return window.reconnectP2P();
    });
    
    // Wait for reconnection
    await waitForP2PConnection(page2, 60000); // Longer timeout for reconnection
    
    // Verify data is synchronized to instance 2 after reconnection
    await verifyDataSynchronized(page1, page2, testId, 60000); // Longer timeout for sync after reconnection
    
    // Clean up
    await page1.close();
    await page2.close();
    await context1.close();
    await context2.close();
  });
  
  test('should handle bidirectional data synchronization', async ({ browser }) => {
    // Create two separate contexts for the two instances
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    // Create pages for both instances
    const page1 = await createP2PInstancePage(context1, 12000);
    const page2 = await createP2PInstancePage(context2, 12001);
    
    // Wait for both instances to establish p2p connections
    await waitForP2PConnection(page1);
    await waitForP2PConnection(page2);
    
    // Generate test data for instance 1
    const testId1 = generateTestId();
    const testData1 = {
      id: testId1,
      title: 'Test Data from Instance 1',
      content: 'This is test data from instance 1',
      timestamp: Date.now()
    };
    
    // Generate test data for instance 2
    const testId2 = generateTestId();
    const testData2 = {
      id: testId2,
      title: 'Test Data from Instance 2',
      content: 'This is test data from instance 2',
      timestamp: Date.now()
    };
    
    // Add test data to both instances
    await addTestData(page1, testData1);
    await addTestData(page2, testData2);
    
    // Verify data is synchronized in both directions
    await verifyDataSynchronized(page1, page2, testId1);
    await verifyDataSynchronized(page2, page1, testId2);
    
    // Clean up
    await page1.close();
    await page2.close();
    await context1.close();
    await context2.close();
  });
});