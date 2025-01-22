import { test, expect } from './utils/extension';
import * as fs from 'fs';
import * as path from 'path';

// Ensure screenshots directory exists
const screenshotsDir = path.join(process.cwd(), 'test-results');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.describe('History UI', () => {
  test('should display history entries with proper formatting', async ({ page, context }) => {
    const popupPage = await context.newPage();
    await popupPage.goto(`file://${process.cwd()}/../extension/popup.html`);

    // Wait for React to mount and render content
    await popupPage.waitForLoadState('networkidle');
    await popupPage.waitForSelector('h1', { state: 'visible' });
    await popupPage.waitForSelector('#clientSection', { state: 'visible' });
    
    // Initialize client to see history
    await popupPage.fill('#clientId', 'test-client-1');
    await popupPage.click('button:text("Initialize")');
    await popupPage.waitForSelector('#dataSection', { state: 'visible' });

    // Add test data through the UI
    await popupPage.fill('#dataInput', JSON.stringify({ text: 'Hello World' }));
    await popupPage.click('button:text("Save Data")');
    await popupPage.waitForTimeout(100);

    await popupPage.fill('#dataInput', JSON.stringify({ number: 42 }));
    await popupPage.click('button:text("Save Data")');
    await popupPage.waitForTimeout(100);

    await popupPage.fill('#dataInput', JSON.stringify({ boolean: true }));
    await popupPage.click('button:text("Save Data")');
    await popupPage.waitForTimeout(100);

    await popupPage.fill('#dataInput', JSON.stringify({ array: [1, 2, 3] }));
    await popupPage.click('button:text("Save Data")');
    await popupPage.waitForTimeout(100);
    await popupPage.waitForSelector('[data-testid="history-entry"]');

    // Take a screenshot of the initial history view
    await popupPage.screenshot({ path: 'test-results/history-initial.png' });

    // Verify history entries are displayed
    const historyEntries = await popupPage.locator('[data-testid="history-entry"]').count();
    expect(historyEntries).toBe(4);

    // Verify timestamps are formatted correctly
    const timestamps = await popupPage.locator('[data-testid="history-timestamp"]').allTextContents();
    for (const timestamp of timestamps) {
      expect(timestamp).toMatch(/\d{1,2}:\d{2}:\d{2}/); // HH:MM:SS format
    }

    // Verify data is displayed properly
    const dataElements = await popupPage.locator('[data-testid="history-data"]').allTextContents();
    const parsedData = dataElements.map(text => JSON.parse(text));
    expect(parsedData[0]).toEqual({ text: 'Hello World' });
    expect(parsedData[1]).toEqual({ number: 42 });
    expect(parsedData[2]).toEqual({ boolean: true });
    expect(parsedData[3]).toEqual({ array: [1, 2, 3] });

    // Add a new entry and verify UI updates
    await popupPage.fill('#dataInput', JSON.stringify({ newEntry: 'Testing UI update' }));
    await popupPage.click('button:text("Save Data")');
    await popupPage.waitForTimeout(100);

    // Wait for new entry to appear
    await popupPage.waitForFunction(() => {
      return document.querySelectorAll('[data-testid="history-entry"]').length === 5;
    });

    // Take a screenshot after adding new entry
    await popupPage.screenshot({ path: 'test-results/history-updated.png' });

    // Verify new entry is displayed
    const updatedHistoryEntries = await popupPage.locator('[data-testid="history-entry"]').count();
    expect(updatedHistoryEntries).toBe(5);

    // Get all history entries
    const allEntries = await popupPage.locator('[data-testid="history-data"]').allTextContents();
    const parsedEntries = allEntries.map(text => JSON.parse(text));
    
    // Verify the new entry is in the list
    expect(parsedEntries).toContainEqual({ newEntry: 'Testing UI update' });
  });

  test('should handle long history entries and scrolling', async ({ page, context }) => {
    const popupPage = await context.newPage();
    await popupPage.goto(`file://${process.cwd()}/../extension/popup.html`);
    await popupPage.waitForLoadState('networkidle');
    await popupPage.waitForTimeout(1000);

    // Initialize client to see history
    await popupPage.fill('#clientId', 'test-client-1');
    await popupPage.click('button:text("Initialize")');
    await popupPage.waitForSelector('#dataSection', { state: 'visible' });

    // Add many history entries through the UI
    for (let i = 0; i < 20; i++) {
      await popupPage.fill('#dataInput', JSON.stringify({ index: i, data: `Entry ${i}` }));
      await popupPage.click('button:text("Save Data")');
      await popupPage.waitForTimeout(50);
    }

    // Take a screenshot of scrollable history
    await popupPage.screenshot({ path: 'test-results/history-scrollable.png' });

    // Verify scroll functionality
    const historyContainer = await popupPage.locator('[data-testid="history-container"]');
    const scrollHeight = await historyContainer.evaluate(el => el.scrollHeight);
    const clientHeight = await historyContainer.evaluate(el => el.clientHeight);
    
    expect(scrollHeight).toBeGreaterThan(clientHeight);

    // Scroll to bottom
    await historyContainer.evaluate(el => el.scrollTo(0, el.scrollHeight));
    await popupPage.screenshot({ path: 'test-results/history-scrolled.png' });

    // Verify oldest entries are visible
    const lastEntry = await popupPage.locator('[data-testid="history-entry"]').last();
    const isVisible = await lastEntry.isVisible();
    expect(isVisible).toBeTruthy();
  });
});