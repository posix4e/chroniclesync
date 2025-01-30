import { BrowserContext, Page } from '@playwright/test';

export class ExtensionPage {
  private constructor(private page: Page) {}

  static async create(context: BrowserContext): Promise<ExtensionPage> {
    const page = await context.newPage();
    return new ExtensionPage(page);
  }

  async simulateFirstInstall(): Promise<void> {
    // Simulate extension installation by triggering the onInstalled event
    await this.page.evaluate(() => {
      // Simulate onInstalled event
      const event = new CustomEvent('chrome.runtime.onInstalled', {
        detail: { reason: 'install' }
      });
      window.dispatchEvent(event);
    });
  }

  async openSettings(): Promise<void> {
    // Click the settings button in the popup
    await this.page.click('.settings-button');
    
    // Wait for settings page to load
    await this.page.waitForSelector('#settings-container');
  }

  async getStoredSettings(): Promise<any> {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.get(null, (result) => {
          resolve(result);
        });
      });
    });
  }
}

export default ExtensionPage;