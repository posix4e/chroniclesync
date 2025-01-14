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
    
    // Wait for the network request to complete and status to update
    await this.page.waitForResponse(response => 
      response.url().includes('/health') && response.status() === 200
    );
    
    // Wait for the "Checking..." status to disappear
    await this.page.waitForFunction(() => {
      const statusText = document.querySelector('.health-status')?.textContent;
      return statusText && !statusText.includes('Checking...');
    });
  }

  async getLastCheckTime(): Promise<string | null> {
    // Wait for any ongoing health check to complete
    await this.page.waitForFunction(() => {
      const statusText = document.querySelector('.health-status')?.textContent;
      return statusText && !statusText.includes('Checking...');
    });
    
    // Get the last check time element
    const element = await this.page.locator('[data-testid="last-check-time"]').first();
    if (!element) {
      const fallbackElement = await this.page.locator('text=Last Check:').locator('..').last();
      return await fallbackElement.textContent();
    }
    return await element.textContent();
  }

  async takePageScreenshot(name: string) {
    await this.actions.takeScreenshot(name);
  }
}