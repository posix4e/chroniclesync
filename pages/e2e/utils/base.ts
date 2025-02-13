import { Page } from '@playwright/test';

export class BasePage {
  constructor(private page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  async route(url: string, handler: (route: any) => Promise<void>) {
    await this.page.route(url, handler);
  }

  locator(selector: string) {
    return this.page.locator(selector);
  }

  async screenshot(options: { path: string }) {
    await this.page.screenshot({
      ...options,
      fullPage: true
    });
  }
}