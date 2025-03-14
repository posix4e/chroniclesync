import { BrowserContext, Page } from '@playwright/test';

/**
 * Helper class for Xcode iOS simulator testing
 * Provides utilities for interacting with iOS-specific features
 */
export class XcodeSimulator {
  private context: BrowserContext;
  private page: Page;

  constructor(context: BrowserContext, page: Page) {
    this.context = context;
    this.page = page;
  }

  /**
   * Get iOS device information
   * @returns Object containing device information
   */
  async getDeviceInfo(): Promise<{
    userAgent: string;
    devicePixelRatio: number;
    viewport: { width: number; height: number };
    touchSupported: boolean;
  }> {
    return this.page.evaluate(() => {
      return {
        userAgent: navigator.userAgent,
        devicePixelRatio: window.devicePixelRatio,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        touchSupported: 'ontouchstart' in window
      };
    });
  }

  /**
   * Check if specific iOS Safari features are supported
   * @returns Object containing feature support information
   */
  async checkFeatureSupport(): Promise<{
    webkitBackdropFilter: boolean;
    webkitAppearance: boolean;
    touchEvents: boolean;
    webkitOverflowScrolling: boolean;
  }> {
    return this.page.evaluate(() => {
      // Check CSS feature support
      const cssSupports = (property: string, value: string): boolean => {
        try {
          return CSS.supports(property, value);
        } catch {
          return false;
        }
      };

      return {
        webkitBackdropFilter: cssSupports('-webkit-backdrop-filter', 'blur(10px)'),
        webkitAppearance: cssSupports('-webkit-appearance', 'none'),
        touchEvents: 'ontouchstart' in window,
        webkitOverflowScrolling: cssSupports('-webkit-overflow-scrolling', 'touch')
      };
    });
  }

  /**
   * Simulate a touch event on an element
   * @param selector CSS selector for the element to touch
   */
  async simulateTouch(selector: string): Promise<void> {
    await this.page.tap(selector);
  }

  /**
   * Check if the current environment is running in an iOS simulator
   * @returns True if running in an iOS simulator
   */
  async isIOSSimulator(): Promise<boolean> {
    const userAgent = await this.page.evaluate(() => navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(userAgent);
    const isSafari = /Safari/.test(userAgent);
    
    return isIOS && isSafari;
  }

  /**
   * Get Safari version information
   * @returns Safari version string or null if not Safari
   */
  async getSafariVersion(): Promise<string | null> {
    return this.page.evaluate(() => {
      const userAgent = navigator.userAgent;
      const match = userAgent.match(/Version\/(\d+\.\d+).*Safari/);
      return match ? match[1] : null;
    });
  }
}