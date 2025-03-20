import { test, expect, MockiOSNative } from './utils/ios-test-utils';
import { server } from './test-config';

// Mock Safari Web Extension context
class MockExtensionContext {
  inputItems: any[];
  private responseItems: any[] = [];

  constructor(message: any = null) {
    this.inputItems = [{
      userInfo: {
        message: message
      }
    }];
  }

  completeRequest(items: any[], callback: (() => void) | null = null) {
    this.responseItems = items;
    if (callback) callback();
  }

  getResponse() {
    return this.responseItems.length > 0 ? this.responseItems[0] : null;
  }
}

// Mock Safari Web Extension Handler
class MockSafariWebExtensionHandler {
  private iosNative: MockiOSNative;

  constructor() {
    this.iosNative = new MockiOSNative();
  }

  async beginRequest(context: MockExtensionContext) {
    const request = context.inputItems[0];
    const message = request?.userInfo?.message;

    if (!message) {
      this.sendResponse(false, 'No message provided', null, context);
      return;
    }

    if (typeof message === 'object' && message.type) {
      switch (message.type) {
        case 'getDeviceInfo':
          const deviceInfo = await this.iosNative.getDeviceInfo();
          this.sendResponse(true, null, deviceInfo, context);
          break;

        case 'saveToNative':
          if (message.data && message.data.key && message.data.value !== undefined) {
            const result = await this.iosNative.saveToNative(message.data.key, message.data.value);
            this.sendResponse(result.success, result.message, null, context);
          } else {
            this.sendResponse(false, 'Missing key or value', null, context);
          }
          break;

        case 'loadFromNative':
          if (message.key) {
            const result = await this.iosNative.loadFromNative(message.key);
            this.sendResponse(result.success, result.message, result.data, context);
          } else {
            this.sendResponse(false, 'Missing key', null, context);
          }
          break;

        default:
          this.sendResponse(false, `Unknown message type: ${message.type}`, null, context);
      }
    } else {
      this.sendResponse(false, 'Invalid message format', null, context);
    }
  }

  private sendResponse(success: boolean, message: string | null, data: any, context: MockExtensionContext) {
    const responseDict: any = { success };
    
    if (message) {
      responseDict.message = message;
    }
    
    if (data) {
      responseDict.data = data;
    }
    
    const response = { userInfo: { message: responseDict } };
    context.completeRequest([response]);
  }
}

test.describe('Safari Web Extension Integration', () => {
  let extensionHandler: MockSafariWebExtensionHandler;

  test.beforeEach(() => {
    extensionHandler = new MockSafariWebExtensionHandler();
  });

  test('should handle getDeviceInfo message', async () => {
    // Create context with getDeviceInfo message
    const context = new MockExtensionContext({ type: 'getDeviceInfo' });
    
    // Process the request
    await extensionHandler.beginRequest(context);
    
    // Get the response
    const response = context.getResponse();
    
    // Verify the response
    expect(response).toBeTruthy();
    expect(response.userInfo.message.success).toBeTruthy();
    expect(response.userInfo.message.data).toHaveProperty('platform', 'iOS');
    expect(response.userInfo.message.data).toHaveProperty('deviceId');
    expect(response.userInfo.message.data).toHaveProperty('model');
    expect(response.userInfo.message.data).toHaveProperty('osVersion');
    expect(response.userInfo.message.data).toHaveProperty('appVersion');
  });

  test('should handle saveToNative message', async () => {
    // Test data
    const testKey = 'testKey';
    const testValue = { name: 'Test User', settings: { theme: 'dark' } };
    
    // Create context with saveToNative message
    const context = new MockExtensionContext({
      type: 'saveToNative',
      data: {
        key: testKey,
        value: testValue
      }
    });
    
    // Process the request
    await extensionHandler.beginRequest(context);
    
    // Get the response
    const response = context.getResponse();
    
    // Verify the response
    expect(response).toBeTruthy();
    expect(response.userInfo.message.success).toBeTruthy();
    expect(response.userInfo.message.message).toBe('Data saved successfully');
    
    // Now try to load the data to verify it was saved
    const loadContext = new MockExtensionContext({
      type: 'loadFromNative',
      key: testKey
    });
    
    // Process the load request
    await extensionHandler.beginRequest(loadContext);
    
    // Get the load response
    const loadResponse = loadContext.getResponse();
    
    // Verify the load response
    expect(loadResponse).toBeTruthy();
    expect(loadResponse.userInfo.message.success).toBeTruthy();
    expect(loadResponse.userInfo.message.data).toHaveProperty('key', testKey);
    expect(loadResponse.userInfo.message.data).toHaveProperty('value');
    expect(loadResponse.userInfo.message.data.value).toEqual(testValue);
  });

  test('should handle loadFromNative message for non-existent key', async () => {
    // Create context with loadFromNative message for non-existent key
    const context = new MockExtensionContext({
      type: 'loadFromNative',
      key: 'nonExistentKey'
    });
    
    // Process the request
    await extensionHandler.beginRequest(context);
    
    // Get the response
    const response = context.getResponse();
    
    // Verify the response
    expect(response).toBeTruthy();
    expect(response.userInfo.message.success).toBeFalsy();
    expect(response.userInfo.message.message).toContain('No data found for key');
  });

  test('should handle invalid message format', async () => {
    // Create context with invalid message
    const context = new MockExtensionContext('not an object');
    
    // Process the request
    await extensionHandler.beginRequest(context);
    
    // Get the response
    const response = context.getResponse();
    
    // Verify the response
    expect(response).toBeTruthy();
    expect(response.userInfo.message.success).toBeFalsy();
    expect(response.userInfo.message.message).toBe('Invalid message format');
  });

  test('should handle missing message', async () => {
    // Create context with no message
    const context = new MockExtensionContext(null);
    
    // Process the request
    await extensionHandler.beginRequest(context);
    
    // Get the response
    const response = context.getResponse();
    
    // Verify the response
    expect(response).toBeTruthy();
    expect(response.userInfo.message.success).toBeFalsy();
    expect(response.userInfo.message.message).toBe('No message provided');
  });

  test('should handle unknown message type', async () => {
    // Create context with unknown message type
    const context = new MockExtensionContext({
      type: 'unknownType'
    });
    
    // Process the request
    await extensionHandler.beginRequest(context);
    
    // Get the response
    const response = context.getResponse();
    
    // Verify the response
    expect(response).toBeTruthy();
    expect(response.userInfo.message.success).toBeFalsy();
    expect(response.userInfo.message.message).toContain('Unknown message type');
  });
});

// Integration tests with a mock browser environment
test.describe('Browser-iOS Integration', () => {
  test('should communicate between browser and iOS native code', async ({ page, loadMockApp }) => {
    // Load the mock iOS app page
    await loadMockApp(page);
    
    // Test saving data through the UI
    await page.locator('#saveData').click();
    
    // Verify the save operation was successful
    await expect(page.locator('#result')).toBeVisible();
    await expect(page.locator('#resultContent')).toContainText('Data saved with key');
    
    // Test loading data through the UI
    await page.locator('#loadData').click();
    
    // Verify the load operation was successful
    await expect(page.locator('#resultContent')).toContainText('Data loaded');
    
    // Test getting device info
    await page.evaluate(() => {
      // @ts-ignore - This is defined in the mock iOS app page
      window.webkit.messageHandlers.controller.postMessage({ type: 'getDeviceInfo' });
    });
    
    // Verify device info was retrieved
    await expect(page.locator('#resultContent')).toContainText('Device info retrieved');
  });
});