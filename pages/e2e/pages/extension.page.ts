import { Page, BrowserContext, expect, Page as PlaywrightPage } from '@playwright/test';
import type { History } from 'chrome';

// Use Chrome's own type definitions
type HistoryItem = History.HistoryItem;

export class ExtensionPage {
  private readonly page: Page;
  private readonly context: BrowserContext;

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
  }

  async getBackgroundPage(): Promise<PlaywrightPage> {
    const backgroundPages = await this.context.backgroundPages();
    const backgroundPage = backgroundPages[0];
    expect(backgroundPage).toBeTruthy();
    return backgroundPage;
  }

  async verifyExtensionId(): Promise<string> {
    const backgroundPage = await this.getBackgroundPage();
    const extensionId = await backgroundPage.evaluate(() => chrome.runtime.id);
    expect(extensionId).toBeTruthy();
    return extensionId;
  }

  async verifyHistorySync(url: string): Promise<HistoryItem[]> {
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

  async verifyIndexedDB(): Promise<boolean> {
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

  async deleteHistoryItem(url: string): Promise<void> {
    const backgroundPage = await this.getBackgroundPage();
    await backgroundPage.evaluate((testUrl: string) => {
      return new Promise<void>((resolve) => {
        chrome.history.deleteUrl({ url: testUrl }, () => resolve());
      });
    }, url);
  }

  async mockAPIError(): Promise<void> {
    await this.context.route('**/api*.chroniclesync.xyz/**', route =>
      route.fulfill({ status: 500, body: 'Server error' })
    );
  }

  async mockNetworkDelay(delay: number): Promise<void> {
    await this.context.route('**/*', route => 
      new Promise(resolve => setTimeout(() => resolve(route.continue()), delay))
    );
  }

  async mockOffline(): Promise<void> {
    await this.context.setOffline(true);
  }

  async mockOnline(): Promise<void> {
    await this.context.setOffline(false);
  }

  async injectScript(script: string): Promise<void> {
    await this.page.evaluate((code: string) => {
      const scriptEl = document.createElement('script');
      scriptEl.textContent = code;
      document.head.appendChild(scriptEl);
    }, script);
  }

  async getCspViolations(): Promise<SecurityPolicyViolationEvent[]> {
    return this.page.evaluate(() => {
      return new Promise<SecurityPolicyViolationEvent[]>((resolve) => {
        const violations: SecurityPolicyViolationEvent[] = [];
        document.addEventListener('securitypolicyviolation', (e) => {
          violations.push(e);
        });
        // Trigger a CSP violation
        const script = document.createElement('script');
        script.src = 'https://example.com/unsafe.js';
        document.head.appendChild(script);
        setTimeout(() => resolve(violations), 1000);
      });
    });
  }

  async mockInvalidCertificate(): Promise<void> {
    await this.context.route('**/*', route => {
      if (route.request().url().startsWith('https://')) {
        return route.abort('failed');
      }
      return route.continue();
    });
  }

  async navigateWithError(url: string): Promise<string> {
    try {
      await this.page.goto(url);
      return '';
    } catch (error) {
      return error.message;
    }
  }

  async mockCrossOriginRequest(): Promise<void> {
    await this.context.route('**/*', route => {
      const origin = new URL(route.request().url()).origin;
      if (origin !== process.env.BASE_URL) {
        return route.fulfill({
          status: 403,
          headers: {
            'Access-Control-Allow-Origin': process.env.BASE_URL || '*'
          },
          body: 'CORS error'
        });
      }
      return route.continue();
    });
  }

  async getCorsViolations(): Promise<Error[]> {
    return this.page.evaluate(() => {
      return new Promise<Error[]>((resolve) => {
        const errors: Error[] = [];
        const originalError = console.error;
        console.error = (...args) => {
          if (args[0]?.includes?.('CORS')) {
            errors.push(new Error(args[0]));
          }
          originalError.apply(console, args);
        };
        // Trigger a CORS error
        fetch('https://example.com/api').catch(() => {});
        setTimeout(() => {
          console.error = originalError;
          resolve(errors);
        }, 1000);
      });
    });
  }
}