import { Page, BrowserContext, expect } from '@playwright/test';
import type { History } from 'chrome';

// Use Chrome's own type definitions
type HistoryItem = History.HistoryItem;

export class ExtensionPage {
  constructor(private page: Page, private context: BrowserContext) {}

  async getBackgroundPage() {
    const backgroundPages = await this.context.backgroundPages();
    const backgroundPage = backgroundPages[0];
    expect(backgroundPage).toBeTruthy();
    return backgroundPage;
  }

  async verifyExtensionId() {
    const backgroundPage = await this.getBackgroundPage();
    const extensionId = await backgroundPage.evaluate(() => chrome.runtime.id);
    expect(extensionId).toBeTruthy();
    return extensionId;
  }

  async verifyHistorySync(url: string) {
    const backgroundPage = await this.getBackgroundPage();
    const history = await backgroundPage.evaluate(() => {
      return new Promise<HistoryItem[]>((resolve) => {
        chrome.history.search({
          text: '',
          startTime: 0,
          maxResults: 10
        }, (results) => resolve(results));
      });
    });

    expect(history).toBeTruthy();
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);

    const testPageHistory = history.find((h: HistoryItem) => h.url?.includes(url));
    expect(testPageHistory).toBeTruthy();
    return history;
  }

  async verifyIndexedDB() {
    const dbResult = await this.page.evaluate(async () => {
      return new Promise<boolean>((resolve, reject) => {
        const request = window.indexedDB.open('chroniclesync', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(true);
      });
    });
    expect(dbResult).toBe(true);
    return dbResult;
  }

  async mockAPIError() {
    await this.context.route('**/api*.chroniclesync.xyz/**', route =>
      route.fulfill({ status: 500, body: 'Server error' })
    );
  }
}