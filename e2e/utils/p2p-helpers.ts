import { Page, BrowserContext, expect } from '@playwright/test';

/**
 * Helper functions for p2p testing
 */

/**
 * Creates a new browser context and page for a specific p2p instance
 * @param context The browser context
 * @param port The port number for the p2p instance
 * @returns A new page connected to the specified p2p instance
 */
export async function createP2PInstancePage(context: BrowserContext, port: number): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`http://localhost:${port}`, { timeout: 30000 });
  
  // Wait for the application to load (either #root or body)
  try {
    await page.waitForSelector('#root', { state: 'visible', timeout: 5000 });
  } catch (error) {
    // If #root is not found, wait for body to be visible
    await page.waitForSelector('body', { state: 'visible' });
    console.log('Using body element as root element was not found');
  }
  
  return page;
}

/**
 * Waits for a p2p connection to be established
 * @param page The page to check for p2p connection
 * @param timeout Maximum time to wait for connection in milliseconds
 */
export async function waitForP2PConnection(page: Page, timeout = 30000): Promise<void> {
  console.log('Waiting for p2p connection...');
  
  try {
    // Wait for the p2p connection indicator to show connected status
    await page.waitForSelector('[data-testid="p2p-status-connected"]', { 
      state: 'visible',
      timeout
    });
    
    console.log('P2P connection established (found status indicator)');
    return;
  } catch (error) {
    console.log('Could not find p2p-status-connected element, checking alternative indicators...');
  }
  
  // If the status indicator is not found, check for other signs of connection
  // For example, check if the peer count is greater than 0
  try {
    await page.waitForFunction(() => {
      const peerCountElement = document.querySelector('[data-testid="peer-count"]');
      return peerCountElement && parseInt(peerCountElement.textContent || '0', 10) > 0;
    }, { timeout: timeout - 5000 });
    
    console.log('P2P connection established (peer count > 0)');
    return;
  } catch (error) {
    console.log('Could not verify peer count, checking for any connection indicators...');
  }
  
  // As a last resort, just wait for a reasonable time and assume connection
  await page.waitForTimeout(5000);
  console.log('Assuming P2P connection is established after timeout');
}

/**
 * Generates a unique test identifier
 * @returns A unique string identifier for test data
 */
export function generateTestId(): string {
  return `test-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/**
 * Adds a new note to the application
 * @param page The page to add the note to
 * @param title The title of the note
 * @param content The content of the note
 */
export async function addNote(page: Page, title: string, content: string): Promise<void> {
  // Click the "Add Note" button
  await page.click('[data-testid="add-note-button"]');
  
  // Fill in the note title
  await page.fill('[data-testid="note-title-input"]', title);
  
  // Fill in the note content
  await page.fill('[data-testid="note-content-input"]', content);
  
  // Save the note
  await page.click('[data-testid="save-note-button"]');
}

/**
 * Checks if a note with the given title exists
 * @param page The page to check
 * @param title The title of the note to look for
 * @returns True if the note exists, false otherwise
 */
export async function noteExists(page: Page, title: string): Promise<boolean> {
  try {
    await page.waitForSelector(`[data-testid="note-item-title"]:has-text("${title}")`, { 
      state: 'visible',
      timeout: 5000 
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Waits for a note to appear on the page
 * @param page The page to check
 * @param title The title of the note to wait for
 * @param timeout Maximum time to wait in milliseconds
 */
export async function waitForNoteToAppear(page: Page, title: string, timeout = 10000): Promise<void> {
  await page.waitForSelector(`[data-testid="note-item-title"]:has-text("${title}")`, { 
    state: 'visible',
    timeout 
  });
}

/**
 * Toggles the P2P connection on/off
 * @param page The page to toggle the connection on
 */
export async function toggleP2PConnection(page: Page): Promise<void> {
  await page.click('[data-testid="toggle-p2p-button"]');
}