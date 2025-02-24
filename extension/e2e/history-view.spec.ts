import { test, expect } from '@playwright/test';
import { ExtensionTestHelper } from './utils/extension';

let helper: ExtensionTestHelper;

test.beforeAll(async () => {
  helper = await ExtensionTestHelper.create();
});

test.afterAll(async () => {
  await helper.cleanup();
});

test.describe('History View', () => {
  test('opens history popout from extension popup', async () => {
    const popup = await helper.openPopup();
    await popup.click('text=View History');
    
    const historyWindow = await helper.waitForPopup('history.html');
    expect(historyWindow).toBeTruthy();
    
    const title = await historyWindow.locator('h2:text("Browsing History")').isVisible();
    expect(title).toBeTruthy();
  });

  test('displays history entries with pagination', async () => {
    // Add some test history entries
    await helper.addTestHistoryEntries([
      { url: 'https://example1.com', title: 'Example 1', timestamp: Date.now() - 1000 },
      { url: 'https://example2.com', title: 'Example 2', timestamp: Date.now() - 2000 },
      { url: 'https://example3.com', title: 'Example 3', timestamp: Date.now() - 3000 },
    ]);

    const historyWindow = await helper.openHistoryPopout();
    
    // Check if entries are displayed
    const entries = await historyWindow.locator('.history-item').count();
    expect(entries).toBeGreaterThan(0);

    // Test pagination
    const nextButton = historyWindow.locator('button:text("Next")');
    const prevButton = historyWindow.locator('button:text("Previous")');
    
    const isNextEnabled = await nextButton.isEnabled();
    const isPrevEnabled = await prevButton.isEnabled();
    
    expect(isPrevEnabled).toBeFalsy(); // First page
    if (entries > 10) {
      expect(isNextEnabled).toBeTruthy();
    }
  });

  test('filters history entries', async () => {
    // Add test entries with specific titles
    await helper.addTestHistoryEntries([
      { url: 'https://test1.com', title: 'Unique Test Entry 1', timestamp: Date.now() },
      { url: 'https://test2.com', title: 'Different Entry', timestamp: Date.now() },
      { url: 'https://test3.com', title: 'Unique Test Entry 2', timestamp: Date.now() },
    ]);

    const historyWindow = await helper.openHistoryPopout();
    
    // Search for "Unique Test"
    await historyWindow.fill('input[type="text"]', 'Unique Test');
    
    // Wait for the filtered results
    await historyWindow.waitForTimeout(500);
    
    // Check if only matching entries are shown
    const entries = await historyWindow.locator('.history-item').count();
    expect(entries).toBe(2);
    
    // Verify the content
    const titles = await historyWindow.locator('.history-item').allTextContents();
    expect(titles.every(title => title.includes('Unique Test'))).toBeTruthy();
  });
});