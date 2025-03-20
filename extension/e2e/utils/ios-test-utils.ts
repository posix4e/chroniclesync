import { test as base, Page } from '@playwright/test';
import { server } from '../test-config';

// Interface for iOS native functionality
export interface iOSNative {
  getDeviceInfo(): Promise<any>;
  saveToNative(key: string, value: any): Promise<any>;
  loadFromNative(key: string): Promise<any>;
  openSettings(): Promise<any>;
  openWebsite(): Promise<any>;
}

// Mock implementation of iOS native functionality
export class MockiOSNative implements iOSNative {
  private storage: Map<string, any> = new Map();
  private deviceInfo = {
    platform: 'iOS',
    model: 'iPhone14,3',
    osVersion: '16.5',
    deviceId: '12345678-1234-1234-1234-123456789012',
    appVersion: '1.0.0'
  };

  async getDeviceInfo() {
    return this.deviceInfo;
  }

  async saveToNative(key: string, value: any) {
    this.storage.set(key, value);
    return { success: true, message: 'Data saved successfully' };
  }

  async loadFromNative(key: string) {
    const value = this.storage.get(key);
    if (value) {
      return { success: true, data: { key, value } };
    } else {
      return { success: false, message: `No data found for key: ${key}` };
    }
  }

  async openSettings() {
    return { success: true, message: 'Settings opened' };
  }

  async openWebsite() {
    return { success: true, message: 'Website opened' };
  }
}

// Helper function to load the mock iOS app page
export async function loadMockiOSApp(page: Page) {
  await page.goto(`${server.mockIosAppUrl}/mock-ios-app.html`);
  return page;
}

// Helper function to send a message to the mock native layer
export async function sendNativeMessage(page: Page, message: any) {
  return page.evaluate((msg) => {
    // @ts-ignore - This is defined in the mock iOS app page
    return window.webkit.messageHandlers.controller.postMessage(msg);
  }, message);
}

// Test fixtures for iOS testing
export type iOSTestFixtures = {
  iosNative: iOSNative;
  loadMockApp: (page: Page) => Promise<Page>;
  sendNativeMessage: (page: Page, message: any) => Promise<any>;
};

// Extend the base test with iOS-specific fixtures
export const test = base.extend<iOSTestFixtures>({
  iosNative: async ({}, use) => {
    const mockNative = new MockiOSNative();
    await use(mockNative);
  },
  
  loadMockApp: async ({}, use) => {
    await use(loadMockiOSApp);
  },
  
  sendNativeMessage: async ({}, use) => {
    await use(sendNativeMessage);
  }
});

export const expect = test.expect;