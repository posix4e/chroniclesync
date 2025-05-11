import { test, expect } from '@playwright/test';
import { 
  createP2PInstancePage, 
  waitForP2PConnection,
  generateTestId
} from '../utils/p2p-helpers';

test.describe('P2P Performance', () => {
  test('should handle large data synchronization', async ({ browser }) => {
    // Create two separate contexts for the two instances
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    // Create pages for both instances
    const page1 = await createP2PInstancePage(context1, 12000);
    const page2 = await createP2PInstancePage(context2, 12001);
    
    // Wait for both instances to establish p2p connections
    await waitForP2PConnection(page1);
    await waitForP2PConnection(page2);
    
    // Generate large test data
    const testId = generateTestId();
    const largeData = {
      id: testId,
      title: 'Large Data Test',
      content: Array(1000).fill('Lorem ipsum dolor sit amet').join(' '), // ~20KB of text
      timestamp: Date.now()
    };
    
    // Measure time to add and sync large data
    const startTime = Date.now();
    
    // Add large data to instance 1
    await page1.evaluate((data) => {
      return window.addData(data);
    }, largeData);
    
    // Wait for data to sync to instance 2
    await page2.waitForFunction(
      (id) => window.checkDataExists(id),
      testId,
      { timeout: 60000 } // Longer timeout for large data
    );
    
    const syncTime = Date.now() - startTime;
    console.log(`Large data sync time: ${syncTime}ms`);
    
    // Verify data integrity after sync
    const syncedData = await page2.evaluate((id) => {
      return window.getData(id);
    }, testId);
    
    expect(syncedData.id).toBe(testId);
    expect(syncedData.title).toBe('Large Data Test');
    expect(syncedData.content.length).toBe(largeData.content.length);
    
    // Performance assertion - sync should complete within reasonable time
    expect(syncTime).toBeLessThan(30000); // Should sync within 30 seconds
    
    // Clean up
    await page1.close();
    await page2.close();
    await context1.close();
    await context2.close();
  });
  
  test('should handle batch synchronization of multiple items', async ({ browser }) => {
    // Create two separate contexts for the two instances
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    // Create pages for both instances
    const page1 = await createP2PInstancePage(context1, 12000);
    const page2 = await createP2PInstancePage(context2, 12001);
    
    // Wait for both instances to establish p2p connections
    await waitForP2PConnection(page1);
    await waitForP2PConnection(page2);
    
    // Generate multiple test data items
    const batchSize = 50;
    const testItems = Array(batchSize).fill(0).map((_, index) => ({
      id: `batch-${generateTestId()}-${index}`,
      title: `Batch Item ${index}`,
      content: `This is test content for batch item ${index}`,
      timestamp: Date.now() + index
    }));
    
    // Measure time to add and sync batch data
    const startTime = Date.now();
    
    // Add batch data to instance 1
    await page1.evaluate((items) => {
      return window.addBatchData(items);
    }, testItems);
    
    // Wait for all items to sync to instance 2
    for (let i = 0; i < testItems.length; i += 10) { // Check in groups of 10 to avoid too many checks
      const checkItems = testItems.slice(i, Math.min(i + 10, testItems.length));
      
      await page2.waitForFunction(
        (ids) => {
          return ids.every(id => window.checkDataExists(id));
        },
        checkItems.map(item => item.id),
        { timeout: 60000 } // Longer timeout for batch data
      );
    }
    
    const syncTime = Date.now() - startTime;
    console.log(`Batch data sync time for ${batchSize} items: ${syncTime}ms`);
    
    // Verify all items were synced
    const syncedCount = await page2.evaluate((ids) => {
      return ids.filter(id => window.checkDataExists(id)).length;
    }, testItems.map(item => item.id));
    
    expect(syncedCount).toBe(batchSize);
    
    // Performance assertion - batch sync should complete within reasonable time
    const averageTimePerItem = syncTime / batchSize;
    console.log(`Average sync time per item: ${averageTimePerItem}ms`);
    
    expect(averageTimePerItem).toBeLessThan(1000); // Average less than 1 second per item
    
    // Clean up
    await page1.close();
    await page2.close();
    await context1.close();
    await context2.close();
  });
});