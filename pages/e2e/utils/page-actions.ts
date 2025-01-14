import { Page } from '@playwright/test';

export class PageActions {
  constructor(private page: Page) {}

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `./test-results/${name}.png`,
      fullPage: true
    });
  }

  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  async getElementText(selector: string): Promise<string | null> {
    const element = await this.page.locator(selector).first();
    return await element.textContent();
  }

  async clickButton(name: string) {
    await this.page.getByRole('button', { name }).click();
  }

  async waitForText(text: string) {
    await this.page.getByText(text).waitFor({ state: 'visible' });
  }
}