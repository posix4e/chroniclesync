import { test, expect } from '@playwright/test';
import { ExtensionTestHelper } from './utils/extension';

let helper: ExtensionTestHelper;

test.beforeAll(async () => {
  helper = await ExtensionTestHelper.create();
});

test.afterAll(async () => {
  await helper.close();
});

test('history view shows history entries and supports filtering', async () => {
  // Add some test history entries
  await helper.addHistoryEntry({
    url: 'https://example.com/page1',
    title: 'Example Page 1',
    timestamp: Date.now() - 1000
  });
  await helper.addHistoryEntry({
    url: 'https://example.com/page2',
    title: 'Example Page 2',
    timestamp: Date.now()
  });

  // Open the history window
  const historyWindow = await helper.waitForPopup('history.html');
  
  // Check that both history entries are displayed
  await expect(historyWindow.locator('.history-item')).toHaveCount(2);
  await expect(historyWindow.locator('.history-item:first-child .history-item-title')).toContainText('Example Page 1');
  await expect(historyWindow.locator('.history-item:first-child .history-item-url')).toContainText('https://example.com/page1');
  await expect(historyWindow.locator('.history-item:last-child .history-item-title')).toContainText('Example Page 2');
  await expect(historyWindow.locator('.history-item:last-child .history-item-url')).toContainText('https://example.com/page2');

  // Test search functionality
  await historyWindow.fill('.history-search', 'Page 1');
  await expect(historyWindow.locator('.history-item')).toHaveCount(1);
  await expect(historyWindow.locator('.history-item')).toContainText('Example Page 1');
  await expect(historyWindow.locator('.history-item')).toContainText('https://example.com/page1');
  await expect(historyWindow.locator('.history-item')).not.toContainText('Example Page 2');
  await expect(historyWindow.locator('.history-item')).not.toContainText('https://example.com/page2');

  // Clear search and verify all items are shown again
  await historyWindow.fill('.history-search', '');
  await expect(historyWindow.locator('.history-item')).toHaveCount(2);
});

test('history view supports pagination', async () => {
  // Add 15 test history entries (more than one page)
  for (let i = 1; i <= 15; i++) {
    await helper.addHistoryEntry({
      url: `https://example.com/page${i}`,
      title: `Example Page ${i}`,
      timestamp: Date.now() - (i * 1000)
    });
  }

  // Open the history window
  const historyWindow = await helper.waitForPopup('history.html');
  
  // Check that only the first page of items is shown (10 items)
  await expect(historyWindow.locator('.history-item')).toHaveCount(10);

  // Go to next page
  await historyWindow.click('button:text("Next")');
  await expect(historyWindow.locator('.history-item:first-child .history-item-title')).toContainText('Example Page 5');
  await expect(historyWindow.locator('.history-item:first-child .history-item-url')).toContainText('https://example.com/page5');
  await expect(historyWindow.locator('.history-item:last-child .history-item-title')).toContainText('Example Page 1');
  await expect(historyWindow.locator('.history-item:last-child .history-item-url')).toContainText('https://example.com/page1');
  await expect(historyWindow.locator('.history-item')).toHaveCount(5);

  // Go back to first page
  await historyWindow.click('button:text("Previous")');
  await expect(historyWindow.locator('.history-item:first-child .history-item-title')).toContainText('Example Page 15');
  await expect(historyWindow.locator('.history-item:first-child .history-item-url')).toContainText('https://example.com/page15');
  await expect(historyWindow.locator('.history-item:last-child .history-item-title')).toContainText('Example Page 6');
  await expect(historyWindow.locator('.history-item:last-child .history-item-url')).toContainText('https://example.com/page6');
  await expect(historyWindow.locator('.history-item')).toHaveCount(10);
});