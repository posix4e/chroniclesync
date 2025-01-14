import { Page } from '@playwright/test';
import { PageActions } from '../utils/page-actions';

export class HomePage {
  private actions: PageActions;

  constructor(private page: Page) {
    this.actions = new PageActions(page);
  }

  async navigate() {
    await this.page.goto('/', { timeout: 30000 });
    await this.actions.waitForPageLoad();
  }

  async verifyTitle() {
    return await this.actions.getPageTitle();
  }

  async checkHealthStatus() {
    await this.actions.clickButton('Check Health');
    await this.actions.waitForText('Status:');
  }

  async getLastCheckTime(): Promise<string | null> {
    const element = await this.page.locator('text=Last Check:').locator('..').last();
    return await element.textContent();
  }

  async takePageScreenshot(name: string) {
    await this.actions.takeScreenshot(name);
  }
}