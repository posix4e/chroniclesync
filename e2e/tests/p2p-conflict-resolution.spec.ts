import { test, expect } from '@playwright/test';
import { 
  createP2PInstancePage, 
  waitForP2PConnection,
  generateTestId,
  disconnectP2PInstance,
  reconnectP2PInstance
} from '../utils/p2p-helpers';

test.describe('P2P Conflict Resolution', () => {
  test('should resolve conflicts when same data is modified offline', async ({ browser }) => {
    // Create two separate contexts for the two instances
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    // Create pages for both instances
    const page1 = await createP2PInstancePage(context1, 12000);
    const page2 = await createP2PInstancePage(context2, 12001);
    
    // Wait for both instances to establish p2p connections
    await waitForP2PConnection(page1);
    await waitForP2PConnection(page2);
    
    // Generate shared test data with unique identifier
    const testId = generateTestId();
    const initialData = {
      id: testId,
      title: 'Original Title',
      content: 'Original content',
      timestamp: Date.now()
    };
    
    // Add initial data to instance 1
    await page1.evaluate((data) => {
      return window.addData(data);
    }, initialData);
    
    // Wait for data to sync to instance 2
    await page2.waitForFunction(
      (id) => window.checkDataExists(id),
      testId,
      { timeout: 30000 }
    );
    
    // Disconnect both instances
    await disconnectP2PInstance(page1);
    await disconnectP2PInstance(page2);
    
    // Modify the same data in both instances while disconnected
    const modification1 = {
      id: testId,
      title: 'Modified by Instance 1',
      content: 'Content modified by instance 1',
      timestamp: Date.now() + 1000
    };
    
    const modification2 = {
      id: testId,
      title: 'Modified by Instance 2',
      content: 'Content modified by instance 2',
      timestamp: Date.now() + 2000 // Higher timestamp should win in conflict
    };
    
    // Apply modifications
    await page1.evaluate((data) => {
      return window.updateData(data);
    }, modification1);
    
    await page2.evaluate((data) => {
      return window.updateData(data);
    }, modification2);
    
    // Reconnect both instances
    await reconnectP2PInstance(page1);
    await reconnectP2PInstance(page2);
    
    // Wait for conflict resolution
    await page1.waitForTimeout(5000);
    
    // Get final data from both instances
    const finalData1 = await page1.evaluate((id) => {
      return window.getData(id);
    }, testId);
    
    const finalData2 = await page2.evaluate((id) => {
      return window.getData(id);
    }, testId);
    
    // Verify both instances have the same data after conflict resolution
    expect(finalData1).toEqual(finalData2);
    
    // Verify the winning data is the one with the higher timestamp
    expect(finalData1.title).toBe('Modified by Instance 2');
    expect(finalData1.content).toBe('Content modified by instance 2');
    
    // Clean up
    await page1.close();
    await page2.close();
    await context1.close();
    await context2.close();
  });
  
  test('should handle concurrent modifications with custom merge strategy', async ({ browser }) => {
    // Create two separate contexts for the two instances
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    // Create pages for both instances
    const page1 = await createP2PInstancePage(context1, 12000);
    const page2 = await createP2PInstancePage(context2, 12001);
    
    // Wait for both instances to establish p2p connections
    await waitForP2PConnection(page1);
    await waitForP2PConnection(page2);
    
    // Generate shared test data with unique identifier
    const testId = generateTestId();
    const initialData = {
      id: testId,
      title: 'Original Title',
      tags: ['tag1', 'tag2'],
      items: ['item1', 'item2'],
      timestamp: Date.now()
    };
    
    // Add initial data to instance 1
    await page1.evaluate((data) => {
      return window.addData(data);
    }, initialData);
    
    // Wait for data to sync to instance 2
    await page2.waitForFunction(
      (id) => window.checkDataExists(id),
      testId,
      { timeout: 30000 }
    );
    
    // Disconnect both instances
    await disconnectP2PInstance(page1);
    await disconnectP2PInstance(page2);
    
    // Modify different parts of the data in both instances while disconnected
    const modification1 = {
      id: testId,
      title: 'Modified Title',
      tags: ['tag1', 'tag2', 'tag3'], // Added tag3
      items: ['item1', 'item2'],
      timestamp: Date.now() + 1000
    };
    
    const modification2 = {
      id: testId,
      title: 'Original Title',
      tags: ['tag1', 'tag2'],
      items: ['item1', 'item2', 'item3'], // Added item3
      timestamp: Date.now() + 1000
    };
    
    // Apply modifications
    await page1.evaluate((data) => {
      return window.updateData(data);
    }, modification1);
    
    await page2.evaluate((data) => {
      return window.updateData(data);
    }, modification2);
    
    // Reconnect both instances
    await reconnectP2PInstance(page1);
    await reconnectP2PInstance(page2);
    
    // Wait for conflict resolution
    await page1.waitForTimeout(5000);
    
    // Get final data from both instances
    const finalData1 = await page1.evaluate((id) => {
      return window.getData(id);
    }, testId);
    
    const finalData2 = await page2.evaluate((id) => {
      return window.getData(id);
    }, testId);
    
    // Verify both instances have the same data after conflict resolution
    expect(finalData1).toEqual(finalData2);
    
    // Verify the merged data contains changes from both instances
    // This assumes a custom merge strategy that merges arrays
    expect(finalData1.title).toBe('Modified Title'); // Title from instance 1
    expect(finalData1.tags).toContain('tag3'); // New tag from instance 1
    expect(finalData1.items).toContain('item3'); // New item from instance 2
    
    // Clean up
    await page1.close();
    await page2.close();
    await context1.close();
    await context2.close();
  });
});