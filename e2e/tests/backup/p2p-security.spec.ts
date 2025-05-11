import { test, expect } from '@playwright/test';
import { 
  createP2PInstancePage, 
  waitForP2PConnection,
  generateTestId
} from '../utils/p2p-helpers';

test.describe('P2P Security', () => {
  test('should encrypt data during synchronization', async ({ browser }) => {
    // Create two separate contexts for the two instances
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    // Create pages for both instances
    const page1 = await createP2PInstancePage(context1, 12000);
    const page2 = await createP2PInstancePage(context2, 12001);
    
    // Wait for both instances to establish p2p connections
    await waitForP2PConnection(page1);
    await waitForP2PConnection(page2);
    
    // Generate sensitive test data
    const testId = generateTestId();
    const sensitiveData = {
      id: testId,
      title: 'Sensitive Data',
      content: 'This is sensitive information that should be encrypted',
      secretKey: 'secret-key-12345',
      timestamp: Date.now()
    };
    
    // Enable network traffic monitoring
    let encryptedDataFound = false;
    let rawDataFound = false;
    
    // Monitor network traffic on page1
    await page1.route('**/*', async (route, request) => {
      const url = request.url();
      
      // Only check WebSocket traffic (p2p communication)
      if (url.includes('ws://') || url.includes('wss://')) {
        const postData = request.postData();
        
        if (postData) {
          // Check if raw sensitive data is visible in the traffic
          if (postData.includes('secret-key-12345')) {
            rawDataFound = true;
          }
          
          // Check for encrypted data patterns (base64 encoded data)
          if (postData.match(/[A-Za-z0-9+/=]{20,}/)) {
            encryptedDataFound = true;
          }
        }
      }
      
      await route.continue();
    });
    
    // Add sensitive data to instance 1
    await page1.evaluate((data) => {
      return window.addData(data);
    }, sensitiveData);
    
    // Wait for data to sync to instance 2
    await page2.waitForFunction(
      (id) => window.checkDataExists(id),
      testId,
      { timeout: 30000 }
    );
    
    // Verify data was properly synced
    const syncedData = await page2.evaluate((id) => {
      return window.getData(id);
    }, testId);
    
    expect(syncedData.id).toBe(testId);
    expect(syncedData.secretKey).toBe('secret-key-12345');
    
    // Verify encryption was used
    expect(rawDataFound).toBeFalsy();
    expect(encryptedDataFound).toBeTruthy();
    
    // Clean up
    await page1.close();
    await page2.close();
    await context1.close();
    await context2.close();
  });
  
  test('should authenticate peers before synchronization', async ({ browser }) => {
    // Create two separate contexts for the two instances
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    // Create pages for both instances
    const page1 = await createP2PInstancePage(context1, 12000);
    const page2 = await createP2PInstancePage(context2, 12001);
    
    // Wait for both instances to establish p2p connections
    await waitForP2PConnection(page1);
    await waitForP2PConnection(page2);
    
    // Check authentication status
    const isAuthenticated = await page1.evaluate(() => {
      // This assumes there's a window.isPeerAuthenticated function exposed by the application
      return window.isPeerAuthenticated();
    });
    
    expect(isAuthenticated).toBeTruthy();
    
    // Attempt to connect with invalid credentials
    const invalidAuthResult = await page1.evaluate(() => {
      // This assumes there's a window.connectWithInvalidCredentials function exposed by the application
      return window.connectWithInvalidCredentials();
    });
    
    expect(invalidAuthResult.success).toBeFalsy();
    expect(invalidAuthResult.error).toContain('authentication');
    
    // Clean up
    await page1.close();
    await page2.close();
    await context1.close();
    await context2.close();
  });
  
  test('should validate data integrity during synchronization', async ({ browser }) => {
    // Create two separate contexts for the two instances
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    // Create pages for both instances
    const page1 = await createP2PInstancePage(context1, 12000);
    const page2 = await createP2PInstancePage(context2, 12001);
    
    // Wait for both instances to establish p2p connections
    await waitForP2PConnection(page1);
    await waitForP2PConnection(page2);
    
    // Generate test data with integrity hash
    const testId = generateTestId();
    const testData = {
      id: testId,
      title: 'Integrity Test',
      content: 'This data should maintain integrity during sync',
      timestamp: Date.now()
    };
    
    // Add data with integrity verification to instance 1
    await page1.evaluate((data) => {
      return window.addDataWithIntegrity(data);
    }, testData);
    
    // Wait for data to sync to instance 2
    await page2.waitForFunction(
      (id) => window.checkDataExists(id),
      testId,
      { timeout: 30000 }
    );
    
    // Verify data integrity was maintained
    const integrityResult = await page2.evaluate((id) => {
      // This assumes there's a window.verifyDataIntegrity function exposed by the application
      return window.verifyDataIntegrity(id);
    }, testId);
    
    expect(integrityResult.valid).toBeTruthy();
    expect(integrityResult.hash).toBeTruthy();
    
    // Attempt to tamper with data during sync
    const tamperResult = await page1.evaluate(() => {
      // This assumes there's a window.simulateDataTampering function exposed by the application
      return window.simulateDataTampering();
    });
    
    expect(tamperResult.detected).toBeTruthy();
    
    // Clean up
    await page1.close();
    await page2.close();
    await context1.close();
    await context2.close();
  });
});