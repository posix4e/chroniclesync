import { Page } from '@playwright/test';

export class PageActions {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `./test-results/${name}.png`,
      fullPage: true
    });
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  async getElementText(selector: string): Promise<string | null> {
    const element = await this.page.locator(selector).first();
    return element.textContent();
  }

  async clickButton(name: string): Promise<void> {
    await this.page.getByRole('button', { name }).click();
  }

  async waitForText(text: string): Promise<void> {
    await this.page.getByText(text).waitFor({ state: 'visible' });
  }
}