import { BrowserContext, Page } from '@playwright/test';

/**
 * Helper functions for iOS Safari extension testing
 */
export class IOSSafariHelper {
  private context: BrowserContext;
  private page: Page;

  constructor(context: BrowserContext, page: Page) {
    this.context = context;
    this.page = page;
  }

  /**
   * Creates an iOS Safari context with appropriate device settings
   */
  static async createIOSContext(context: BrowserContext): Promise<Page> {
    // Create a page with iOS-specific settings
    const page = await context.newPage();
    
    // Set user agent to iOS Safari
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    });
    
    return page;
  }

  /**
   * Simulates iOS Safari extension interaction
   * Note: This is a simplified version as actual extension interaction
   * would require the Safari Web Extension API
   */
  async simulateExtensionInteraction(): Promise<void> {
    // In a real implementation, this would interact with the Safari extension
    // For now, we're just simulating the interaction
    await this.page.evaluate(() => {
      console.log('Simulating iOS Safari extension interaction');
      // Create a marker to indicate the extension was "loaded"
      const marker = document.createElement('div');
      marker.id = 'chroniclesync-extension-loaded';
      marker.style.display = 'none';
      document.body.appendChild(marker);
    });
  }

  /**
   * Checks if the extension appears to be loaded
   */
  async isExtensionLoaded(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return !!document.getElementById('chroniclesync-extension-loaded');
    });
  }
}